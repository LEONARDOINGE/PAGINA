const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');
const jwt = require('jsonwebtoken');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fototec_secret_2024';

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

let db;
let SQL;
const dbPath = path.join(__dirname, 'database.db');

async function initDB() {
    const initSqlJs = require('sql.js');
    const wasmPath = path.join(__dirname, 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
    const SQLModule = await initSqlJs({ locateFile: () => wasmPath });

    let fileBuffer = null;
    try {
        if (fs.existsSync(dbPath)) {
            fileBuffer = fs.readFileSync(dbPath);
        }
    } catch (e) {}

    db = new SQLModule.Database(fileBuffer);

    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        is_verified INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS reservas (
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    const adminHash = bcrypt.hashSync('admin123', 10);
    db.run(`INSERT OR IGNORE INTO users (name, username, email, password, role, is_verified) VALUES (?, ?, ?, ?, ?, 1)`,
        ['Admin', 'admin', 'admin@fototec.com', adminHash, 'admin']);

    try { fs.writeFileSync(dbPath, Buffer.from(db.export())); } catch (e) {}
    console.log('Base de datos lista');
}

function dbRun(sql, params = []) {
    db.run(sql, params);
    try { fs.writeFileSync(dbPath, Buffer.from(db.export())); } catch (e) {}
}

function dbGet(sql, params = []) {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    if (stmt.step()) {
        const cols = stmt.getColumnNames();
        const vals = stmt.get();
        stmt.free();
        const row = {};
        cols.forEach((c, i) => row[c] = vals[i]);
        return row;
    }
    stmt.free();
    return undefined;
}

function dbAll(sql, params = []) {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
        const cols = stmt.getColumnNames();
        const vals = stmt.get();
        const row = {};
        cols.forEach((c, i) => row[c] = vals[i]);
        rows.push(row);
    }
    stmt.free();
    return rows;
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
app.post('/api/register', (req, res) => {
    const { name, username, email, password } = req.body;
    if (!name || !username || !email || !password) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'La contrasena debe tener al menos 6 caracteres' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    try {
        db.run(`INSERT INTO users (name, username, email, password, is_verified) VALUES (?, ?, ?, ?, 1)`,
            [name, username, email, hashedPassword]);
        fs.writeFileSync(dbPath, Buffer.from(db.export()));

        const user = dbGet(`SELECT * FROM users WHERE username = ?`, [username]);
        const token = generateToken(user);

        res.json({
            success: true,
            token,
            user: { id: user.id, name: user.name, username: user.username, email: user.email, role: user.role }
        });
    } catch (err) {
        const msg = String(err);
        if (msg.includes('UNIQUE')) {
            return res.status(400).json({ error: 'El usuario o email ya existe' });
        }
        console.error('Error registro:', err);
        res.status(500).json({ error: 'Error: ' + msg });
    }
});

// Login
app.post('/api/login', (req, res) => {
    const { usernameOrEmail, password } = req.body;
    if (!usernameOrEmail || !password) {
        return res.status(400).json({ error: 'Usuario y contrasena son requeridos' });
    }

    try {
        const user = dbGet(`SELECT * FROM users WHERE username = ? OR email = ?`, [usernameOrEmail, usernameOrEmail]);
        if (!user) {
            return res.status(401).json({ error: 'Credenciales invalidas' });
        }

        if (!bcrypt.compareSync(password, user.password)) {
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

// Verificar sesion
app.get('/api/me', authMiddleware, (req, res) => {
    res.json({ user: req.user });
});

// Actualizar perfil
app.put('/api/profile/update', authMiddleware, (req, res) => {
    const { name, email, password } = req.body;
    const userId = req.user.id;

    try {
        if (password) {
            const hashedPassword = bcrypt.hashSync(password, 10);
            db.run(`UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?`, [name, email, hashedPassword, userId]);
        } else {
            db.run(`UPDATE users SET name = ?, email = ? WHERE id = ?`, [name, email, userId]);
        }
        fs.writeFileSync(dbPath, Buffer.from(db.export()));

        const user = dbGet(`SELECT * FROM users WHERE id = ?`, [userId]);
        res.json({
            success: true,
            user: { id: user.id, name: user.name, username: user.username, email: user.email, role: user.role }
        });
    } catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).json({ success: false, error: 'Error al actualizar' });
    }
});

// Enviar reserva
app.post('/enviar-reserva', (req, res) => {
    const { clientEmail, clientName, telefono, tipoSesion, estilo, cantidadPersonas, fechaSesion, horaSesion, notas, tipoPapel } = req.body;

    if (!clientEmail || !clientName) {
        return res.status(400).json({ success: false, error: 'Faltan datos requeridos' });
    }

    try {
        db.run(`INSERT INTO reservas (nombre, email, telefono, tipo_sesion, estilo, cantidad_personas, fecha_sesion, hora_sesion, notas, tipo_papel)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [clientName, clientEmail, telefono || '', tipoSesion || '', estilo || '', cantidadPersonas || 1, fechaSesion || '', horaSesion || '', notas || '', tipoPapel || '']);
        fs.writeFileSync(dbPath, Buffer.from(db.export()));

        console.log('Reserva guardada:', clientName, clientEmail);
        res.json({ success: true, message: 'Reserva recibida. Te contactaremos pronto.' });
    } catch (err) {
        console.error('Error al guardar reserva:', err);
        res.status(500).json({ success: false, error: 'Error al guardar la reserva' });
    }
});

// Todas las reservas (admin)
app.get('/api/reservas', (req, res) => {
    try {
        const rows = dbAll(`SELECT * FROM reservas ORDER BY created_at DESC`);
        res.json({ success: true, reservas: rows });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Error' });
    }
});

// Mis reservas (usuario)
app.get('/api/reservas/mis-reservas', (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ success: false, error: 'Email requerido' });

    try {
        const rows = dbAll(`SELECT * FROM reservas WHERE email = ? ORDER BY created_at DESC`, [email]);
        res.json({ success: true, reservas: rows });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Error' });
    }
});

// Marcar reserva como leida
app.put('/api/reservas/:id/leer', (req, res) => {
    try {
        db.run(`UPDATE reservas SET leido = 1 WHERE id = ?`, [req.params.id]);
        fs.writeFileSync(dbPath, Buffer.from(db.export()));
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Error' });
    }
});

// Contador de reservas no leidas
app.get('/api/reservas/contador', (req, res) => {
    try {
        const result = dbGet(`SELECT COUNT(*) as total FROM reservas WHERE leido = 0`);
        res.json({ total: result ? result.total : 0 });
    } catch (err) {
        res.status(500).json({ total: 0 });
    }
});

// Admin: verificar admin
app.post('/api/verificar-admin', (req, res) => {
    const { username, password } = req.body;
    try {
        const user = dbGet(`SELECT * FROM users WHERE username = ? AND role = ?`, [username, 'admin']);
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
