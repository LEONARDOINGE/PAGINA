import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { parse as gqlParse } from 'graphql';
import { compare as bcryptCompare } from 'bcryptjs';
import type { D1Database } from '@cloudflare/workers-types';

interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  TURSO_URL?: string;
  TURSO_AUTH_TOKEN?: string;
  JWT_SECRET?: string;
  FRONTEND_URL?: string;
  APP_ENV?: string;
}

type Context = { env: Env; err: Error | null };

const app = new Hono<{ Bindings: Env }>();

app.use('*', logger());
app.use('*', cors({
  origin: (origin) => origin || '*',
  allowHeaders: ['Content-Type', 'Authorization', 'X-User-Id', 'X-User-Role'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: false,
}));

function auditLog(env: Env, action: string, entityType: string, entityId: string | null, userId: string | null, oldData?: unknown, newData?: unknown) {
  const now = new Date().toISOString();
  env.DB.prepare(`
    INSERT INTO audit_logs (id, action, entity_type, entity_id, old_data, new_data, user_id, created_at)
    VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    action, entityType, entityId || '',
    oldData ? JSON.stringify(oldData) : null,
    newData ? JSON.stringify(newData) : null,
    userId || '',
    now
  ).run();
}

function generateId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

function hashPassword(password: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'fototec_salt_2024');
  let hash = 2166136261;
  for (let i = 0; i < data.length; i++) {
    hash ^= data[i];
    hash = Math.imul(hash, 16777619);
  }
  return 'ft$' + Math.abs(hash).toString(16).padStart(16, '0');
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (hash.startsWith('$2')) {
    return bcryptCompare(password, hash);
  }
  return hashPassword(password) === hash;
}

function requireRole(roles: string[]) {
  return async (c: any, next: () => Promise<void>) => {
    const userRole = c.req.header('X-User-Role');
    if (!userRole || !roles.includes(userRole)) {
      if (roles.includes('super_admin') && userRole === 'super_admin') {
        await next();
      } else if (roles.includes(userRole)) {
        await next();
      } else {
        return c.json({ error: 'No autorizado' }, 403);
      }
    } else {
      await next();
    }
  };
}

function parseFields(fields: string | string[] | null): string[] {
  if (!fields) return ['*'];
  const f = Array.isArray(fields) ? fields : [fields];
  return f.filter(Boolean);
}

// ========================
// AUTH
// ========================
app.post('/auth/login', async (c) => {
  const { email, password } = await c.req.json();
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ? AND active = 1').bind(email).first();
  if (!user) return c.json({ error: 'Credenciales invalidas' }, 401);
  const valid = await verifyPassword(password, user.password as string);
  if (!valid) return c.json({ error: 'Credenciales invalidas' }, 401);
  const token = generateId();
  const now = new Date().toISOString();
  await c.env.DB.prepare('UPDATE users SET last_login = ? WHERE id = ?').bind(now, user.id).run();
  auditLog(c.env, 'login', 'user', user.id as string, user.id as string);
  return c.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar }
  });
});

app.post('/auth/setup-admin', async (c) => {
  const { hash } = await c.req.json();
  if (!hash) return c.json({ error: 'hash required' }, 400);
  await c.env.DB.prepare("UPDATE users SET password = ? WHERE email = 'admin@fototec.com'").bind(hash).run();
  return c.json({ success: true, message: 'Admin password updated' });
});

app.post('/auth/register', async (c) => {
  const { name, email, password } = await c.req.json();
  const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (existing) return c.json({ error: 'Email ya registrado' }, 400);
  const { hash: bcryptHash } = await import('bcryptjs');
  const hash = await bcryptHash(password, 12);
  const id = generateId();
  const now = new Date().toISOString();
  await c.env.DB.prepare(`
    INSERT INTO users (id, name, email, password, role, active, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'cliente', 1, ?, ?)
  `).bind(id, name, email, hash, now, now).run();
  return c.json({ id, name, email, role: 'cliente' });
});

// ========================
// GRAPHQL
// ========================
app.post('/graphql', async (c) => {
  const { query, variables, operationName } = await c.req.json();
  const userId = c.req.header('X-User-Id') || '';
  const userRole = c.req.header('X-User-Role') || 'cliente';

  try {
    const result = await executeGraphQL(query as string, variables || {}, { env: c.env, userId, userRole });
    return c.json(result);
  } catch (err: any) {
    console.error('GraphQL Error:', err.message);
    return c.json({ errors: [{ message: err.message }] }, 400);
  }
});

app.get('/graphql', async (c) => {
  return c.json({ message: 'FotoTec GraphQL API - Use POST for queries' });
});

app.get('/health', async (c) => {
  try {
    await c.env.DB.prepare('SELECT 1').first();
    return c.json({ status: 'ok', timestamp: new Date().toISOString(), workers: 'hono-d1' });
  } catch {
    return c.json({ status: 'error' }, 500);
  }
});

async function executeGraphQL(query: string, variables: Record<string, any>, ctx: { env: Env; userId: string; userRole: string }) {
  const { env, userId, userRole } = ctx;
  const result: Record<string, any> = { data: {} as Record<string, any> };
  const errors: any[] = [];

  let ast: any;
  try {
    ast = gqlParse(query);
  } catch (e: any) {
    throw new Error('Invalid GraphQL: ' + e.message);
  }

  for (const def of ast.definitions) {
    if (def.kind !== 'OperationDefinition') continue;
    const opType = def.operation;
    const name = def.name?.value || opType;

    if (opType === 'query') {
      for (const sel of def.selectionSet.selections) {
        if (sel.kind !== 'Field') continue;
        const fieldName = sel.name.value;
        const args: Record<string, any> = {};
        for (const arg of sel.arguments || []) {
          if (arg.value.kind === 'Variable') {
            args[arg.name.value] = variables[arg.value.name.value];
          } else if (arg.value.kind === 'StringValue') {
            args[arg.name.value] = arg.value.value;
          } else if (arg.value.kind === 'IntValue') {
            args[arg.name.value] = parseInt(arg.value.value, 10);
          } else if (arg.value.kind === 'BooleanValue') {
            args[arg.name.value] = arg.value.value;
          }
        }
        try {
          const res = await resolveQuery(fieldName, args, env, userId, userRole);
          result.data[fieldName] = res;
        } catch (err: any) {
          errors.push({ message: err.message, path: [fieldName] });
        }
      }
    }
  }

  if (errors.length) result.errors = errors;
  return result;
}

async function resolveQuery(name: string, args: Record<string, any>, env: Env, userId: string, userRole: string): Promise<any> {
  switch (name) {
    case 'me': {
      if (!userId) throw new Error('No autenticado');
      return env.DB.prepare('SELECT id, name, email, role, avatar, phone, last_login FROM users WHERE id = ?').bind(userId).first();
    }
    case 'users': {
      const rows = await env.DB.prepare('SELECT id, name, email, role, active, last_login FROM users ORDER BY created_at DESC').all();
      return rows.results;
    }
    case 'roles': {
      const rows = await env.DB.prepare('SELECT * FROM roles ORDER BY name').all();
      return rows.results;
    }

    case 'clients': {
      const { search, segment, page = 1, perPage = 20 } = args;
      let sql = 'SELECT c.*, u.name as assigned_name FROM clients c LEFT JOIN users u ON c.assigned_to = u.id WHERE 1=1';
      const bindings: any[] = [];
      if (search) { sql += ' AND (c.name LIKE ? OR c.email LIKE ? OR c.company LIKE ?)'; bindings.push(`%${search}%`, `%${search}%`, `%${search}%`); }
      if (segment) { sql += ' AND c.segment = ?'; bindings.push(segment); }
      sql += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
      bindings.push(perPage, (page - 1) * perPage);
      const rows = await env.DB.prepare(sql).bind(...bindings).all();
      const countRow = await env.DB.prepare('SELECT COUNT(*) as total FROM clients').first() as any;
      return {
        data: rows.results,
        total: countRow?.total || 0,
        page, perPage
      };
    }
    case 'client': {
      const row = await env.DB.prepare('SELECT * FROM clients WHERE id = ?').bind(args.id).first();
      if (!row) throw new Error('Cliente no encontrado');
      return row;
    }
    case 'leads': {
      const { stage, search } = args;
      let sql = 'SELECT l.*, u.name as assigned_name FROM leads l LEFT JOIN users u ON l.assigned_to = u.id WHERE 1=1';
      const bindings: any[] = [];
      if (stage) { sql += ' AND l.stage = ?'; bindings.push(stage); }
      if (search) { sql += ' AND (l.name LIKE ? OR l.email LIKE ?)'; bindings.push(`%${search}%`, `%${search}%`); }
      sql += ' ORDER BY l.created_at DESC';
      const rows = await env.DB.prepare(sql).bind(...bindings).all();
      return rows.results;
    }
    case 'quotes': {
      const { clientId, status } = args;
      let sql = 'SELECT q.*, c.name as client_name FROM quotes q LEFT JOIN clients c ON q.client_id = c.id WHERE 1=1';
      const bindings: any[] = [];
      if (clientId) { sql += ' AND q.client_id = ?'; bindings.push(clientId); }
      if (status) { sql += ' AND q.status = ?'; bindings.push(status); }
      sql += ' ORDER BY q.created_at DESC';
      const rows = await env.DB.prepare(sql).bind(...bindings).all();
      for (const q of rows.results as any[]) {
        const items = await env.DB.prepare('SELECT * FROM quote_items WHERE quote_id = ?').bind(q.id).all();
        (q as any).items = items.results;
      }
      return rows.results;
    }
    case 'invoices': {
      const { status, clientId } = args;
      let sql = 'SELECT i.*, c.name as client_name FROM invoices i LEFT JOIN clients c ON i.client_id = c.id WHERE 1=1';
      const bindings: any[] = [];
      if (status) { sql += ' AND i.status = ?'; bindings.push(status); }
      if (clientId) { sql += ' AND i.client_id = ?'; bindings.push(clientId); }
      sql += ' ORDER BY i.created_at DESC';
      const rows = await env.DB.prepare(sql).bind(...bindings).all();
      return rows.results;
    }

    case 'suppliers': {
      const { search } = args;
      let sql = 'SELECT * FROM suppliers WHERE 1=1';
      const bindings: any[] = [];
      if (search) { sql += ' AND (name LIKE ? OR email LIKE ?)'; bindings.push(`%${search}%`, `%${search}%`); }
      sql += ' ORDER BY name';
      const rows = await env.DB.prepare(sql).bind(...bindings).all();
      return rows.results;
    }
    case 'products': {
      const { search, categoryId, lowStock } = args;
      let sql = 'SELECT p.*, cat.name as category_name FROM products p LEFT JOIN categories cat ON p.category_id = cat.id WHERE p.active = 1';
      const bindings: any[] = [];
      if (search) { sql += ' AND (p.name LIKE ? OR p.sku LIKE ?)'; bindings.push(`%${search}%`, `%${search}%`); }
      if (categoryId) { sql += ' AND p.category_id = ?'; bindings.push(categoryId); }
      if (lowStock) { sql += ' AND p.stock <= p.min_stock'; }
      sql += ' ORDER BY p.name';
      const rows = await env.DB.prepare(sql).bind(...bindings).all();
      return rows.results;
    }
    case 'product': {
      const row = await env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(args.id).first();
      if (!row) throw new Error('Producto no encontrado');
      return row;
    }
    case 'categories': {
      const rows = await env.DB.prepare('SELECT * FROM categories ORDER BY name').all();
      return rows.results;
    }
    case 'warehouses': {
      const rows = await env.DB.prepare('SELECT * FROM warehouses ORDER BY name').all();
      return rows.results;
    }
    case 'inventory': {
      const { warehouseId } = args;
      let sql = 'SELECT i.*, p.name as product_name, p.sku, w.name as warehouse_name FROM inventory i JOIN products p ON i.product_id = p.id JOIN warehouses w ON i.warehouse_id = w.id WHERE 1=1';
      const bindings: any[] = [];
      if (warehouseId) { sql += ' AND i.warehouse_id = ?'; bindings.push(warehouseId); }
      const rows = await env.DB.prepare(sql).bind(...bindings).all();
      return rows.results;
    }
    case 'stockMovements': {
      const { productId, limit = 50 } = args;
      let sql = 'SELECT sm.*, p.name as product_name, u.name as user_name FROM stock_movements sm LEFT JOIN products p ON sm.product_id = p.id LEFT JOIN users u ON sm.user_id = u.id WHERE 1=1';
      const bindings: any[] = [];
      if (productId) { sql += ' AND sm.product_id = ?'; bindings.push(productId); }
      sql += ' ORDER BY sm.created_at DESC LIMIT ?';
      bindings.push(limit);
      const rows = await env.DB.prepare(sql).bind(...bindings).all();
      return rows.results;
    }
    case 'purchaseOrders': {
      const { status, supplierId } = args;
      let sql = 'SELECT po.*, s.name as supplier_name FROM purchase_orders po LEFT JOIN suppliers s ON po.supplier_id = s.id WHERE 1=1';
      const bindings: any[] = [];
      if (status) { sql += ' AND po.status = ?'; bindings.push(status); }
      if (supplierId) { sql += ' AND po.supplier_id = ?'; bindings.push(supplierId); }
      sql += ' ORDER BY po.created_at DESC';
      const rows = await env.DB.prepare(sql).bind(...bindings).all();
      for (const po of rows.results as any[]) {
        const items = await env.DB.prepare('SELECT * FROM purchase_order_items WHERE purchase_order_id = ?').bind(po.id).all();
        (po as any).items = items.results;
      }
      return rows.results;
    }

    case 'employees': {
      const { search, departmentId, page = 1, perPage = 20, active } = args;
      let sql = `SELECT e.*, d.name as dept_name, p.name as position_name, m.name as manager_name
                 FROM employees e
                 LEFT JOIN departments d ON e.department_id = d.id
                 LEFT JOIN positions p ON e.position_id = p.id
                 LEFT JOIN employees m ON e.manager_id = m.id
                 WHERE 1=1`;
      const bindings: any[] = [];
      if (search) { sql += ' AND (e.name LIKE ? OR e.email LIKE ? OR e.employee_number LIKE ?)'; bindings.push(`%${search}%`, `%${search}%`, `%${search}%`); }
      if (departmentId) { sql += ' AND e.department_id = ?'; bindings.push(departmentId); }
      if (active !== undefined) { sql += ' AND e.active = ?'; bindings.push(active ? 1 : 0); }
      sql += ' ORDER BY e.name LIMIT ? OFFSET ?';
      bindings.push(perPage, (page - 1) * perPage);
      const rows = await env.DB.prepare(sql).bind(...bindings).all();
      return rows.results;
    }
    case 'employee': {
      const row = await env.DB.prepare(`
        SELECT e.*, d.name as dept_name, p.name as position_name
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN positions p ON e.position_id = p.id
        WHERE e.id = ?
      `).bind(args.id).first();
      if (!row) throw new Error('Empleado no encontrado');
      return row;
    }
    case 'departments': {
      const rows = await env.DB.prepare(`
        SELECT d.*, u.name as manager_name,
          (SELECT COUNT(*) FROM employees WHERE department_id = d.id AND active = 1) as employee_count,
          (SELECT SUM(salary) FROM employees WHERE department_id = d.id AND active = 1) as salary_budget
        FROM departments d LEFT JOIN users u ON d.manager_id = u.id ORDER BY d.name
      `).all();
      return rows.results;
    }
    case 'positions': {
      const { departmentId } = args;
      let sql = 'SELECT pos.*, d.name as department_name FROM positions pos LEFT JOIN departments d ON pos.department_id = d.id WHERE pos.active = 1';
      const bindings: any[] = [];
      if (departmentId) { sql += ' AND pos.department_id = ?'; bindings.push(departmentId); }
      const rows = await env.DB.prepare(sql).bind(...bindings).all();
      return rows.results;
    }
    case 'attendance': {
      const { date, employeeId, month, year } = args;
      let sql = 'SELECT a.*, e.name as employee_name FROM attendance a LEFT JOIN employees e ON a.employee_id = e.id WHERE 1=1';
      const bindings: any[] = [];
      if (date) { sql += ' AND a.date = ?'; bindings.push(date); }
      if (employeeId) { sql += ' AND a.employee_id = ?'; bindings.push(employeeId); }
      if (month && year) {
        sql += ' AND CAST(strftime("%m", a.date) AS INTEGER) = ? AND CAST(strftime("%Y", a.date) AS INTEGER) = ?';
        bindings.push(month, year);
      }
      sql += ' ORDER BY a.date DESC, e.name';
      const rows = await env.DB.prepare(sql).bind(...bindings).all();
      return rows.results;
    }
    case 'leaves': {
      const { status, employeeId } = args;
      let sql = 'SELECT l.*, e.name as employee_name FROM leaves l LEFT JOIN employees e ON l.employee_id = e.id WHERE 1=1';
      const bindings: any[] = [];
      if (status) { sql += ' AND l.status = ?'; bindings.push(status); }
      if (employeeId) { sql += ' AND l.employee_id = ?'; bindings.push(employeeId); }
      sql += ' ORDER BY l.created_at DESC';
      const rows = await env.DB.prepare(sql).bind(...bindings).all();
      return rows.results;
    }
    case 'trainings': {
      const rows = await env.DB.prepare('SELECT t.*, d.name as dept_name FROM trainings t LEFT JOIN departments d ON t.department_id = d.id ORDER BY t.start_date DESC').all();
      return rows.results;
    }
    case 'reviews': {
      const { employeeId } = args;
      let sql = 'SELECT r.*, e.name as employee_name, u.name as reviewer_name FROM reviews r LEFT JOIN employees e ON r.employee_id = e.id LEFT JOIN users u ON r.reviewer_id = u.id WHERE 1=1';
      const bindings: any[] = [];
      if (employeeId) { sql += ' AND r.employee_id = ?'; bindings.push(employeeId); }
      sql += ' ORDER BY r.review_date DESC';
      const rows = await env.DB.prepare(sql).bind(...bindings).all();
      return rows.results;
    }
    case 'orgChart': {
      const rows = await env.DB.prepare(`
        SELECT d.*, u.name as manager_name,
          (SELECT COUNT(*) FROM employees WHERE department_id = d.id AND active = 1) as employee_count,
          (SELECT json_group_array(json_object('id', e.id, 'name', e.name, 'position', pos.name))
           FROM employees e LEFT JOIN positions pos ON e.position_id = pos.id
           WHERE e.department_id = d.id AND e.active = 1) as employees
        FROM departments d LEFT JOIN users u ON d.manager_id = u.id ORDER BY d.name
      `).all();
      return rows.results;
    }

    case 'appointments': {
      const { date, from, to } = args;
      let sql = 'SELECT a.*, c.name as client_name, e.name as employee_name FROM appointments a LEFT JOIN clients c ON a.client_id = c.id LEFT JOIN employees e ON a.employee_id = e.id WHERE 1=1';
      const bindings: any[] = [];
      if (date) { sql += ' AND date(a.start_time) = ?'; bindings.push(date); }
      if (from) { sql += ' AND date(a.start_time) >= ?'; bindings.push(from); }
      if (to) { sql += ' AND date(a.start_time) <= ?'; bindings.push(to); }
      sql += ' ORDER BY a.start_time';
      const rows = await env.DB.prepare(sql).bind(...bindings).all();
      return rows.results;
    }
    case 'tickets': {
      const { status, priority } = args;
      let sql = 'SELECT t.*, c.name as client_name, u.name as assigned_name FROM tickets t LEFT JOIN clients c ON t.client_id = c.id LEFT JOIN users u ON t.assigned_to = u.id WHERE 1=1';
      const bindings: any[] = [];
      if (status) { sql += ' AND t.status = ?'; bindings.push(status); }
      if (priority) { sql += ' AND t.priority = ?'; bindings.push(priority); }
      sql += ' ORDER BY t.created_at DESC';
      const rows = await env.DB.prepare(sql).bind(...bindings).all();
      return rows.results;
    }
    case 'campaigns': {
      const { status } = args;
      let sql = 'SELECT * FROM campaigns WHERE 1=1';
      const bindings: any[] = [];
      if (status) { sql += ' AND status = ?'; bindings.push(status); }
      sql += ' ORDER BY created_at DESC';
      const rows = await env.DB.prepare(sql).bind(...bindings).all();
      return rows.results;
    }
    case 'surveys': {
      const rows = await env.DB.prepare('SELECT * FROM surveys WHERE active = 1 ORDER BY created_at DESC').all();
      return rows.results;
    }
    case 'activities': {
      const { entityType, entityId, pending } = args;
      let sql = 'SELECT a.*, u.name as assigned_name FROM activities a LEFT JOIN users u ON a.assigned_to = u.id WHERE 1=1';
      const bindings: any[] = [];
      if (entityType) { sql += ' AND a.entity_type = ?'; bindings.push(entityType); }
      if (entityId) { sql += ' AND a.entity_id = ?'; bindings.push(entityId); }
      if (pending) { sql += ' AND a.completed = 0'; }
      sql += ' ORDER BY a.created_at DESC LIMIT 50';
      const rows = await env.DB.prepare(sql).bind(...bindings).all();
      return rows.results;
    }
    case 'notes': {
      const { entityType, entityId } = args;
      let sql = 'SELECT n.*, u.name as user_name FROM notes n LEFT JOIN users u ON n.user_id = u.id WHERE 1=1';
      const bindings: any[] = [];
      if (entityType) { sql += ' AND n.entity_type = ?'; bindings.push(entityType); }
      if (entityId) { sql += ' AND n.entity_id = ?'; bindings.push(entityId); }
      sql += ' ORDER BY n.created_at DESC';
      const rows = await env.DB.prepare(sql).bind(...bindings).all();
      return rows.results;
    }
    case 'notifications': {
      const { unreadOnly } = args;
      let sql = 'SELECT * FROM notifications WHERE user_id = ?';
      const bindings: any[] = [userId];
      if (unreadOnly) { sql += ' AND read_at IS NULL'; }
      sql += ' ORDER BY created_at DESC LIMIT 50';
      const rows = await env.DB.prepare(sql).bind(...bindings).all();
      return rows.results;
    }
    case 'notificationCount': {
      const row = await env.DB.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read_at IS NULL').bind(userId).first() as any;
      return row?.count || 0;
    }
    case 'auditLogs': {
      const { entityType, limit = 50 } = args;
      let sql = 'SELECT al.*, u.name as user_name FROM audit_logs al LEFT JOIN users u ON al.user_id = u.id WHERE 1=1';
      const bindings: any[] = [];
      if (entityType) { sql += ' AND al.entity_type = ?'; bindings.push(entityType); }
      sql += ' ORDER BY al.created_at DESC LIMIT ?';
      bindings.push(limit);
      const rows = await env.DB.prepare(sql).bind(...bindings).all();
      return rows.results;
    }
    case 'globalSearch': {
      const { query } = args;
      if (!query || query.length < 2) return [];
      const q = `%${query}%`;
      const results: any[] = [];
      const [clients, leads, products, employees] = await Promise.all([
        env.DB.prepare('SELECT id, name, email, "client" as type FROM clients WHERE name LIKE ? OR email LIKE ? LIMIT 5').bind(q, q).all(),
        env.DB.prepare('SELECT id, name, email, "lead" as type FROM leads WHERE name LIKE ? OR email LIKE ? LIMIT 5').bind(q, q).all(),
        env.DB.prepare('SELECT id, name, sku as code, "product" as type FROM products WHERE name LIKE ? OR sku LIKE ? LIMIT 5').bind(q, q).all(),
        env.DB.prepare('SELECT id, name, employee_number as code, "employee" as type FROM employees WHERE name LIKE ? LIMIT 5').bind(q).all(),
      ]);
      results.push(...(clients.results as any[]).map(r => ({ ...r, type: 'Client' })));
      results.push(...(leads.results as any[]).map(r => ({ ...r, type: 'Lead' })));
      results.push(...(products.results as any[]).map(r => ({ ...r, type: 'Product' })));
      results.push(...(employees.results as any[]).map(r => ({ ...r, type: 'Employee' })));
      return results;
    }

    case 'erpDashboard': {
      const [revenueResult, clientsCount, employeesCount, productsLow, invoicesPending, recentInvoices] = await Promise.all([
        env.DB.prepare(`SELECT COALESCE(SUM(total), 0) as revenue, COALESCE(SUM(CASE WHEN status='pagado' THEN total ELSE 0 END), 0) as collected
                         FROM invoices WHERE strftime('%Y-%m', fecha_emision) = strftime('%Y-%m', 'now')`).first() as any,
        env.DB.prepare('SELECT COUNT(*) as count FROM clients').first() as any,
        env.DB.prepare('SELECT COUNT(*) as count FROM employees WHERE active = 1').first() as any,
        env.DB.prepare('SELECT COUNT(*) as count FROM products WHERE stock <= min_stock').first() as any,
        env.DB.prepare(`SELECT COALESCE(SUM(total - paid_amount), 0) as amount FROM invoices WHERE status = 'pendiente'`).first() as any,
        env.DB.prepare('SELECT folio, total, status, fecha_emision, c.name as client_name FROM invoices i LEFT JOIN clients c ON i.client_id = c.id ORDER BY i.created_at DESC LIMIT 5').all(),
      ]);
      return {
        revenueThisMonth: revenueResult?.revenue || 0,
        revenueCollected: revenueResult?.collected || 0,
        invoicesPending: invoicesPending?.amount || 0,
        totalClients: clientsCount?.count || 0,
        totalEmployees: employeesCount?.count || 0,
        lowStockProducts: productsLow?.count || 0,
        recentInvoices: recentInvoices.results,
      };
    }

    case 'crmDashboard': {
      const [totalLeads, stageDist, pipelineValue, openTickets] = await Promise.all([
        env.DB.prepare('SELECT COUNT(*) as count FROM leads WHERE stage NOT IN ("ganado","perdido")').first() as any,
        env.DB.prepare(`SELECT stage, COUNT(*) as count, SUM(estimated_value) as value FROM leads GROUP BY stage`).all() as any,
        env.DB.prepare(`SELECT SUM(estimated_value) as value FROM leads WHERE stage NOT IN ('ganado','perdido')`).first() as any,
        env.DB.prepare('SELECT COUNT(*) as count FROM tickets WHERE status IN ("abierto","en_proceso")').first() as any,
      ]);
      return {
        totalLeads: totalLeads?.count || 0,
        stageDistribution: stageDist?.results || [],
        pipelineValue: pipelineValue?.value || 0,
        openTickets: openTickets?.count || 0,
      };
    }

    case 'scmDashboard': {
      const [totalProducts, lowStock, totalPOs, pendingPOs] = await Promise.all([
        env.DB.prepare('SELECT COUNT(*) as count FROM products WHERE active = 1').first() as any,
        env.DB.prepare('SELECT COUNT(*) as count FROM products WHERE stock <= min_stock').first() as any,
        env.DB.prepare('SELECT COUNT(*) as count FROM purchase_orders').first() as any,
        env.DB.prepare('SELECT COUNT(*) as count FROM purchase_orders WHERE status IN ("borrador","enviado","parcial")').first() as any,
      ]);
      return {
        totalProducts: totalProducts?.count || 0,
        lowStockProducts: lowStock?.count || 0,
        totalPurchaseOrders: totalPOs?.count || 0,
        pendingPurchaseOrders: pendingPOs?.count || 0,
      };
    }

    case 'rhDashboard': {
      const [totalEmployees, activeEmployees, attendanceToday, pendingLeaves] = await Promise.all([
        env.DB.prepare('SELECT COUNT(*) as count FROM employees').first() as any,
        env.DB.prepare('SELECT COUNT(*) as count FROM employees WHERE active = 1').first() as any,
        env.DB.prepare(`SELECT COUNT(*) as count FROM attendance WHERE date = strftime('%Y-%m-%d', 'now') AND status = 'presente'`).first() as any,
        env.DB.prepare('SELECT COUNT(*) as count FROM leaves WHERE status = "pendiente"').first() as any,
      ]);
      return {
        totalEmployees: totalEmployees?.count || 0,
        activeEmployees: activeEmployees?.count || 0,
        attendanceToday: attendanceToday?.count || 0,
        pendingLeaves: pendingLeaves?.count || 0,
      };
    }

    case 'syncToTurso': {
      if (userRole !== 'super_admin') throw new Error('Solo super_admin puede sincronizar');
      const tables = ['clients', 'products', 'employees', 'suppliers'];
      return { success: true, message: 'Sincronizacion preparada - Turso sync disponible via API' };
    }

    default:
      throw new Error(`Unknown query: ${name}`);
  }
}

// ========================
// MUTATIONS
// ========================
// Mutations are handled by parsing "mutation { operation }" patterns
// We'll add common mutations via REST-style endpoints

app.get('/api/clients', async (c) => {
  const search = c.req.query('search') || '';
  const segment = c.req.query('segment') || '';
  const page = Number(c.req.query('page') || 1);
  const perPage = Number(c.req.query('perPage') || 20);
  let sql = 'SELECT c.*, u.name as assigned_name FROM clients c LEFT JOIN users u ON c.assigned_to = u.id WHERE 1=1';
  const bindings: any[] = [];
  if (search) { sql += ' AND (c.name LIKE ? OR c.email LIKE ?)'; bindings.push(`%${search}%`, `%${search}%`); }
  if (segment) { sql += ' AND c.segment = ?'; bindings.push(segment); }
  sql += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
  bindings.push(perPage, (page - 1) * perPage);
  const rows = await c.env.DB.prepare(sql).bind(...bindings).all();
  const countRow = await c.env.DB.prepare('SELECT COUNT(*) as total FROM clients').first() as any;
  return c.json({ data: rows.results, total: countRow?.total || 0, page, perPage });
});

app.post('/api/clients', async (c) => {
  const userId = c.req.header('X-User-Id');
  const data = await c.req.json();
  const id = generateId();
  const now = new Date().toISOString();
  await c.env.DB.prepare(`
    INSERT INTO clients (id, name, email, phone, company, segment, address, city, state, rfc, assigned_to, user_id, source, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, data.name, data.email, data.phone, data.company, data.segment, data.address, data.city, data.state, data.rfc, data.assigned_to, userId, data.source || 'web', now, now).run();
  auditLog(c.env, 'create', 'client', id, userId, null, data);
  const client = await c.env.DB.prepare('SELECT * FROM clients WHERE id = ?').bind(id).first();
  return c.json(client);
});

app.put('/api/clients/:id', async (c) => {
  const userId = c.req.header('X-User-Id');
  const id = c.req.param('id');
  const old = await c.env.DB.prepare('SELECT * FROM clients WHERE id = ?').bind(id).first();
  const data = await c.req.json();
  const now = new Date().toISOString();
  const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(data), now, id];
  await c.env.DB.prepare(`UPDATE clients SET ${fields}, updated_at = ? WHERE id = ?`).bind(...values).run();
  auditLog(c.env, 'update', 'client', id, userId, old, data);
  const client = await c.env.DB.prepare('SELECT * FROM clients WHERE id = ?').bind(id).first();
  return c.json(client);
});

app.delete('/api/clients/:id', async (c) => {
  const userId = c.req.header('X-User-Id');
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM clients WHERE id = ?').bind(id).run();
  auditLog(c.env, 'delete', 'client', id, userId);
  return c.json({ success: true });
});

app.post('/api/leads', async (c) => {
  const userId = c.req.header('X-User-Id');
  const data = await c.req.json();
  const id = generateId();
  const now = new Date().toISOString();
  await c.env.DB.prepare(`
    INSERT INTO leads (id, name, email, phone, company, stage, source, probability, estimated_value, notes, assigned_to, user_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, data.name, data.email, data.phone, data.company, data.stage || 'nuevo', data.source, data.probability || 0, data.estimated_value || 0, data.notes, data.assigned_to, userId, now, now).run();
  auditLog(c.env, 'create', 'lead', id, userId, null, data);
  return c.json(await c.env.DB.prepare('SELECT * FROM leads WHERE id = ?').bind(id).first());
});

app.put('/api/leads/:id/stage', async (c) => {
  const userId = c.req.header('X-User-Id');
  const id = c.req.param('id');
  const { stage } = await c.req.json();
  await c.env.DB.prepare('UPDATE leads SET stage = ?, updated_at = ? WHERE id = ?').bind(stage, new Date().toISOString(), id).run();
  auditLog(c.env, 'stage_change', 'lead', id, userId, null, { stage });
  return c.json(await c.env.DB.prepare('SELECT * FROM leads WHERE id = ?').bind(id).first());
});

app.post('/api/products', async (c) => {
  const userId = c.req.header('X-User-Id');
  const data = await c.req.json();
  const id = generateId();
  const now = new Date().toISOString();
  await c.env.DB.prepare(`
    INSERT INTO products (id, sku, name, description, category_id, price, cost, stock, min_stock, unit, user_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, data.sku, data.name, data.description, data.category_id, data.price, data.cost, data.stock || 0, data.min_stock || 5, data.unit || 'pieza', userId, now, now).run();
  auditLog(c.env, 'create', 'product', id, userId, null, data);
  return c.json(await c.env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first());
});

app.put('/api/products/:id', async (c) => {
  const userId = c.req.header('X-User-Id');
  const id = c.req.param('id');
  const data = await c.req.json();
  const now = new Date().toISOString();
  const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(data), now, id];
  await c.env.DB.prepare(`UPDATE products SET ${fields}, updated_at = ? WHERE id = ?`).bind(...values).run();
  auditLog(c.env, 'update', 'product', id, userId, null, data);
  return c.json(await c.env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first());
});

app.post('/api/products/:id/adjust-stock', async (c) => {
  const userId = c.req.header('X-User-Id');
  const productId = c.req.param('id');
  const { type, quantity, reason, warehouseId } = await c.req.json();
  const product = await c.env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(productId).first() as any;
  if (!product) return c.json({ error: 'Producto no encontrado' }, 404);
  const qty = type === 'salida' ? -Math.abs(quantity) : Math.abs(quantity);
  const newStock = product.stock + qty;
  await c.env.DB.prepare('UPDATE products SET stock = ?, updated_at = ? WHERE id = ?').bind(newStock, new Date().toISOString(), productId).run();
  const movId = generateId();
  await c.env.DB.prepare(`
    INSERT INTO stock_movements (id, product_id, warehouse_id, type, quantity, reason, user_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(movId, productId, warehouseId, type, quantity, reason, userId, new Date().toISOString()).run();
  auditLog(c.env, 'stock_adjust', 'product', productId, userId, { stock: product.stock }, { stock: newStock });
  return c.json({ id: movId, newStock, movementType: type });
});

app.post('/api/employees', async (c) => {
  const userId = c.req.header('X-User-Id');
  const data = await c.req.json();
  const count = await c.env.DB.prepare('SELECT COUNT(*) as c FROM employees').first() as any;
  const num = String(count.c + 1).padStart(4, '0');
  const id = generateId();
  const now = new Date().toISOString();
  await c.env.DB.prepare(`
    INSERT INTO employees (id, employee_number, name, email, phone, department_id, position_id, salary, hire_date, active, user_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
  `).bind(id, `EMP-${num}`, data.name, data.email, data.phone, data.department_id, data.position_id, data.salary, data.hire_date, userId, now, now).run();
  auditLog(c.env, 'create', 'employee', id, userId, null, data);
  return c.json(await c.env.DB.prepare('SELECT * FROM employees WHERE id = ?').bind(id).first());
});

app.post('/api/attendance/:employeeId/clock-in', async (c) => {
  const userId = c.req.header('X-User-Id');
  const employeeId = c.req.param('employeeId');
  const now = new Date().toISOString();
  const date = now.split('T')[0];
  const existing = await c.env.DB.prepare('SELECT * FROM attendance WHERE employee_id = ? AND date = ?').bind(employeeId, date).first();
  if (existing) return c.json({ error: 'Ya se registro asistencia hoy' }, 400);
  const id = generateId();
  await c.env.DB.prepare(`INSERT INTO attendance (id, employee_id, date, clock_in, status, user_id, created_at) VALUES (?, ?, ?, ?, 'presente', ?, ?)`).bind(id, employeeId, date, now, userId, now).run();
  return c.json({ id, clockIn: now });
});

app.post('/api/attendance/:employeeId/clock-out', async (c) => {
  const userId = c.req.header('X-User-Id');
  const employeeId = c.req.param('employeeId');
  const now = new Date().toISOString();
  const date = now.split('T')[0];
  const attendance = await c.env.DB.prepare('SELECT * FROM attendance WHERE employee_id = ? AND date = ?').bind(employeeId, date).first() as any;
  if (!attendance) return c.json({ error: 'No hay registro de entrada' }, 400);
  const clockIn = new Date(attendance.clock_in);
  const clockOut = new Date(now);
  const hours = (clockOut.getTime() - clockIn.getTime()) / 3600000;
  await c.env.DB.prepare('UPDATE attendance SET clock_out = ?, hours_worked = ? WHERE id = ?').bind(now, Math.round(hours * 100) / 100, attendance.id).run();
  return c.json({ id: attendance.id, clockOut: now, hoursWorked: Math.round(hours * 100) / 100 });
});

app.post('/api/leaves', async (c) => {
  const userId = c.req.header('X-User-Id');
  const data = await c.req.json();
  const id = generateId();
  const now = new Date().toISOString();
  await c.env.DB.prepare(`
    INSERT INTO leaves (id, employee_id, type, start_date, end_date, days, reason, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente', ?, ?)
  `).bind(id, data.employee_id, data.type, data.start_date, data.end_date, data.days, data.reason, now, now).run();
  auditLog(c.env, 'request', 'leave', id, userId, null, data);
  return c.json(await c.env.DB.prepare('SELECT * FROM leaves WHERE id = ?').bind(id).first());
});

app.put('/api/leaves/:id/approve', async (c) => {
  const userId = c.req.header('X-User-Id');
  const id = c.req.param('id');
  await c.env.DB.prepare('UPDATE leaves SET status = ?, approved_by = ?, approved_at = ?, updated_at = ? WHERE id = ?').bind('aprobado', userId, new Date().toISOString(), new Date().toISOString(), id).run();
  auditLog(c.env, 'approve', 'leave', id, userId);
  return c.json(await c.env.DB.prepare('SELECT * FROM leaves WHERE id = ?').bind(id).first());
});

app.put('/api/leaves/:id/reject', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('UPDATE leaves SET status = ?, updated_at = ? WHERE id = ?').bind('rechazado', new Date().toISOString(), id).run();
  return c.json(await c.env.DB.prepare('SELECT * FROM leaves WHERE id = ?').bind(id).first());
});

app.post('/api/appointments', async (c) => {
  const userId = c.req.header('X-User-Id');
  const data = await c.req.json();
  const id = generateId();
  const now = new Date().toISOString();
  await c.env.DB.prepare(`
    INSERT INTO appointments (id, title, description, client_id, employee_id, start_time, end_time, location, type, status, user_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'programada', ?, ?, ?)
  `).bind(id, data.title, data.description, data.client_id, data.employee_id, data.start_time, data.end_time, data.location, data.type, userId, now, now).run();
  auditLog(c.env, 'create', 'appointment', id, userId, null, data);
  return c.json(await c.env.DB.prepare('SELECT * FROM appointments WHERE id = ?').bind(id).first());
});

app.post('/api/tickets', async (c) => {
  const userId = c.req.header('X-User-Id');
  const data = await c.req.json();
  const count = await c.env.DB.prepare('SELECT COUNT(*) as c FROM tickets').first() as any;
  const folio = `TKT-${new Date().getFullYear()}-${String(count.c + 1).padStart(4, '0')}`;
  const id = generateId();
  const now = new Date().toISOString();
  const sla = new Date(Date.now() + 24 * 3600000).toISOString();
  await c.env.DB.prepare(`
    INSERT INTO tickets (id, folio, title, description, client_id, priority, status, category, sla_deadline, user_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'abierto', ?, ?, ?, ?, ?)
  `).bind(id, folio, data.title, data.description, data.client_id, data.priority || 'media', data.category, sla, userId, now, now).run();
  auditLog(c.env, 'create', 'ticket', id, userId, null, data);
  return c.json(await c.env.DB.prepare('SELECT * FROM tickets WHERE id = ?').bind(id).first());
});

app.put('/api/tickets/:id', async (c) => {
  const id = c.req.param('id');
  const data = await c.req.json();
  const now = new Date().toISOString();
  const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(data), now, id];
  if (data.status === 'resuelto') {
    values.splice(values.length - 2, 0, now);
    await c.env.DB.prepare(`UPDATE tickets SET ${fields}, resolved_at = ?, updated_at = ? WHERE id = ?`).bind(...values).run();
  } else {
    await c.env.DB.prepare(`UPDATE tickets SET ${fields}, updated_at = ? WHERE id = ?`).bind(...values).run();
  }
  return c.json(await c.env.DB.prepare('SELECT * FROM tickets WHERE id = ?').bind(id).first());
});

app.post('/api/notes', async (c) => {
  const userId = c.req.header('X-User-Id');
  if (!userId) return c.json({ error: 'No autenticado' }, 401);
  const data = await c.req.json();
  const id = generateId();
  const now = new Date().toISOString();
  await c.env.DB.prepare(`INSERT INTO notes (id, content, entity_type, entity_id, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(id, data.content, data.entity_type, data.entity_id, userId, now, now).run();
  return c.json(await c.env.DB.prepare('SELECT * FROM notes WHERE id = ?').bind(id).first());
});

app.post('/api/activities', async (c) => {
  const userId = c.req.header('X-User-Id');
  const data = await c.req.json();
  const id = generateId();
  const now = new Date().toISOString();
  await c.env.DB.prepare(`INSERT INTO activities (id, type, title, description, entity_type, entity_id, due_date, assigned_to, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(id, data.type, data.title, data.description, data.entity_type, data.entity_id, data.due_date, data.assigned_to, userId, now, now).run();
  return c.json(await c.env.DB.prepare('SELECT * FROM activities WHERE id = ?').bind(id).first());
});

app.post('/api/notifications/mark-all-read', async (c) => {
  const userId = c.req.header('X-User-Id');
  if (!userId) return c.json({ error: 'No autenticado' }, 401);
  await c.env.DB.prepare('UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL').bind(new Date().toISOString(), userId).run();
  return c.json({ success: true });
});

app.post('/api/purchase-orders', async (c) => {
  const userId = c.req.header('X-User-Id');
  const data = await c.req.json();
  const count = await c.env.DB.prepare('SELECT COUNT(*) as c FROM purchase_orders').first() as any;
  const folio = `OC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(count.c + 1).padStart(4, '0')}`;
  const id = generateId();
  const now = new Date().toISOString();
  await c.env.DB.prepare(`
    INSERT INTO purchase_orders (id, folio, supplier_id, status, subtotal, tax_amount, total, notes, user_id, created_at, updated_at)
    VALUES (?, ?, ?, 'borrador', ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, folio, data.supplier_id, data.subtotal || 0, data.tax_amount || 0, data.total || 0, data.notes, userId, now, now).run();
  auditLog(c.env, 'create', 'purchase_order', id, userId, null, data);
  return c.json(await c.env.DB.prepare('SELECT * FROM purchase_orders WHERE id = ?').bind(id).first());
});

app.get('/api/settings', async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM settings').all();
  const settings: Record<string, any> = {};
  for (const row of rows.results as any[]) {
    settings[row.key] = row.type === 'number' ? Number(row.value) : row.type === 'boolean' ? row.value === 'true' : row.value;
  }
  return c.json(settings);
});

app.put('/api/settings/:key', async (c) => {
  const key = c.req.param('key');
  const { value } = await c.req.json();
  const now = new Date().toISOString();
  await c.env.DB.prepare(`INSERT INTO settings (id, key, value, updated_at) VALUES (lower(hex(randomblob(16))), ?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?`).bind(key, value, now, value, now).run();
  return c.json({ key, value });
});

app.get('/api/stats/kpis', async (c) => {
  const [revenueRow, clientsRow, employeesRow, productsRow, lowStockRow, pendingInvRow, ticketsRow] = await Promise.all([
    c.env.DB.prepare(`SELECT COALESCE(SUM(total), 0) as v FROM invoices WHERE status='pagado' AND strftime('%Y', fecha_emision) = strftime('%Y', 'now')`).first(),
    c.env.DB.prepare('SELECT COUNT(*) as c FROM clients').first(),
    c.env.DB.prepare('SELECT COUNT(*) as c FROM employees WHERE active=1').first(),
    c.env.DB.prepare('SELECT COUNT(*) as c FROM products WHERE active=1').first(),
    c.env.DB.prepare('SELECT COUNT(*) as c FROM products WHERE stock<=min_stock').first(),
    c.env.DB.prepare(`SELECT COALESCE(SUM(total-paid_amount), 0) as v FROM invoices WHERE status='pendiente'`).first(),
    c.env.DB.prepare(`SELECT COUNT(*) as c FROM tickets WHERE status IN ('abierto','en_proceso')`).first(),
  ]);
  return c.json({
    revenueThisMonth: (revenueRow as any)?.v || 0,
    totalClients: (clientsRow as any)?.c || 0,
    totalEmployees: (employeesRow as any)?.c || 0,
    totalProducts: (productsRow as any)?.c || 0,
    lowStockProducts: (lowStockRow as any)?.c || 0,
    pendingInvoices: (pendingInvRow as any)?.v || 0,
    openTickets: (ticketsRow as any)?.c || 0,
  });
});

export default { fetch: app.fetch };
