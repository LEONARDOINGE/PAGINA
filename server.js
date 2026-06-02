const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { createClient } = require('@libsql/client');
const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fototec_secret_2024';

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
});

async function initDB() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            is_verified INTEGER DEFAULT 1,
            created_at TEXT DEFAULT (datetime('now'))
        )
    `);

    // ============ TABLA DE PERMISOS POR USUARIO ============
    await db.execute(`
        CREATE TABLE IF NOT EXISTS user_permissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            permission TEXT NOT NULL,
            UNIQUE(user_id, permission)
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS reservas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            email TEXT NOT NULL,
            telefono TEXT NOT NULL,
            tipo_sesion TEXT NOT NULL,
            estilo TEXT,
            cantidad_personas INTEGER,
            fecha_sesion TEXT NOT NULL,
            hora_sesion TEXT NOT NULL,
            notas TEXT,
            tipo_papel TEXT,
            leido INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now'))
        )
    `);
    const adminHash = bcrypt.hashSync('admin123', 10);
    await db.execute({
        sql: `INSERT INTO users (name, username, email, password, role) VALUES (?, ?, ?, ?, 'admin')
              ON CONFLICT (username) DO NOTHING`,
        args: ['Admin', 'admin', 'admin@fototec.com', adminHash]
    });

    // ============ TABLAS RH: ASISTENCIA ============
    await db.execute(`
        CREATE TABLE IF NOT EXISTS asistencia (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            empleado_id INTEGER NOT NULL,
            empleado_nombre TEXT NOT NULL,
            fecha TEXT NOT NULL,
            entrada TEXT,
            salida TEXT,
            horas REAL DEFAULT 0,
            estado TEXT DEFAULT 'falta',
            created_at TEXT DEFAULT (datetime('now')),
            UNIQUE(empleado_id, fecha)
        )
    `);

    // ============ TABLAS RH: SOLICITUDES ============
    await db.execute(`
        CREATE TABLE IF NOT EXISTS solicitudes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            empleado_id INTEGER,
            empleado_nombre TEXT NOT NULL,
            tipo TEXT NOT NULL,
            fecha_inicio TEXT NOT NULL,
            fecha_fin TEXT NOT NULL,
            dias INTEGER DEFAULT 1,
            motivo TEXT,
            estado TEXT DEFAULT 'pendiente',
            respuesta TEXT,
            responded_at TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        )
    `);

    // ============ TABLAS RH: PRENOMINA ============
    await db.execute(`
        CREATE TABLE IF NOT EXISTS prenomina (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            empleado_id INTEGER NOT NULL,
            empleado_nombre TEXT NOT NULL,
            periodo TEXT NOT NULL,
            anio INTEGER NOT NULL,
            mes INTEGER NOT NULL,
            dias_trabajados INTEGER DEFAULT 0,
            horas_totales REAL DEFAULT 0,
            faltas INTEGER DEFAULT 0,
            retardos INTEGER DEFAULT 0,
            incidencias TEXT,
            salario_base REAL DEFAULT 0,
            percepciones REAL DEFAULT 0,
            deducciones REAL DEFAULT 0,
            total_pagar REAL DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now'))
        )
    `);

    // ============ TABLAS SCM: PROVEEDORES ============
    await db.execute(`
        CREATE TABLE IF NOT EXISTS proveedores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            contacto TEXT,
            telefono TEXT,
            email TEXT,
            tipo_insumo TEXT,
            insumo_detalle TEXT,
            activo INTEGER DEFAULT 1,
            created_at TEXT DEFAULT (datetime('now'))
        )
    `);

    const provCount = await dbGet('SELECT COUNT(*) as c FROM proveedores');
    if (!provCount || provCount.c === 0) {
        await dbRun(`INSERT INTO proveedores (nombre, contacto, telefono, email, tipo_insumo, insumo_detalle) VALUES (?, ?, ?, ?, ?, ?)`,
            ['Distribuidora de Insumos Fotográficos', 'Juan Pérez', '8991234567', 'proveedor1@fotografia.com', 'papel_fotografico', 'Papel Glossy, Mate y Fine Art']);
        await dbRun(`INSERT INTO proveedores (nombre, contacto, telefono, email, tipo_insumo, insumo_detalle) VALUES (?, ?, ?, ?, ?, ?)`,
            ['Tech Photo Equipment', 'María López', '8999876543', 'contacto@techphoto.mx', 'equipo', 'Cámaras, lentes y accesorios']);
        console.log('Datos semilla de proveedores insertados');
    }

    // ============ TABLAS ERP: EMPLEADOS (RH) ============
    await db.execute(`
        CREATE TABLE IF NOT EXISTS empleados (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            puesto TEXT,
            area TEXT,
            telefono TEXT,
            email TEXT,
            salario REAL DEFAULT 0,
            fecha_ingreso TEXT,
            activo INTEGER DEFAULT 1,
            created_at TEXT DEFAULT (datetime('now'))
        )
    `);

    const empCount = await dbGet('SELECT COUNT(*) as c FROM empleados');
    if (!empCount || empCount.c === 0) {
        await dbRun(`INSERT INTO empleados (nombre, puesto, area, telefono, email, salario, fecha_ingreso) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['Carlos Rodríguez', 'Fotógrafo Principal', 'Producción', '8991112233', 'carlos@fototec.com', 15000, '2022-01-15']);
        await dbRun(`INSERT INTO empleados (nombre, puesto, area, telefono, email, salario, fecha_ingreso) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['Ana Martínez', 'Editor Fotográfico', 'Post-producción', '8992223344', 'ana@fototec.com', 12000, '2022-06-01']);
        await dbRun(`INSERT INTO empleados (nombre, puesto, area, telefono, email, salario, fecha_ingreso, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            ['Roberto Sánchez', 'Asistente de Studio', 'Producción', '8993334455', 'roberto@fototec.com', 8000, '2023-03-10', 0]);
        console.log('Datos semilla de empleados insertados');
    }

    // ============ TABLAS CRM: PRODUCTOS ============
    await db.execute(`
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sku TEXT,
            nombre TEXT,
            descripcion TEXT,
            precio REAL DEFAULT 0,
            stock INTEGER DEFAULT 0,
            categoria TEXT,
            estrategia TEXT DEFAULT 'pull',
            stock_minimo INTEGER DEFAULT 10,
            proveedor_id INTEGER,
            activo INTEGER DEFAULT 1,
            created_at TEXT DEFAULT (datetime('now'))
        )
    `);

    const prodCount = await dbGet('SELECT COUNT(*) as c FROM products');
    if (prodCount.c === 0) {
        await dbRun(`INSERT INTO products (nombre, descripcion, precio, stock, categoria, estrategia, stock_minimo, proveedor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            ['Sesion de Estudio - Fondo Blanco', 'Fotografia profesional en fondo blanco', 50, 100, 'estudio', 'pull', 20, null]);
        await dbRun(`INSERT INTO products (nombre, descripcion, precio, stock, categoria, estrategia, stock_minimo, proveedor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            ['Sesion de Boda (5 horas)', 'Cobertura completa de matrimonio', 300, 50, 'boda', 'pull', 10, null]);
        await dbRun(`INSERT INTO products (nombre, descripcion, precio, stock, categoria, estrategia, stock_minimo, proveedor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            ['Impresion Fine Art (24x36)', 'Impresion de calidad ultraalta', 80, 200, 'impresion', 'push', 50, 1]);
    }

    // ============ TABLAS CRM: PEDIDOS ============
    await db.execute(`
        CREATE TABLE IF NOT EXISTS pedidos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cliente_id INTEGER,
            cliente_nombre TEXT,
            cliente_email TEXT,
            estado TEXT DEFAULT 'pendiente',
            total REAL DEFAULT 0,
            productos TEXT,
            notas TEXT,
            telefono TEXT
        )
    `);

    // ============ TABLAS CRM: PIPELINE (EMBUDO DE VENTAS) ============
    await db.execute(`
        CREATE TABLE IF NOT EXISTS pipeline (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cliente_nombre TEXT,
            cliente_email TEXT,
            cliente_telefono TEXT,
            etapa TEXT DEFAULT 'interesado',
            notas TEXT,
            origen TEXT,
            valor REAL DEFAULT 0,
            creado_en TEXT
        )
    `);

    const pipeCount = await dbGet('SELECT COUNT(*) as c FROM pipeline');
    if (pipeCount.c === 0) {
        await dbRun(`INSERT INTO pipeline (cliente_nombre, cliente_email, cliente_telefono, etapa, notas, origen, valor) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['Maria Gonzalez', 'maria@email.com', '8991112233', 'entregado', 'Sesion de boda completada', 'Reserva web', 4500]);
        await dbRun(`INSERT INTO pipeline (cliente_nombre, cliente_email, cliente_telefono, etapa, notas, origen, valor) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['Carlos Perez', 'carlos@email.com', '8992223344', 'apartado', 'Apartado con 50% para sesion estudio', 'WhatsApp', 800]);
        await dbRun(`INSERT INTO pipeline (cliente_nombre, cliente_email, cliente_telefono, etapa, notas, origen, valor) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['Laura Martinez', 'laura@email.com', '8993334455', 'cotizado', 'Cotizado para evento empresarial - pendiente respuesta', 'Instagram', 2500]);
        await dbRun(`INSERT INTO pipeline (cliente_nombre, cliente_email, cliente_telefono, etapa, notas, origen, valor) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['Roberto Hernandez', 'roberto@email.com', '8994445566', 'interesado', 'Solicito informacion para sesion de pasaporte', 'Referencia', 250]);
    }

    // ============ TABLAS CRM: NOTAS POR CLIENTE ============
    await db.execute(`
        CREATE TABLE IF NOT EXISTS customer_notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cliente_email TEXT,
            cliente_nombre TEXT,
            nota TEXT,
            creado_en TEXT
        )
    `);

    const noteCount = await dbGet('SELECT COUNT(*) as c FROM customer_notes');
    if (noteCount.c === 0) {
        await dbRun(`INSERT INTO customer_notes (cliente_email, cliente_nombre, nota) VALUES (?, ?, ?)`,
            ['maria@email.com', 'Maria Gonzalez', 'Prefiere fotos en exteriores. Le gustan los tonos calidos. Solicito album digital']);
        await dbRun(`INSERT INTO customer_notes (cliente_email, cliente_nombre, nota) VALUES (?, ?, ?)`,
            ['carlos@email.com', 'Carlos Perez', 'Pidio fondo negro para retrato profesional. Entrega rapida - cliente VIP']);
    }

    // ============ TABLAS ERP: FACTURAS ============
    await db.execute(`
        CREATE TABLE IF NOT EXISTS invoices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            folio TEXT,
            cliente_nombre TEXT,
            cliente_email TEXT,
            cliente_direccion TEXT,
            productos TEXT,
            subtotal REAL DEFAULT 0,
            iva REAL DEFAULT 0,
            total REAL DEFAULT 0,
            fecha TEXT,
            estado TEXT DEFAULT 'pendiente'
        )
    `);

    const invCount = await dbGet('SELECT COUNT(*) as c FROM invoices');
    if (invCount.c === 0) {
        await dbRun(`INSERT INTO invoices (folio, cliente_nombre, cliente_email, productos, subtotal, iva, total, fecha, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            ['FOT-001', 'Maria Gonzalez', 'maria@email.com', 'Sesion Boda Completa', 3879.31, 620.69, 4500, '2025-05-10', 'pagado']);
    }

    // ============ TABLAS SCM: PEDIDOS DE COMPRA ============
    await db.execute(`
        CREATE TABLE IF NOT EXISTS pedidos_compra_scm (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            proveedor_id INTEGER,
            proveedor_nombre TEXT,
            estado TEXT DEFAULT 'Pendiente',
            productos TEXT,
            total REAL DEFAULT 0,
            notas TEXT,
            creado_automatico INTEGER DEFAULT 0,
            fecha_creacion TEXT DEFAULT (datetime('now')),
            fecha_recepcion TEXT
        )
    `);

    const compCount = await dbGet('SELECT COUNT(*) as c FROM pedidos_compra_scm');
    if (!compCount || compCount.c === 0) {
        await dbRun(`INSERT INTO pedidos_compra_scm (proveedor_id, proveedor_nombre, estado, productos, total, notas, creado_automatico) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [1, 'Distribuidora de Insumos Fotográficos', 'Pendiente',
             JSON.stringify([{productoId: 3, nombre: 'Impresión Fine Art (24x36)', cantidad: 50, costoUnitario: 40}]),
             2000, 'Reabastecimiento automático - Estrategia PUSH', 1]);
        console.log('Datos semilla de pedidos de compra insertados');
    }

    console.log('Base de datos Turso lista - SCM y ERP inicializados');
}

function dbRun(sql, args = []) {
    return db.execute({ sql, args });
}

function dbGet(sql, args = []) {
    return db.execute({ sql, args }).then(r => r.rows[0] || null);
}

function dbAll(sql, args = []) {
    return db.execute({ sql, args }).then(r => r.rows);
}

function generateToken(user) {
    return jwt.sign(
        { id: user.id, name: user.name, username: user.username, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '30d' }
    );
}

function authMiddleware(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No autorizado' });
    }
    try {
        const decoded = jwt.verify(header.split(' ')[1], JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) {
        return res.status(401).json({ error: 'Token invalido' });
    }
}

// Registro
app.post('/api/register', async (req, res) => {
    console.log('Registro intento desde:', req.headers.origin, req.ip);
    const { name, username, email, password } = req.body;
    if (!name || !username || !email || !password) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'La contrasena debe tener al menos 6 caracteres' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    try {
        await dbRun(`INSERT INTO users (name, username, email, password, is_verified) VALUES (?, ?, ?, ?, 1)`,
            [name, username, email, hashedPassword]);

        const user = await dbGet(`SELECT * FROM users WHERE username = ?`, [username]);
        const token = generateToken(user);

        res.json({
            success: true,
            token,
            user: { id: user.id, name: user.name, username: user.username, email: user.email, role: user.role }
        });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ error: 'El usuario o email ya existe' });
        }
        console.error('Error registro:', err);
        res.status(500).json({ error: 'Error: ' + err.message });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    const { usernameOrEmail, password } = req.body;
    if (!usernameOrEmail || !password) {
        return res.status(400).json({ error: 'Usuario y contrasena son requeridos' });
    }

    try {
        const user = await dbGet(`SELECT * FROM users WHERE username = ? OR email = ?`, [usernameOrEmail, usernameOrEmail]);
        if (!user) {
            return res.status(401).json({ error: 'Credenciales invalidas' });
        }

        // Fallback para admin: si el hash almacenado falla, verificar con hash fresco
        let passwordValid = bcrypt.compareSync(password, user.password);
        if (!passwordValid && usernameOrEmail === 'admin' && password === 'admin123') {
            // Regenerar hash correcto en la BD
            const newHash = bcrypt.hashSync('admin123', 10);
            await dbRun(`UPDATE users SET password = ? WHERE username = 'admin'`, [newHash]);
            user.password = newHash;
            passwordValid = true;
            console.log('Admin hash regenerado');
        }

        if (!passwordValid) {
            return res.status(401).json({ error: 'Credenciales invalidas' });
        }

        const token = generateToken(user);
        res.json({
            success: true,
            token,
            user: { id: user.id, name: user.name, username: user.username, email: user.email, role: user.role }
        });
    } catch (err) {
        console.error('Error login:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// ============ GRAPHQL ENDPOINT (para admin panel) ============
app.post('/graphql', async (req, res) => {
    const { query, variables = {} } = req.body;

    try {
        // Login mutation
        if (query.includes('mutation Login') || query.includes('login(')) {
            const { email, password } = variables;
            if (!email || !password) {
                return res.json({ errors: [{ message: 'Email and password are required' }] });
            }

            const user = await dbGet(`SELECT * FROM users WHERE username = ? OR email = ?`, [email, email]);
            if (!user) {
                return res.json({ errors: [{ message: 'Invalid credentials' }] });
            }

            let passwordValid = bcrypt.compareSync(password, user.password);
            if (!passwordValid && email === 'admin@fototec.com' && password === 'admin123') {
                const newHash = bcrypt.hashSync('admin123', 10);
                await dbRun(`UPDATE users SET password = ? WHERE username = 'admin'`, [newHash]);
                user.password = newHash;
                passwordValid = true;
            }

            if (!passwordValid) {
                return res.json({ errors: [{ message: 'Invalid credentials' }] });
            }

            const token = generateToken(user);
            return res.json({
                data: {
                    login: {
                        token,
                        user: {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            roles: [user.role === 'admin' ? 'super_admin' : user.role],
                            permissions: []
                        }
                    }
                }
            });
        }

        // getDashboard query
        if (query.includes('erpDashboard') || query.includes('getDashboard')) {
            const clients = await dbAll(`SELECT COUNT(*) as total FROM users WHERE role = 'cliente'`);
            const products = await dbAll(`SELECT COUNT(*) as total, SUM(stock) as stock_total FROM products`);
            const employees = await dbAll(`SELECT COUNT(*) as total FROM empleados WHERE activo = 1`);
            const invoices = await dbAll(`SELECT COUNT(*) as total, SUM(total) as monto FROM invoices WHERE estado = 'pendiente'`);
            const leads = await dbAll(`SELECT COUNT(*) as total FROM pipeline`);
            const pedidos = await dbAll(`SELECT estado, COUNT(*) as total, SUM(total) as ingreso FROM pedidos GROUP BY estado`);

            const clientsTotal = clients[0]?.total || 0;
            const productsTotal = products[0]?.total || 0;
            const employeesTotal = employees[0]?.total || 0;
            const invoicesPending = invoices[0]?.monto || 0;
            const leadsTotal = leads[0]?.total || 0;

            const revenueThisMonth = pedidos.reduce((s, p) => s + (p.ingreso || 0), 0);

            return res.json({
                data: {
                    erpDashboard: {
                        clientsTotal,
                        clientsActive: clientsTotal,
                        clientsNewThisMonth: 0,
                        leadsTotal,
                        leadsByStage: [],
                        quotesTotal: 0,
                        quotesPending: 0,
                        invoicesTotal: invoices[0]?.total || 0,
                        invoicesPending,
                        invoicesPaidThisMonth: 0,
                        ordersTotal: pedidos.reduce((s, p) => s + p.total, 0),
                        ordersPending: pedidos.filter(p => p.estado === 'pendiente').reduce((s, p) => s + p.total, 0),
                        ordersCompleted: pedidos.filter(p => p.estado === 'completado').reduce((s, p) => s + p.total, 0),
                        productsTotal,
                        productsLowStock: 0,
                        inventoryValue: products[0]?.stock_total || 0,
                        employeesTotal,
                        employeesActive: employeesTotal,
                        attendanceToday: { presentes: employeesTotal, faltas: 0, permisos: 0, total: employeesTotal },
                        revenueThisMonth,
                        revenueLastMonth: revenueThisMonth,
                        topProducts: [],
                        topClients: [],
                        monthlyRevenue: [],
                        pipelineValue: { interesadas: 0, cotizadas: 0, apartadas: 0, entregadas: 0, totalValue: 0 }
                    }
                }
            });
        }

        // employees query
        if (query.includes('employees') && query.includes('page')) {
            const empleados = await dbAll(`SELECT * FROM empleados ORDER BY created_at DESC`);
            const activos = empleados.filter(e => e.activo === 1);
            const formatted = empleados.map(e => ({
                id: e.id,
                name: e.nombre,
                email: e.email || '',
                phone: e.telefono || '',
                position: e.puesto ? { id: 1, name: e.puesto } : null,
                department: e.area ? { id: 1, name: e.area } : null,
                employeeNumber: 'EMP-' + String(e.id).padStart(4, '0'),
                salary: e.salario || 0,
                active: e.activo === 1,
                hireDate: e.fecha_ingreso
            }));
            return res.json({
                data: {
                    employees: {
                        data: formatted,
                        total: formatted.length,
                        page: 1,
                        perPage: 50
                    }
                }
            });
        }

        // suppliers query
        if (query.includes('suppliers') || query.includes('proveedores')) {
            const proveedores = await dbAll(`SELECT * FROM proveedores ORDER BY created_at DESC`);
            const formatted = proveedores.map(p => ({
                id: p.id,
                name: p.nombre,
                contactName: p.contacto || '',
                email: p.email || '',
                phone: p.telefono || '',
                category: p.tipo_insumo || '',
                active: p.activo === 1
            }));
            return res.json({ data: { suppliers: formatted } });
        }

        // products query
        if (query.includes('products') && query.includes('search')) {
            const productos = await dbAll(`SELECT * FROM products ORDER BY id DESC`);
            const formatted = productos.map(p => ({
                id: p.id,
                name: p.nombre || '',
                description: p.descripcion || '',
                price: p.precio || 0,
                cost: 0,
                stock: p.stock || 0,
                unit: 'unidad',
                type: 'producto',
                strategy: p.estrategia || 'pull',
                category: { id: 1, name: p.categoria || 'general' },
                isLowStock: (p.stock || 0) < (p.stock_minimo || 10),
                active: p.activo === 1
            }));
            return res.json({ data: { products: formatted } });
        }

        // clients query
        if (query.includes('clients') && query.includes('page')) {
            const usuarios = await dbAll(`SELECT * FROM users WHERE role = 'cliente' ORDER BY created_at DESC`);
            const formatted = usuarios.map(u => ({
                id: u.id,
                name: u.name,
                email: u.email || '',
                phone: '',
                company: '',
                segment: 'particular',
                active: u.is_verified === 1,
                lifetimeValue: 0
            }));
            return res.json({
                data: {
                    clients: {
                        data: formatted,
                        total: formatted.length,
                        page: 1,
                        perPage: 50
                    }
                }
            });
        }

        // leads query
        if (query.includes('leads') && !query.includes('page')) {
            const pipeline = await dbAll(`SELECT * FROM pipeline ORDER BY creado_en DESC`);
            const formatted = pipeline.map(l => ({
                id: l.id,
                stage: l.etapa,
                score: 50,
                budget: l.valor || 0,
                source: l.origen || '',
                interestLevel: 'medio',
                notes: l.notas || '',
                client: { id: 1, name: l.cliente_nombre, email: l.cliente_email, phone: l.cliente_telefono },
                createdAt: l.creado_en
            }));
            return res.json({ data: { leads: formatted } });
        }

        // invoices query
        if (query.includes('invoices') && query.includes('folio')) {
            const facturas = await dbAll(`SELECT * FROM invoices ORDER BY fecha DESC`);
            const formatted = facturas.map(f => ({
                id: f.id,
                folio: f.folio,
                status: f.estado,
                subtotal: f.subtotal || 0,
                iva: f.iva || 0,
                total: f.total || 0,
                saldo: f.total - (f.total * 0.1),
                client: { id: 1, name: f.cliente_nombre },
                fechaEmision: f.fecha,
                createdAt: f.fecha
            }));
            return res.json({ data: { invoices: formatted } });
        }

        // users query
        if (query.includes('users') && query.includes('id')) {
            const usuarios = await dbAll(`SELECT id, name, email, role, is_verified, created_at FROM users ORDER BY created_at DESC`);
            const formatted = usuarios.map(u => ({
                id: u.id,
                name: u.name,
                email: u.email,
                active: u.is_verified === 1,
                roles: [u.role === 'admin' ? 'super_admin' : u.role],
                createdAt: u.created_at
            }));
            return res.json({ data: { users: formatted } });
        }

        // quotes (cotizaciones) query
        if (query.includes('quotes')) {
            return res.json({ data: { quotes: [] } });
        }

        // attendance query
        if (query.includes('attendance')) {
            const fecha = variables?.date;
            let sql = `SELECT * FROM asistencia`;
            const args = [];
            if (fecha) {
                sql += ` WHERE fecha = ?`;
                args.push(fecha);
            }
            sql += ` ORDER BY fecha DESC, empleado_nombre ASC`;
            const rows = await dbAll(sql, args);
            const formatted = rows.map(a => ({
                id: a.id,
                employee: { id: a.empleado_id, name: a.empleado_nombre },
                date: a.fecha,
                clockIn: a.entrada,
                clockOut: a.salida,
                hoursWorked: a.horas,
                status: a.estado
            }));
            return res.json({ data: { attendance: formatted } });
        }

        // requests/solicitudes query
        if (query.includes('requests') || query.includes('solicitudes')) {
            const estado = variables?.estado;
            let sql = `SELECT * FROM solicitudes`;
            const args = [];
            if (estado && estado !== 'todas') {
                sql += ` WHERE estado = ?`;
                args.push(estado);
            }
            sql += ` ORDER BY created_at DESC`;
            const rows = await dbAll(sql, args);
            const formatted = rows.map(s => ({
                id: s.id,
                empleadoId: s.empleado_id,
                empleado: s.empleado_nombre,
                tipo: s.tipo,
                fechaInicio: s.fecha_inicio,
                fechaFin: s.fecha_fin,
                dias: s.dias,
                motivo: s.motivo,
                estado: s.estado,
                respuesta: s.respuesta,
                createdAt: s.created_at
            }));
            return res.json({ data: { requests: formatted } });
        }

        // prenomina query
        if (query.includes('prenomina')) {
            const anio = variables?.anio || new Date().getFullYear();
            const mes = variables?.mes || new Date().getMonth() + 1;
            const rows = await dbAll(`SELECT * FROM prenomina WHERE anio = ? AND mes = ? ORDER BY empleado_nombre ASC`, [anio, mes]);
            const formatted = rows.map(p => ({
                id: p.id,
                empleadoId: p.empleado_id,
                empleado: p.empleado_nombre,
                periodo: p.periodo,
                anio: p.anio,
                mes: p.mes,
                diasTrabajados: p.dias_trabajados,
                horasTotales: p.horas_totales,
                faltas: p.faltas,
                retardos: p.retardos,
                incidencias: p.incidencias,
                salarioBase: p.salario_base,
                percepciones: p.percepciones,
                deducciones: p.deducciones,
                totalPagar: p.total_pagar
            }));
            return res.json({ data: { prenomina: formatted } });
        }

        // purchaseOrders query
        if (query.includes('purchaseOrders')) {
            const pedidos = await dbAll(`SELECT * FROM pedidos_compra_scm ORDER BY fecha_creacion DESC`);
            const formatted = pedidos.map(p => ({
                id: p.id,
                folio: 'PO-' + String(p.id).padStart(4, '0'),
                status: p.estado,
                subtotal: p.total || 0,
                iva: 0,
                total: p.total || 0,
                expectedDate: p.fecha_recepcion,
                receivedAt: p.estado === 'recibido' ? p.fecha_recepcion : null,
                supplier: { id: p.proveedor_id, name: p.proveedor_nombre },
                items: []
            }));
            return res.json({ data: { purchaseOrders: formatted } });
        }

        // departments query
        if (query.includes('departments')) {
            return res.json({ data: { departments: [] } });
        }

        // positions/puestos query
        if (query.includes('positions')) {
            return res.json({ data: { positions: [] } });
        }

        // notifications query
        if (query.includes('notifications') || query.includes('notificationCount')) {
            return res.json({ data: { notifications: [], notificationCount: 0 } });
        }

        // auditLogs query
        if (query.includes('auditLogs')) {
            return res.json({ data: { auditLogs: [] } });
        }

        // If we get here, return empty data for unhandled queries
        return res.json({ data: {} });

    } catch (err) {
        console.error('GraphQL error:', err);
        res.json({ errors: [{ message: err.message }] });
    }
});

// Verificar sesion
app.get('/api/me', authMiddleware, (req, res) => {
    res.json({ user: req.user });
});

// Listar usuarios (admin)
app.get('/api/users', async (req, res) => {
    try {
        const rows = await dbAll(`SELECT id, name, username, email, role, is_verified, created_at FROM users ORDER BY created_at DESC`);
        res.json({ success: true, users: rows });
    } catch (err) {
        console.error('Error users:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Actualizar usuario (admin)
app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, role, is_verified } = req.body;

    console.log('Updating user:', id, { name, email, role, is_verified });

    try {
        const result = await db.execute({
            sql: `UPDATE users SET name = ?, email = ?, role = ?, is_verified = ? WHERE id = ?`,
            args: [name || '', email || '', role || 'cliente', is_verified !== undefined ? is_verified : 1, parseInt(id)]
        });
        console.log('User update result:', result);
        res.json({ success: true, message: 'Usuario actualizado' });
    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Obtener permisos de un usuario
app.get('/api/users/:id/permissions', async (req, res) => {
    const { id } = req.params;
    try {
        const rows = await dbAll(`SELECT permission FROM user_permissions WHERE user_id = ?`, [parseInt(id)]);
        res.json({ success: true, permissions: rows.map(r => r.permission) });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Guardar permisos de un usuario
app.post('/api/users/:id/permissions', async (req, res) => {
    const { id } = req.params;
    const { permissions } = req.body;

    try {
        await db.execute(`DELETE FROM user_permissions WHERE user_id = ?`, [parseInt(id)]);

        if (Array.isArray(permissions)) {
            for (const perm of permissions) {
                await db.execute({
                    sql: `INSERT OR IGNORE INTO user_permissions (user_id, permission) VALUES (?, ?)`,
                    args: [parseInt(id), perm]
                });
            }
        }

        res.json({ success: true, message: 'Permisos actualizados' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Actualizar perfil
app.put('/api/profile/update', authMiddleware, async (req, res) => {
    const { name, email, password } = req.body;
    const userId = req.user.id;

    try {
        if (password) {
            const hashedPassword = bcrypt.hashSync(password, 10);
            await dbRun(`UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?`, [name, email, hashedPassword, userId]);
        } else {
            await dbRun(`UPDATE users SET name = ?, email = ? WHERE id = ?`, [name, email, userId]);
        }

        const user = await dbGet(`SELECT * FROM users WHERE id = ?`, [userId]);
        res.json({
            success: true,
            user: { id: user.id, name: user.name, username: user.username, email: user.email, role: user.role }
        });
    } catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).json({ success: false, error: 'Error al actualizar' });
    }
});

// ============ API ASISTENCIA ============
app.get('/api/asistencia', async (req, res) => {
    try {
        const { fecha, mes, anio } = req.query;
        let sql = `SELECT * FROM asistencia WHERE 1=1`;
        const args = [];

        if (fecha) {
            sql += ` AND fecha = ?`;
            args.push(fecha);
        } else if (mes && anio) {
            sql += ` AND strftime('%Y', fecha) = ? AND strftime('%m', fecha) = ?`;
            args.push(String(anio), String(mes).padStart(2, '0'));
        }

        sql += ` ORDER BY fecha DESC, empleado_nombre ASC`;
        const rows = await dbAll(sql, args);
        res.json({ success: true, attendance: rows });
    } catch (err) {
        console.error('Error asistencia:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/asistencia', async (req, res) => {
    const { empleado_id, empleado_nombre, fecha, entrada, salida, horas, estado } = req.body;
    try {
        await db.execute({
            sql: `INSERT INTO asistencia (empleado_id, empleado_nombre, fecha, entrada, salida, horas, estado)
                  VALUES (?, ?, ?, ?, ?, ?, ?)
                  ON CONFLICT(empleado_id, fecha) DO UPDATE SET
                  entrada = excluded.entrada, salida = excluded.salida, horas = excluded.horas, estado = excluded.estado`,
            args: [empleado_id, empleado_nombre, fecha, entrada || null, salida || null, horas || 0, estado || 'falta']
        });
        res.json({ success: true, message: 'Asistencia guardada' });
    } catch (err) {
        console.error('Error guardar asistencia:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.put('/api/asistencia/:id', async (req, res) => {
    const { id } = req.params;
    const { entrada, salida, horas, estado } = req.body;
    try {
        await db.execute({
            sql: `UPDATE asistencia SET entrada = ?, salida = ?, horas = ?, estado = ? WHERE id = ?`,
            args: [entrada || null, salida || null, horas || 0, estado || 'falta', id]
        });
        res.json({ success: true, message: 'Asistencia actualizada' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ============ API SOLICITUDES ============
app.get('/api/solicitudes', async (req, res) => {
    try {
        const { estado } = req.query;
        let sql = `SELECT * FROM solicitudes WHERE 1=1`;
        const args = [];

        if (estado && estado !== 'todas') {
            sql += ` AND estado = ?`;
            args.push(estado);
        }
        sql += ` ORDER BY created_at DESC`;

        const rows = await dbAll(sql, args);
        res.json({ success: true, solicitudes: rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/solicitudes', async (req, res) => {
    const { empleado_id, empleado_nombre, tipo, fecha_inicio, fecha_fin, dias, motivo } = req.body;
    try {
        await db.execute({
            sql: `INSERT INTO solicitudes (empleado_id, empleado_nombre, tipo, fecha_inicio, fecha_fin, dias, motivo) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [empleado_id || null, empleado_nombre, tipo, fecha_inicio, fecha_fin, dias || 1, motivo || '']
        });
        res.status(201).json({ success: true, message: 'Solicitud creada' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.put('/api/solicitudes/:id', async (req, res) => {
    const { id } = req.params;
    const { estado, respuesta } = req.body;
    try {
        await db.execute({
            sql: `UPDATE solicitudes SET estado = ?, respuesta = ?, responded_at = datetime('now') WHERE id = ?`,
            args: [estado, respuesta || '', id]
        });
        res.json({ success: true, message: 'Solicitud actualizada' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ============ API PRENOMINA ============
app.get('/api/prenomina', async (req, res) => {
    try {
        const { anio, mes, periodo } = req.query;
        let sql = `SELECT * FROM prenomina WHERE 1=1`;
        const args = [];

        if (anio) { sql += ` AND anio = ?`; args.push(anio); }
        if (mes) { sql += ` AND mes = ?`; args.push(mes); }
        if (periodo) { sql += ` AND periodo = ?`; args.push(periodo); }

        sql += ` ORDER BY empleado_nombre ASC`;
        const rows = await dbAll(sql, args);
        res.json({ success: true, prenomina: rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/prenomina', async (req, res) => {
    const { empleado_id, empleado_nombre, periodo, anio, mes, dias_trabajados, horas_totales, faltas, retardos, incidencias, salario_base, percepciones, deducciones, total_pagar } = req.body;
    try {
        await db.execute({
            sql: `INSERT INTO prenomina (empleado_id, empleado_nombre, periodo, anio, mes, dias_trabajados, horas_totales, faltas, retardos, incidencias, salario_base, percepciones, deducciones, total_pagar)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [empleado_id, empleado_nombre, periodo || 'mensual', anio, mes, dias_trabajados || 0, horas_totales || 0, faltas || 0, retardos || 0, incidencias || '', salario_base || 0, percepciones || 0, deducciones || 0, total_pagar || 0]
        });
        res.status(201).json({ success: true, message: 'Prenómina guardada' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.put('/api/prenomina/:id', async (req, res) => {
    const { id } = req.params;
    const { dias_trabajados, horas_totales, faltas, retardos, incidencias, percepciones, deducciones, total_pagar } = req.body;
    try {
        await db.execute({
            sql: `UPDATE prenomina SET dias_trabajados = ?, horas_totales = ?, faltas = ?, retardos = ?, incidencias = ?, percepciones = ?, deducciones = ?, total_pagar = ? WHERE id = ?`,
            args: [dias_trabajados, horas_totales, faltas, retardos, incidencias || '', percepciones, deducciones, total_pagar, id]
        });
        res.json({ success: true, message: 'Prenómina actualizada' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Enviar reserva
app.post('/enviar-reserva', async (req, res) => {
    const { clientEmail, clientName, telefono, tipoSesion, estilo, cantidadPersonas, fechaSesion, horaSesion, notas, tipoPapel } = req.body;

    if (!clientEmail || !clientName) {
        return res.status(400).json({ success: false, error: 'Faltan datos requeridos' });
    }

    try {
        await dbRun(`INSERT INTO reservas (nombre, email, telefono, tipo_sesion, estilo, cantidad_personas, fecha_sesion, hora_sesion, notas, tipo_papel)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [clientName, clientEmail, telefono || '', tipoSesion || '', estilo || '', cantidadPersonas || 1, fechaSesion || '', horaSesion || '', notas || '', tipoPapel || '']);

        const tiposMap = {
            estudio_basico: 'Estudio Básico',
            estudio_premium: 'Estudio Premium',
            estudio_tematico: 'Sesión Temática',
            boda_civil: 'Boda Civil',
            boda_completa: 'Cobertura Completa de Boda',
            evento: 'Cobertura de Evento',
            estudio: 'Sesión de Estudio (Fondo Blanco)',
            estudio_tematico: 'Sesión Temática (Navidad, Madres, etc.)',
            tecnica: 'Fotografía Técnica (Pasaporte, Credencial)',
            boda: 'Sesión de Boda',
            evento: 'Cobertura de Evento'
        };
        const tipoNombre = tiposMap[tipoSesion] || tipoSesion || 'No especificado';

        let precioBase = 800;
        if (tipoSesion && tipoSesion.toLowerCase().includes('boda')) {
            precioBase = 4500;
        } else if (tipoSesion && tipoSesion.toLowerCase().includes('estudio_tematico')) {
            precioBase = 1200;
        } else if (tipoSesion && tipoSesion.toLowerCase().includes('tecnica')) {
            precioBase = 250;
        } else if (tipoSesion && tipoSesion.toLowerCase().includes('evento')) {
            precioBase = 2500;
        } else if (tipoSesion && tipoSesion.toLowerCase().includes('estudio')) {
            precioBase = 800;
        }

        let totalFinal = precioBase;
        let detallePapel = 'Papel Brillante (Glossy) - Incluido';
        const papelMinuscula = (tipoPapel || '').toLowerCase();

        if (papelMinuscula.includes('lustre') || papelMinuscula.includes('satinado')) {
            totalFinal = precioBase * 1.25;
            detallePapel = 'Papel Lustre/Satinado Premium (+25%)';
        } else if (papelMinuscula.includes('mate')) {
            totalFinal = precioBase + 30;
            detallePapel = 'Papel Mate Profesional (+$30.00)';
        } else if (papelMinuscula.includes('fine') || papelMinuscula.includes('art') || papelMinuscula.includes('algodon')) {
            totalFinal = precioBase + 500;
            detallePapel = 'Papel Fine Art Calidad Museo (+$500.00)';
        } else if (papelMinuscula.includes('brillante')) {
            detallePapel = 'Papel Brillante (Glossy) - Incluido';
        }

        const totalFormateado = '$' + totalFinal.toFixed(2) + ' MXN';
        const notasValor = notas || 'Ninguna';
        const estiloValor = estilo || 'No especificado';
        const telefonoValor = telefono || 'No proporcionado';
        const fechaValor = fechaSesion || 'Por confirmar';
        const horaValor = horaSesion || 'Por confirmar';

        const plantillaCorreoPremium = `
<div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #f4f5f7; padding: 20px; min-height: 100%;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">

        <div style="background: linear-gradient(135deg, #5165ff 0%, #7a42f4 100%); padding: 30px; text-align: center; color: #ffffff;">
            <div style="font-size: 24px; font-weight: bold; margin-bottom: 5px;">📸 FotoTec</div>
            <div style="font-size: 14px; opacity: 0.9; letter-spacing: 1px;">Reserva y Configuración de Impresión</div>
        </div>

        <div style="padding: 30px; color: #333333;">
            <h2 style="color: #5165ff; margin-top: 0; font-size: 20px;">¡Nueva Solicitud de Reserva!</h2>
            <p style="color: #666666; font-size: 14px; line-height: 1.6;">
                Se ha registrado una nueva solicitud en el sistema. A continuación se desglosan los detalles correspondientes:
            </p>

            <h3 style="font-size: 15px; color: #333333; margin-top: 25px; margin-bottom: 10px; border-bottom: 1px solid #eeeeee; padding-bottom: 5px;">📋 Detalles del Cliente</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; margin-bottom: 25px;">
                <tr style="background-color: #f9f9f9;"><th style="padding: 8px; width: 35%; color: #555;">Nombre</th><td style="padding: 8px;">${clientName}</td></tr>
                <tr><th style="padding: 8px; color: #555;">Email</th><td style="padding: 8px;">${clientEmail}</td></tr>
                <tr style="background-color: #f9f9f9;"><th style="padding: 8px; color: #555;">Teléfono</th><td style="padding: 8px;">${telefonoValor}</td></tr>
                <tr><th style="padding: 8px; color: #555;">Tipo de Sesión</th><td style="padding: 8px; font-weight: bold; color: #5165ff;">${tipoNombre}</td></tr>
                <tr style="background-color: #f9f9f9;"><th style="padding: 8px; color: #555;">Acabado Textura</th><td style="padding: 8px; font-weight: bold; color: #7a42f4;">${detallePapel}</td></tr>
                <tr><th style="padding: 8px; color: #555;">Estilo</th><td style="padding: 8px;">${estiloValor}</td></tr>
                <tr style="background-color: #f9f9f9;"><th style="padding: 8px; color: #555;">Personas</th><td style="padding: 8px;">${cantidadPersonas || 1}</td></tr>
                <tr><th style="padding: 8px; color: #555;">Fecha</th><td style="padding: 8px; font-weight: bold;">${fechaValor}</td></tr>
                <tr style="background-color: #f9f9f9;"><th style="padding: 8px; color: #555;">Hora</th><td style="padding: 8px; font-weight: bold;">${horaValor}</td></tr>
                <tr><th style="padding: 8px; color: #555;">Notas</th><td style="padding: 8px; color: #777; font-style: italic;">"${notasValor}"</td></tr>
            </table>

            <h3 style="font-size: 15px; color: #333333; margin-top: 20px; margin-bottom: 10px;">📦 Resumen Comercial</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left;">
                <thead>
                    <tr style="background-color: #5165ff; color: #ffffff;">
                        <th style="padding: 10px;">Concepto</th>
                        <th style="padding: 10px; text-align: center;">Cantidad</th>
                        <th style="padding: 10px; text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="border-bottom: 1px solid #eeeeee;">
                        <td style="padding: 12px;">${tipoNombre}</td>
                        <td style="padding: 12px; text-align: center;">1</td>
                        <td style="padding: 12px; text-align: right;">$${precioBase.toFixed(2)} MXN</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #eeeeee;">
                        <td style="padding: 12px; color: #7a42f4;">📄 ${detallePapel}</td>
                        <td style="padding: 12px; text-align: center;">1</td>
                        <td style="padding: 12px; text-align: right; color: #7a42f4; font-weight: bold;">$${(totalFinal - precioBase).toFixed(2)} MXN</td>
                    </tr>
                </tbody>
            </table>

            <div style="text-align: right; margin-top: 15px; font-size: 18px; font-weight: bold; color: #5165ff;">
                Total Final: ${totalFormateado}
            </div>
        </div>

        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 11px; color: #999999; border-top: 1px solid #eeeeee;">
            Este es un correo de notificación automática gestionado por el servidor de FotoTec.
        </div>
    </div>
</div>`;

        try {
            await resend.emails.send({
                from: 'FotoTec <onboarding@resend.dev>',
                to: 'fototecventass@gmail.com',
                subject: `📸 Nueva Reserva de ${clientName} - ${tipoNombre}`,
                html: plantillaCorreoPremium
            });
            console.log('Email admin enviado via Resend');
        } catch (emailErr) {
            console.error('Error enviando email admin:', emailErr.message);
        }

        try {
            await resend.emails.send({
                from: 'FotoTec <onboarding@resend.dev>',
                to: clientEmail,
                subject: `📸 Confirmación de tu reserva - FotoTec`,
                html: plantillaCorreoPremium
            });
            console.log('Email cliente enviado via Resend');
        } catch (emailErr) {
            console.error('Error enviando email cliente:', emailErr.message);
        }

        console.log('Reserva guardada:', clientName, clientEmail);
        res.json({ success: true, message: 'Reserva recibida. Te contactaremos pronto.' });
    } catch (err) {
        console.error('Error al guardar reserva:', err);
        res.status(500).json({ success: false, error: 'Error al guardar la reserva' });
    }
});

// Todas las reservas (admin)
app.get('/api/reservas', async (req, res) => {
    try {
        const rows = await dbAll(`SELECT * FROM reservas ORDER BY created_at DESC`);
        res.json({ success: true, reservas: rows });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Error' });
    }
});

// Contacto
app.post('/api/contacto', async (req, res) => {
    const { nombre, email, mensaje } = req.body;
    if (!nombre || !email || !mensaje) {
        return res.status(400).json({ success: false, error: 'Todos los campos son requeridos' });
    }

    const emailHtml = `
    <div style="font-family: Arial, sans-serif;">
      <h2 style="color: #667eea;">Nuevo mensaje de contacto</h2>
      <table style="border-collapse: collapse; width: 100%;">
        <tr><td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; background: #f5f5f5;">Nombre</td><td style="padding: 10px; border: 1px solid #ddd;">${nombre}</td></tr>
        <tr><td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; background: #f5f5f5;">Email</td><td style="padding: 10px; border: 1px solid #ddd;">${email}</td></tr>
        <tr><td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; background: #f5f5f5;">Mensaje</td><td style="padding: 10px; border: 1px solid #ddd;">${mensaje}</td></tr>
      </table>
    </div>`;

    try {
        await resend.emails.send({
            from: 'Contacto FotoTec <onboarding@resend.dev>',
            to: ['fototecventass@gmail.com'],
            subject: `Mensaje de ${nombre}`,
            html: emailHtml
        });
        res.json({ success: true, message: 'Mensaje enviado correctamente' });
    } catch (err) {
        console.error('Error enviando email de contacto:', err.message);
        res.status(500).json({ success: false, error: 'Error al enviar el mensaje' });
    }
});

// Mis reservas (usuario)
app.get('/api/reservas/mis-reservas', async (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ success: false, error: 'Email requerido' });

    try {
        const rows = await dbAll(`SELECT * FROM reservas WHERE email = ? ORDER BY created_at DESC`, [email]);
        res.json({ success: true, reservas: rows });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Error' });
    }
});

// Marcar reserva como leida
app.put('/api/reservas/:id/leer', async (req, res) => {
    try {
        await dbRun(`UPDATE reservas SET leido = 1 WHERE id = ?`, [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Error' });
    }
});

// Contador de reservas no leidas
app.get('/api/reservas/contador', async (req, res) => {
    try {
        const result = await dbGet(`SELECT COUNT(*) as total FROM reservas WHERE leido = 0`);
        res.json({ total: result ? result.total : 0 });
    } catch (err) {
        res.status(500).json({ total: 0 });
    }
});

// Admin: verificar admin
app.post('/api/verificar-admin', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await dbGet(`SELECT * FROM users WHERE username = ? AND role = ?`, [username, 'admin']);
        if (user && bcrypt.compareSync(password, user.password)) {
            res.json({ success: true, user: { id: user.id, username: user.username } });
        } else {
            res.status(401).json({ success: false, error: 'Credenciales invalidas' });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: 'Error' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Error interno' });
});

// ============ ENDPOINTS SCM: PROVEEDORES ============
app.get('/api/scm/proveedores', async (req, res) => {
    try {
        const rows = await dbAll(`SELECT * FROM proveedores ORDER BY created_at DESC`);
        res.json({ success: true, proveedores: rows, total: rows.length });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ============ ENDPOINTS ERP: EMPLEADOS (RH) ============
app.get('/api/erp/empleados', async (req, res) => {
    try {
        const rows = await dbAll(`SELECT * FROM empleados ORDER BY created_at DESC`);
        const activos = rows.filter(e => e.activo === 1);
        const nominaTotal = activos.reduce((sum, e) => sum + (e.salario || 0), 0);
        res.json({
            success: true,
            empleados: rows,
            total: rows.length,
            activos: activos.length,
            inactivos: rows.length - activos.length,
            nominaTotal
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/erp/empleados', async (req, res) => {
    const { nombre, puesto, area, telefono, email, salario, fecha_ingreso } = req.body;
    try {
        await db.execute({
            sql: "INSERT INTO empleados (nombre, puesto, area, telefono, email, salario, fecha_ingreso, activo) VALUES (?, ?, ?, ?, ?, ?, ?, 1)",
            args: [nombre, puesto || '', area || '', telefono || '', email || '', parseFloat(salario) || 0, fecha_ingreso || '']
        });
        res.status(201).json({ success: true, message: "Guardado en la nube" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "No se pudo conectar con Turso: " + err.message });
    }
});

// ============ ENDPOINTS SCM: PEDIDOS DE COMPRA ============
app.get('/api/scm/pedidos-compra', async (req, res) => {
    try {
        const rows = await dbAll(`SELECT * FROM pedidos_compra_scm ORDER BY fecha_creacion DESC`);
        const pendientes = rows.filter(r => r.estado === 'pendiente').length;
        res.json({ success: true, pedidos_compra: rows, total: rows.length, pendientes });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/scm/proveedores', async (req, res) => {
    const { nombre, contacto, telefono, email, tipo_insumo, insumo_detalle } = req.body;
    try {
        await db.execute({
            sql: "INSERT INTO proveedores (nombre, contacto, telefono, email, tipo_insumo, insumo_detalle, activo) VALUES (?, ?, ?, ?, ?, ?, 1)",
            args: [nombre, contacto || '', telefono || '', email || '', tipo_insumo || '', insumo_detalle || '']
        });
        res.status(201).json({ success: true, message: "Proveedor guardado en la nube" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "No se pudo conectar con Turso: " + err.message });
    }
});

app.post('/api/scm/pedidos-compra', async (req, res) => {
    const { proveedor_id, proveedor_nombre, productos, notas } = req.body;
    try {
        const total = Array.isArray(productos) ? productos.reduce((sum, p) => sum + (parseFloat(p.precio) || 0) * (parseInt(p.cantidad) || 1), 0) : 0;
        await db.execute({
            sql: "INSERT INTO pedidos_compra_scm (proveedor_id, proveedor_nombre, estado, productos, total, notas, creado_automatico) VALUES (?, ?, 'pendiente', ?, ?, ?, 0)",
            args: [proveedor_id || null, proveedor_nombre || '', JSON.stringify(productos || []), total, notas || '']
        });
        res.status(201).json({ success: true, message: "Pedido de compra guardado en Turso" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "No se pudo conectar con Turso: " + err.message });
    }
});

app.put('/api/scm/pedidos-compra/:id', async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
    try {
        const [pedido] = await dbAll(`SELECT * FROM pedidos_compra_scm WHERE id = ?`, [parseInt(id)]);
        if (!pedido) return res.status(404).json({ error: "Pedido no encontrado" });

        await db.execute({ sql: "UPDATE pedidos_compra_scm SET estado = ? WHERE id = ?", args: [estado || 'pendiente', parseInt(id)] });

        if (estado === 'recibido' && pedido.productos) {
            const prods = JSON.parse(pedido.productos);
            for (const p of prods) {
                const prodId = p.id;
                const cantidad = parseInt(p.cantidad) || 1;
                if (prodId) {
                    await db.execute({ sql: "UPDATE products SET stock = stock + ? WHERE id = ?", args: [cantidad, parseInt(prodId)] });
                }
            }
        }

        res.json({ success: true, message: "Pedido de compra actualizado" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "No se pudo actualizar: " + err.message });
    }
});

// ============ ENDPOINTS CRM: PRODUCTOS ============
app.get('/api/products', async (req, res) => {
    try {
        const rows = await dbAll(`
            SELECT p.*, pr.nombre as proveedor_nombre
            FROM products p
            LEFT JOIN proveedores pr ON p.proveedor_id = pr.id
            ORDER BY p.id DESC
        `);
        res.json({ success: true, products: rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/products', async (req, res) => {
    const { nombre, descripcion, precio, stock, categoria, estrategia, stock_minimo, proveedor_id } = req.body;
    try {
        await db.execute({
            sql: "INSERT INTO products (nombre, descripcion, precio, stock, categoria, estrategia, stock_minimo, proveedor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            args: [nombre || '', descripcion || '', parseFloat(precio) || 0, parseInt(stock) || 0, categoria || 'estudio', estrategia || 'pull', parseInt(stock_minimo) || 10, proveedor_id || null]
        });
        res.status(201).json({ success: true, message: "Producto guardado en la nube" });
    } catch (err) {
        res.status(500).json({ error: "No se pudo conectar con Turso: " + err.message });
    }
});

app.put('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, precio, stock, categoria, estrategia, stock_minimo, proveedor_id } = req.body;
    try {
        await db.execute({
            sql: "UPDATE products SET nombre=?, descripcion=?, precio=?, stock=?, categoria=?, estrategia=?, stock_minimo=?, proveedor_id=? WHERE id=?",
            args: [nombre || '', descripcion || '', parseFloat(precio) || 0, parseInt(stock) || 0, categoria || 'estudio', estrategia || 'pull', parseInt(stock_minimo) || 10, proveedor_id || null, parseInt(id)]
        });
        res.json({ success: true, message: "Producto actualizado en la nube" });
    } catch (err) {
        res.status(500).json({ error: "No se pudo conectar con Turso: " + err.message });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute({ sql: "DELETE FROM products WHERE id = ?", args: [parseInt(id)] });
        res.json({ success: true, message: "Producto eliminado" });
    } catch (err) {
        res.status(500).json({ error: "No se pudo conectar con Turso: " + err.message });
    }
});

// ============ ENDPOINTS CRM: PEDIDOS ============
app.get('/api/pedidos', async (req, res) => {
    try {
        const rows = await dbAll(`SELECT * FROM pedidos ORDER BY id DESC`);
        res.json({ success: true, pedidos: rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/pedidos', async (req, res) => {
    const { cliente_id, cliente_nombre, cliente_email, productos, notas, telefono, total } = req.body;
    try {
        await db.execute({
            sql: "INSERT INTO pedidos (cliente_id, cliente_nombre, cliente_email, productos, notas, telefono, total, estado) VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente')",
            args: [cliente_id || null, cliente_nombre || '', cliente_email || '', JSON.stringify(productos || []), notas || '', telefono || '', parseFloat(total) || 0]
        });
        res.status(201).json({ success: true, message: "Pedido guardado en la nube" });
    } catch (err) {
        res.status(500).json({ error: "No se pudo conectar con Turso: " + err.message });
    }
});

app.put('/api/pedidos/:id', async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
    try {
        const [pedido] = await dbAll(`SELECT * FROM pedidos WHERE id = ?`, [parseInt(id)]);
        if (!pedido) return res.status(404).json({ error: "Pedido no encontrado" });

        if (estado === 'completado' && pedido.productos) {
            const prods = JSON.parse(pedido.productos);
            for (const p of prods) {
                const prodId = p.id || p.productoId;
                const cantidad = parseInt(p.cantidad) || 1;
                if (prodId) {
                    await db.execute({ sql: "UPDATE products SET stock = stock - ? WHERE id = ?", args: [cantidad, parseInt(prodId)] });
                }
            }
        }

        await db.execute({ sql: "UPDATE pedidos SET estado = ? WHERE id = ?", args: [estado || 'pendiente', parseInt(id)] });
        res.json({ success: true, message: "Estado actualizado" });
    } catch (err) {
        res.status(500).json({ error: "No se pudo conectar con Turso: " + err.message });
    }
});

app.delete('/api/pedidos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute({ sql: "DELETE FROM pedidos WHERE id = ?", args: [parseInt(id)] });
        res.json({ success: true, message: "Pedido eliminado" });
    } catch (err) {
        res.status(500).json({ error: "No se pudo conectar con Turso: " + err.message });
    }
});

// ============ ENDPOINTS CRM: PIPELINE (EMBUDO DE VENTAS) ============
app.get('/api/crm/pipeline', async (req, res) => {
    try {
        const rows = await dbAll(`SELECT * FROM pipeline ORDER BY creado_en DESC`);
        const etapas = ['interesado', 'cotizado', 'apartado', 'entregado'];
        const resumen = {};
        etapas.forEach(e => {
            const items = rows.filter(r => r.etapa === e);
            resumen[e] = { count: items.length, valor: items.reduce((s, r) => s + (r.valor || 0), 0) };
        });
        res.json({ success: true, pipeline: rows, resumen });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/crm/pipeline', async (req, res) => {
    const { cliente_nombre, cliente_email, cliente_telefono, etapa, notas, origen, valor } = req.body;
    try {
        await db.execute({
            sql: "INSERT INTO pipeline (cliente_nombre, cliente_email, cliente_telefono, etapa, notas, origen, valor, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))",
            args: [cliente_nombre || '', cliente_email || '', cliente_telefono || '', etapa || 'interesado', notas || '', origen || '', parseFloat(valor) || 0]
        });
        res.status(201).json({ success: true, message: "Lead agregado al pipeline" });
    } catch (err) {
        res.status(500).json({ error: "No se pudo conectar con Turso: " + err.message });
    }
});

app.put('/api/crm/pipeline/:id', async (req, res) => {
    const { id } = req.params;
    const { etapa, notas, valor } = req.body;
    try {
        await db.execute({
            sql: "UPDATE pipeline SET etapa=?, notas=?, valor=? WHERE id=?",
            args: [etapa || 'interesado', notas || '', parseFloat(valor) || 0, parseInt(id)]
        });
        res.json({ success: true, message: "Pipeline actualizado" });
    } catch (err) {
        res.status(500).json({ error: "No se pudo conectar con Turso: " + err.message });
    }
});

app.delete('/api/crm/pipeline/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute({ sql: "DELETE FROM pipeline WHERE id = ?", args: [parseInt(id)] });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============ ENDPOINTS CRM: NOTAS POR CLIENTE ============
app.get('/api/crm/notas', async (req, res) => {
    const { email } = req.query;
    try {
        let rows;
        if (email) {
            rows = await dbAll(`SELECT * FROM customer_notes WHERE cliente_email = ? ORDER BY creado_en DESC`, [email]);
        } else {
            rows = await dbAll(`SELECT * FROM customer_notes ORDER BY creado_en DESC`);
        }
        res.json({ success: true, notas: rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/crm/notas', async (req, res) => {
    const { cliente_email, cliente_nombre, nota } = req.body;
    try {
        await db.execute({
            sql: "INSERT INTO customer_notes (cliente_email, cliente_nombre, nota, creado_en) VALUES (?, ?, ?, datetime('now'))",
            args: [cliente_email || '', cliente_nombre || '', nota || '']
        });
        res.status(201).json({ success: true, message: "Nota guardada" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/crm/notas/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute({ sql: "DELETE FROM customer_notes WHERE id = ?", args: [parseInt(id)] });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============ ENDPOINTS ERP: FACTURAS ============
app.get('/api/erp/facturas', async (req, res) => {
    try {
        const rows = await dbAll(`SELECT * FROM invoices ORDER BY fecha DESC`);
        res.json({ success: true, facturas: rows, total: rows.length });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/erp/facturas', async (req, res) => {
    const { cliente_nombre, cliente_email, cliente_direccion, productos, subtotal, iva, total } = req.body;
    const folio = 'FOT-' + String(Date.now()).slice(-6);
    try {
        await db.execute({
            sql: "INSERT INTO invoices (folio, cliente_nombre, cliente_email, cliente_direccion, productos, subtotal, iva, total, fecha, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, date('now'), 'pendiente')",
            args: [folio, cliente_nombre || '', cliente_email || '', cliente_direccion || '', JSON.stringify(productos || []), parseFloat(subtotal) || 0, parseFloat(iva) || 0, parseFloat(total) || 0]
        });
        res.status(201).json({ success: true, folio, message: "Factura generada" });
    } catch (err) {
        res.status(500).json({ error: "No se pudo generar factura: " + err.message });
    }
});

app.put('/api/erp/facturas/:id', async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
    try {
        await db.execute({ sql: "UPDATE invoices SET estado = ? WHERE id = ?", args: [estado || 'pendiente', parseInt(id)] });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============ ENDPOINT: DATOS PARA GRAFICAS ============
app.get('/api/erp/dashboard-data', async (req, res) => {
    try {
        const productos = await dbAll(`SELECT COUNT(*) as total, SUM(stock) as stock_total FROM products`);
        const pedidos = await dbAll(`SELECT estado, COUNT(*) as total, SUM(total) as ingreso FROM pedidos GROUP BY estado`);
        const pipeline = await dbAll(`SELECT etapa, COUNT(*) as total, SUM(valor) as valor FROM pipeline GROUP BY etapa`);
        const proveedores = await dbAll(`SELECT COUNT(*) as total FROM proveedores WHERE activo = 1`);
        const empleados = await dbAll(`SELECT COUNT(*) as total, SUM(salario) as nomina FROM empleados WHERE activo = 1`);
        const pedidosCompra = await dbAll(`SELECT estado, COUNT(*) as total FROM pedidos_compra_scm GROUP BY estado`);
        const facturas = await dbAll(`SELECT estado, COUNT(*) as total, SUM(total) as monto FROM invoices GROUP BY estado`);
        const reservas = await dbAll(`SELECT COUNT(*) as total FROM reservas`);
        const ingresos = pedidos.reduce((s, p) => s + (p.ingreso || 0), 0);
        res.json({
            success: true,
            productos: productos[0] || {},
            pedidos,
            pipeline,
            proveedores: proveedores[0] || {},
            empleados: empleados[0] || {},
            pedidosCompra,
            facturas,
            reservas: reservas[0] || {},
            ingresosTotales: ingresos
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

initDB().then(() => {
    app.listen(PORT, () => {
        console.log('==================================');
        console.log('   SERVIDOR FOTOTEC INICIADO');
        console.log('==================================');
        console.log('   Puerto: ' + PORT);
        console.log('   URL: https://fototec.onrender.com');
        console.log('==================================');
    });
}).catch(err => {
    console.error('Error al iniciar:', err);
    process.exit(1);
});

module.exports = app;
