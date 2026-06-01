-- =============================================
-- FotoTec ERP/CRM/SCM/RH - D1 Schema
-- =============================================

-- Users & Auth
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  avatar TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'cliente' CHECK(role IN ('super_admin','gerente_ventas','coordinador_scm','coordinador_rrhh','empleado','cliente')),
  active INTEGER NOT NULL DEFAULT 1,
  last_login TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(active);

-- Clients (CRM)
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'MX',
  rfc TEXT,
  segment TEXT CHECK(segment IN ('corporativo','pequena','media','personal','fotografo')),
  industry TEXT,
  website TEXT,
  notes TEXT,
  lifetime_value REAL DEFAULT 0,
  tags TEXT,
  assigned_to TEXT REFERENCES users(id),
  source TEXT CHECK(source IN ('web','referido','campana','redes','otro')),
  user_id TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX idx_clients_name ON clients(name);
CREATE INDEX idx_clients_segment ON clients(segment);
CREATE INDEX idx_clients_assigned ON clients(assigned_to);

-- Leads (CRM Pipeline)
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  stage TEXT NOT NULL DEFAULT 'nuevo' CHECK(stage IN ('nuevo','contactado','calificado','propuesta','negociacion','ganado','perdido')),
  source TEXT,
  probability INTEGER DEFAULT 0,
  estimated_value REAL DEFAULT 0,
  notes TEXT,
  converted_at TEXT,
  assigned_to TEXT REFERENCES users(id),
  client_id TEXT REFERENCES clients(id),
  user_id TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX idx_leads_stage ON leads(stage);
CREATE INDEX idx_leads_assigned ON leads(assigned_to);

-- Quotes (Cotizaciones)
CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  folio TEXT UNIQUE NOT NULL,
  client_id TEXT REFERENCES clients(id),
  user_id TEXT REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'borrador' CHECK(status IN ('borrador','enviado','aprobado','rechazado','vencido')),
  subtotal REAL NOT NULL DEFAULT 0,
  tax_rate REAL DEFAULT 16,
  tax_amount REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  valid_until TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS quote_items (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  quote_id TEXT NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  product_id TEXT,
  description TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Invoices (Facturas)
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  folio TEXT UNIQUE NOT NULL,
  client_id TEXT REFERENCES clients(id),
  quote_id TEXT REFERENCES quotes(id),
  user_id TEXT REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK(status IN ('pendiente','pagado','vencido','cancelado')),
  subtotal REAL NOT NULL DEFAULT 0,
  tax_rate REAL DEFAULT 16,
  tax_amount REAL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  paid_amount REAL DEFAULT 0,
  fecha_emision TEXT,
  fecha_vencimiento TEXT,
  payment_method TEXT,
  payment_reference TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  invoice_id TEXT NOT NULL REFERENCES invoices(id),
  amount REAL NOT NULL,
  method TEXT CHECK(method IN ('efectivo','tarjeta','transferencia','cheque','oxxo','spei')),
  reference TEXT,
  date TEXT NOT NULL,
  notes TEXT,
  user_id TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_client ON invoices(client_id);

-- Suppliers (SCM)
CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'MX',
  rfc TEXT,
  category TEXT,
  rating INTEGER DEFAULT 3 CHECK(rating BETWEEN 1 AND 5),
  notes TEXT,
  user_id TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Products & Inventory (SCM)
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  description TEXT,
  parent_id TEXT REFERENCES categories(id),
  color TEXT DEFAULT '#8b5cf6',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category_id TEXT REFERENCES categories(id),
  price REAL NOT NULL DEFAULT 0,
  cost REAL DEFAULT 0,
  stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 5,
  unit TEXT DEFAULT 'pieza',
  image_url TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  user_id TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_lowstock ON products(stock);

-- Warehouses
CREATE TABLE IF NOT EXISTS warehouses (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  is_default INTEGER DEFAULT 0,
  capacity INTEGER,
  notes TEXT,
  user_id TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Inventory (stock por almacen)
CREATE TABLE IF NOT EXISTS inventory (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  product_id TEXT NOT NULL REFERENCES products(id),
  warehouse_id TEXT NOT NULL REFERENCES warehouses(id),
  quantity INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  UNIQUE(product_id, warehouse_id)
);

CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE INDEX idx_inventory_warehouse ON inventory(warehouse_id);

-- Stock Movements
CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  product_id TEXT NOT NULL REFERENCES products(id),
  warehouse_id TEXT REFERENCES warehouses(id),
  type TEXT NOT NULL CHECK(type IN ('entrada','salida','ajuste','transferencia','devolucion')),
  quantity INTEGER NOT NULL,
  reason TEXT,
  reference TEXT,
  user_id TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  folio TEXT UNIQUE NOT NULL,
  supplier_id TEXT NOT NULL REFERENCES suppliers(id),
  user_id TEXT REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'borrador' CHECK(status IN ('borrador','enviado','parcial','recibido','cancelado')),
  subtotal REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  total REAL DEFAULT 0,
  expected_date TEXT,
  received_date TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  purchase_order_id TEXT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id),
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  received INTEGER DEFAULT 0,
  unit_price REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0
);

-- HR - Organizational Structure
CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  color TEXT DEFAULT '#8b5cf6',
  parent_id TEXT REFERENCES departments(id),
  manager_id TEXT REFERENCES users(id),
  budget REAL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS positions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  department_id TEXT NOT NULL REFERENCES departments(id),
  level TEXT DEFAULT 'operativo' CHECK(level IN ('estrategico','gerencial','coordinador','supervisor','operativo','temporal')),
  salary_min REAL,
  salary_max REAL,
  description TEXT,
  active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  employee_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  rfc TEXT,
  curp TEXT,
  nss TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  birth_date TEXT,
  hire_date TEXT,
  termination_date TEXT,
  department_id TEXT REFERENCES departments(id),
  position_id TEXT REFERENCES positions(id),
  manager_id TEXT REFERENCES employees(id),
  salary REAL,
  pay_type TEXT DEFAULT 'mensual' CHECK(pay_type IN ('mensual','quincenal','semanal','diario')),
  photo_url TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  active INTEGER DEFAULT 1,
  user_id TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX idx_employees_dept ON employees(department_id);
CREATE INDEX idx_employees_active ON employees(active);

-- Attendance
CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  employee_id TEXT NOT NULL REFERENCES employees(id),
  date TEXT NOT NULL,
  clock_in TEXT,
  clock_out TEXT,
  status TEXT DEFAULT 'presente' CHECK(status IN ('presente','falta','retardo','permiso','vacaciones')),
  hours_worked REAL,
  notes TEXT,
  user_id TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  UNIQUE(employee_id, date)
);

CREATE INDEX idx_attendance_employee ON attendance(employee_id);
CREATE INDEX idx_attendance_date ON attendance(date);

-- Leaves (Permisos)
CREATE TABLE IF NOT EXISTS leaves (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  employee_id TEXT NOT NULL REFERENCES employees(id),
  type TEXT NOT NULL CHECK(type IN ('vacaciones','enfermedad','personal','maternidad','paternidad','luto','otro')),
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  days INTEGER NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pendiente' CHECK(status IN ('pendiente','aprobado','rechazado','cancelado')),
  approved_by TEXT REFERENCES users(id),
  approved_at TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Trainings
CREATE TABLE IF NOT EXISTS trainings (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  title TEXT NOT NULL,
  description TEXT,
  instructor TEXT,
  department_id TEXT REFERENCES departments(id),
  start_date TEXT,
  end_date TEXT,
  duration_hours INTEGER,
  location TEXT,
  max_participants INTEGER DEFAULT 20,
  cost REAL DEFAULT 0,
  status TEXT DEFAULT 'planificado' CHECK(status IN ('planificado','en_curso','completado','cancelado')),
  user_id TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS training_enrollments (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  training_id TEXT NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL REFERENCES employees(id),
  status TEXT DEFAULT 'registrado' CHECK(status IN ('registrado','asistio','completo','cancelo','reprobo')),
  score REAL,
  completed_at TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Reviews (Evaluaciones)
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  employee_id TEXT NOT NULL REFERENCES employees(id),
  reviewer_id TEXT REFERENCES users(id),
  period TEXT,
  review_date TEXT NOT NULL,
  overall_score REAL CHECK(overall_score BETWEEN 1 AND 5),
  punctuality REAL CHECK(punctuality BETWEEN 1 AND 5),
  productivity REAL CHECK(productivity BETWEEN 1 AND 5),
  quality REAL CHECK(quality BETWEEN 1 AND 5),
  teamwork REAL CHECK(teamwork BETWEEN 1 AND 5),
  initiative REAL CHECK(initiative BETWEEN 1 AND 5),
  comments TEXT,
  goals TEXT,
  user_id TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- CRM - Appointments
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  title TEXT NOT NULL,
  description TEXT,
  client_id TEXT REFERENCES clients(id),
  employee_id TEXT REFERENCES employees(id),
  start_time TEXT NOT NULL,
  end_time TEXT,
  location TEXT,
  type TEXT CHECK(type IN ('cita','reunion','sesion','entrega','otro')),
  status TEXT DEFAULT 'programada' CHECK(status IN ('programada','confirmada','completada','cancelada','no_asistio')),
  reminder_sent INTEGER DEFAULT 0,
  user_id TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX idx_appointments_start ON appointments(start_time);
CREATE INDEX idx_appointments_client ON appointments(client_id);

-- Tickets
CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  folio TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  client_id TEXT REFERENCES clients(id),
  assigned_to TEXT REFERENCES users(id),
  priority TEXT DEFAULT 'media' CHECK(priority IN ('baja','media','alta','urgente')),
  status TEXT DEFAULT 'abierto' CHECK(status IN ('abierto','en_proceso','pendiente','resuelto','cerrado')),
  category TEXT CHECK(category IN ('soporte','ventas','tecnico','facturacion','otro')),
  sla_deadline TEXT,
  resolved_at TEXT,
  rating INTEGER,
  user_id TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);

-- Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  type TEXT CHECK(type IN ('email','sms','redes','evento','promocion')),
  status TEXT DEFAULT 'borrador' CHECK(status IN ('borrador','activa','pausada','completada','cancelada')),
  start_date TEXT,
  end_date TEXT,
  budget REAL,
  spent REAL DEFAULT 0,
  target_audience TEXT,
  description TEXT,
  user_id TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Surveys
CREATE TABLE IF NOT EXISTS surveys (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  title TEXT NOT NULL,
  type TEXT CHECK(type IN ('satisfaccion','nps','feedback','evaluacion')),
  questions TEXT,
  active INTEGER DEFAULT 1,
  user_id TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Activities
CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  type TEXT NOT NULL CHECK(type IN ('llamada','email','reunion','nota','tarea','evento')),
  title TEXT NOT NULL,
  description TEXT,
  entity_type TEXT,
  entity_id TEXT,
  due_date TEXT,
  completed INTEGER DEFAULT 0,
  assigned_to TEXT REFERENCES users(id),
  user_id TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX idx_activities_entity ON activities(entity_type, entity_id);

-- Notes
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  content TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT DEFAULT 'info' CHECK(type IN ('info','success','warning','error')),
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  read_at TEXT,
  priority TEXT DEFAULT 'normal' CHECK(priority IN ('baja','normal','alta')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read_at);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  old_data TEXT,
  new_data TEXT,
  ip_address TEXT,
  user_id TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  type TEXT DEFAULT 'string' CHECK(type IN ('string','number','boolean','json')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Roles (static in code, stored for reference)
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  permissions TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- ========================
-- Seed Data
-- ========================

INSERT INTO roles (name, description, permissions) VALUES
('super_admin', 'Administrador del sistema', '["*"]'),
('gerente_ventas', 'Gerente de ventas', '["crm.*","reports.view","users.view"]'),
('coordinador_scm', 'Coordinador SCM', '["scm.*","reports.view"]'),
('coordinador_rrhh', 'Coordinador RRHH', '["rh.*","reports.view"]'),
('empleado', 'Empleado basico', '["crm.view","rh.view.own"]'),
('cliente', 'Cliente portal', '["portal.*"]');

-- Admin user (password: admin123)
INSERT INTO users (name, email, password, role, active) VALUES
('Administrador', 'admin@fototec.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.qVIeNhLfF3vFy.', 'super_admin', 1);

-- Departments
INSERT INTO departments (name, code, color) VALUES
('Ventas', 'VENT', '#3b82f6'),
('SCM / Almacen', 'SCMM', '#10b981'),
('Recursos Humanos', 'RRHH', '#ef4444'),
('Fotografia', 'FOTO', '#f59e0b'),
('Edicion / Post', 'EDIT', '#8b5cf6'),
('Admin', 'ADMIN', '#6b7280');

-- Positions
INSERT INTO positions (name, department_id, level, salary_min, salary_max) VALUES
('Gerente General', 6, 'estrategico', 50000, 80000),
('Gerente de Ventas', 1, 'gerencial', 30000, 50000),
('Coordinador de Ventas', 1, 'coordinador', 20000, 30000),
('Ejecutivo de Ventas', 1, 'operativo', 10000, 20000),
('Coordinador SCM', 2, 'coordinador', 20000, 30000),
('Almacenista', 2, 'operativo', 8000, 12000),
('Coordinador RRHH', 3, 'coordinador', 20000, 30000),
('Recursos Humanos', 3, 'operativo', 10000, 18000),
('Fotografo Senior', 4, 'supervisor', 15000, 25000),
('Fotografo Junior', 4, 'operativo', 8000, 15000),
('Editor Senior', 5, 'supervisor', 15000, 25000),
('Editor Junior', 5, 'operativo', 8000, 15000);

-- Employees
INSERT INTO employees (employee_number, name, email, phone, department_id, position_id, hire_date, salary) VALUES
('EMP-0001', 'Maria Lopez', 'maria@fototec.com', '8991234567', 1, 2, '2022-01-15', 35000),
('EMP-0002', 'Carlos Mendez', 'carlos@fototec.com', '8992345678', 1, 4, '2023-03-01', 15000),
('EMP-0003', 'Ana Garcia', 'ana@fototec.com', '8993456789', 2, 5, '2022-06-01', 25000),
('EMP-0004', 'Roberto Solis', 'roberto@fototec.com', '8994567890', 2, 6, '2023-09-15', 10000),
('EMP-0005', 'Laura Torres', 'laura@fototec.com', '8995678901', 3, 7, '2022-02-01', 22000),
('EMP-0006', 'Jose Ramirez', 'jose@fototec.com', '8996789012', 4, 9, '2021-08-01', 20000),
('EMP-0007', 'Sofia Hernandez', 'sofia@fototec.com', '8997890123', 5, 11, '2022-04-01', 18000);

-- Warehouses
INSERT INTO warehouses (name, address, city, is_default) VALUES
('Almacen Principal', 'Av. Industrial 500', 'Reynosa', 1),
('Almacen Secundario', 'Blvd. Las Fuentes 230', 'Reynosa', 0);

-- Categories
INSERT INTO categories (name, color) VALUES
('Sesiones Fotograficas', '#8b5cf6'),
('Eventos', '#3b82f6'),
('Producto', '#10b981'),
('Edicion', '#f59e0b'),
('Paquetes', '#ec4899'),
('Accesorios', '#06b6d4');

-- Products
INSERT INTO products (sku, name, category_id, price, cost, stock, min_stock, unit) VALUES
('SES-BOD-01', 'Sesion Boudoir 2hrs', 1, 3500, 500, 99, 0, 'sesion'),
('SES-FAM-01', 'Sesion Familiar 3hrs', 1, 2800, 400, 99, 0, 'sesion'),
('SES-CORP-01', 'Sesion Corporativa 4hrs', 1, 4500, 600, 99, 0, 'sesion'),
('SES-CAKE-01', 'Sesion Cake Smash', 1, 2200, 300, 99, 0, 'sesion'),
('EVT-QUIN-01', 'Evento Quinceanero', 2, 15000, 3000, 20, 0, 'evento'),
('EVT-BOD-01', 'Bodas Completo', 2, 35000, 8000, 15, 0, 'evento'),
('EVT-GRA-01', 'Graduaciones', 2, 8000, 1500, 30, 0, 'evento'),
('PRD-FOTO-8X10', 'Impresion 8x10 Premium', 3, 150, 30, 500, 50, 'pieza'),
('PRD-FOTO-16X20', 'Impresion 16x20 Premium', 3, 350, 70, 300, 30, 'pieza'),
('PRD-ALB-01', 'Album de Fotos 20pag', 3, 2500, 600, 50, 5, 'unidad'),
('PRD-CANVAS-01', 'Canvas 50x70', 3, 1200, 300, 100, 10, 'unidad'),
('PAQ-BAS-01', 'Paquete Basico', 5, 4500, 800, 99, 0, 'paquete'),
('PAQ-STD-01', 'Paquete Estandar', 5, 8000, 1200, 99, 0, 'paquete'),
('PAQ-PREM-01', 'Paquete Premium', 5, 15000, 2000, 99, 0, 'paquete');

-- Suppliers
INSERT INTO suppliers (name, contact_name, email, phone, city, category, rating) VALUES
('Estudio Print MX', 'Pedro Garza', 'pedro@estudioprint.mx', '8180001111', 'Monterrey', 'Impresiones', 5),
('Album Factory', 'Sofia Ruiz', 'sofia@albumfactory.com', '5551234567', 'CDMX', 'Albums', 4),
('TechPhoto SA', 'Miguel Torres', 'miguel@techphoto.mx', '8991112222', 'Reynosa', 'Equipo', 4),
('Decor Events', 'Elena Cruz', 'elena@decorevents.mx', '8993334444', 'Reynosa', 'Decoracion', 3);

-- Clients
INSERT INTO clients (name, email, phone, company, segment, assigned_to, source) VALUES
('Juan Perez Martinez', 'juan.perez@email.com', '8991112233', NULL, 'personal', 1, 'web'),
('Maria Rodriguez', 'maria.r@empresa.mx', '8992223344', 'Empresa ABC', 'corporativo', 1, 'referido'),
('Carlos Soto', 'csoto@sotocorp.mx', '8993334455', 'Soto Corp SA', 'pequena', 2, 'campana'),
('Laura Gonzalez', 'laura.gonzalez@email.com', '8994445566', NULL, 'media', 1, 'redes'),
('Fotografo Freelance', 'foto@freelance.mx', '8995556677', NULL, 'fotografo', 2, 'web');

-- Quotes
INSERT INTO quotes (folio, client_id, user_id, status, subtotal, tax_rate, tax_amount, total) VALUES
('COT-202601-0001', 1, 1, 'enviado', 8000, 16, 1280, 9280),
('COT-202601-0002', 2, 1, 'aprobado', 15000, 16, 2400, 17400),
('COT-202601-0003', 3, 2, 'borrador', 35000, 16, 5600, 40600);

INSERT INTO quote_items (quote_id, description, quantity, unit_price, total) VALUES
((SELECT id FROM quotes WHERE folio='COT-202601-0001'), 'Paquete Estandar - Sesion Familiar', 1, 8000, 8000),
((SELECT id FROM quotes WHERE folio='COT-202601-0002'), 'Evento Quinceanero', 1, 15000, 15000),
((SELECT id FROM quotes WHERE folio='COT-202601-0003'), 'Bodas Completo', 1, 35000, 35000);

-- Invoices
INSERT INTO invoices (folio, client_id, user_id, status, subtotal, tax_rate, tax_amount, total, fecha_emision, fecha_vencimiento) VALUES
('FAC-202601-0001', 1, 1, 'pagado', 4500, 16, 720, 5220, '2026-01-10', '2026-02-10'),
('FAC-202601-0002', 2, 1, 'pendiente', 17400, 16, 2784, 20184, '2026-01-15', '2026-02-15'),
('FAC-202601-0003', 3, 1, 'pagado', 2800, 16, 448, 3248, '2026-01-20', '2026-02-20');

-- Purchase Orders
INSERT INTO purchase_orders (folio, supplier_id, user_id, status, subtotal, tax_amount, total) VALUES
('OC-202601-0001', 1, 3, 'recibido', 5000, 800, 5800),
('OC-202601-0002', 2, 3, 'enviado', 3000, 480, 3480);

INSERT INTO purchase_order_items (purchase_order_id, description, quantity, unit_price, total, received) VALUES
((SELECT id FROM purchase_orders WHERE folio='OC-202601-0001'), 'Impresion 8x10 Premium', 100, 150, 15000, 100),
((SELECT id FROM purchase_orders WHERE folio='OC-202601-0002'), 'Album de Fotos 20pag', 5, 2500, 12500, 0);

-- Settings
INSERT INTO settings (key, value, type) VALUES
('company_name', 'FotoTec Reynosa', 'string'),
('company_rfc', 'FOT-123456789', 'string'),
('company_address', 'Av. principal 123, Reynosa, Tamaulipas', 'string'),
('company_phone', '899-123-4567', 'string'),
('iva_rate', '16', 'number'),
('currency', 'MXN', 'string'),
('low_stock_threshold', '5', 'number'),
('session_duration_default', '2', 'number');
