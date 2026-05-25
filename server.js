const express = require('express');
const cors = require('cors');
const dbWrapper = require('./db');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.post("/api/register", (req, res) => {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
        return res.status(400).json({ error: "Todos los campos son requeridos" });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: "La contrasena debe tener al menos 6 caracteres" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    try {
        const stmt = dbWrapper.prepare(`INSERT INTO users (name, username, email, password, is_verified) VALUES (?, ?, ?, ?, 1)`);
        const result = stmt.run(name, username, email, hashedPassword);

        res.json({ message: "Usuario registrado exitosamente!", userId: result.lastInsertRowid });
    } catch (err) {
        if (err.message && err.message.includes("UNIQUE")) {
            return res.status(400).json({ error: "El usuario o email ya existe" });
        }
        console.error('Error registro:', err);
        return res.status(500).json({ error: "Error en el servidor" });
    }
});

app.post("/api/login", (req, res) => {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
        return res.status(400).json({ error: "Usuario y contrasena son requeridos" });
    }

    try {
        const stmt = dbWrapper.prepare(`SELECT * FROM users WHERE username = ? OR email = ?`);
        const user = stmt.get(usernameOrEmail, usernameOrEmail);

        if (!user) {
            return res.status(401).json({ error: "Credenciales invalidas" });
        }

        const isValidPassword = bcrypt.compareSync(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: "Credenciales invalidas" });
        }

        const { password: _, role, ...userWithoutPassword } = user;
        const userType = role === 'admin' ? 'administrador' : 'cliente';
        const userWithUserType = { ...userWithoutPassword, userType };
        res.json({ message: "Login exitoso", user: userWithUserType });
    } catch (err) {
        console.error('Error login:', err);
        return res.status(500).json({ error: "Error en el servidor" });
    }
});

app.get("/api/users", (req, res) => {
    try {
        const stmt = dbWrapper.prepare(`SELECT id, name, username, email, role, created_at FROM users`);
        const rows = stmt.all();
        res.json(rows);
    } catch (err) {
        return res.status(500).json({ error: "Database error" });
    }
});

app.post('/enviar-reserva', (req, res) => {
    const {
        clientEmail, clientName, pedidoId, productos, total,
        telefono, tipoSesion, estilo, cantidadPersonas,
        fechaSesion, horaSesion, notas, tipoPapel
    } = req.body;

    if (!clientEmail || !clientName) {
        return res.status(400).json({
            success: false,
            error: 'Faltan datos requeridos (email, nombre)'
        });
    }

    const idPedido = pedidoId || 'RES-' + Date.now();

    try {
        dbWrapper.prepare(`
            INSERT INTO reservas (nombre, email, telefono, tipo_sesion, estilo, cantidad_personas, fecha_sesion, hora_sesion, notas, tipo_papel)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(clientName, clientEmail, telefono || '', tipoSesion || '', estilo || '', cantidadPersonas || 1, fechaSesion || '', horaSesion || '', notas || '', tipoPapel || '');

        console.log('Reserva guardada:', idPedido, clientName, clientEmail);
        res.json({
            success: true,
            message: 'Reserva recibida. Te contactaremos pronto.',
            pedidoId: idPedido
        });
    } catch (err) {
        console.error('Error al guardar reserva:', err);
        res.status(500).json({
            success: false,
            error: 'Error al guardar la reserva'
        });
    }
});

app.get('/api/reservas', (req, res) => {
    try {
        const stmt = dbWrapper.prepare(`SELECT * FROM reservas ORDER BY created_at DESC`);
        const rows = stmt.all();
        res.json({ success: true, reservas: rows });
    } catch (err) {
        console.error('Error al obtener reservas:', err);
        res.status(500).json({ success: false, error: 'Error al obtener reservas' });
    }
});

app.put('/api/reservas/:id/leer', (req, res) => {
    try {
        dbWrapper.prepare(`UPDATE reservas SET leido = 1 WHERE id = ?`).run(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Error' });
    }
});

app.get('/api/reservas/contador', (req, res) => {
    try {
        const result = dbWrapper.prepare(`SELECT COUNT(*) as total FROM reservas WHERE leido = 0`).get();
        res.json({ total: result ? result.total : 0 });
    } catch (err) {
        res.status(500).json({ total: 0 });
    }
});

app.post('/api/verificar-admin', (req, res) => {
    const { username, password } = req.body;

    try {
        const stmt = dbWrapper.prepare('SELECT * FROM users WHERE username = ? AND role = ?');
        const user = stmt.get(username, 'admin');

        if (user && bcrypt.compareSync(password, user.password)) {
            res.json({
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    userType: 'administrador'
                }
            });
        } else {
            res.status(401).json({
                success: false,
                error: 'Credenciales de admin invalidas'
            });
        }
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Error en el servidor' });
    }
});

app.get('/api/clients', (req, res) => {
    try {
        const stmt = dbWrapper.prepare('SELECT id, name, username, email, created_at FROM users');
        const rows = stmt.all();
        res.json({
            success: true,
            count: rows.length,
            clients: rows
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Database error' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Error interno del servidor',
        message: err.message
    });
});

dbWrapper.ready.then(() => {
    console.log('Base de datos lista');

    app.listen(PORT, () => {
        console.log('');
        console.log('==================================');
        console.log('   SERVIDOR FOTOTEC INICIADO');
        console.log('==================================');
        console.log(`   Puerto: ${PORT}`);
        console.log(`   URL: http://localhost:${PORT}`);
        console.log('==================================');
        console.log('');
    });
}).catch(err => {
    console.error('Error al inicializar la base de datos:', err);
    process.exit(1);
});

module.exports = app;
