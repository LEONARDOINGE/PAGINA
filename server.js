const express = require('express');
const cors = require('cors');
const dbWrapper = require('./db');
const bcrypt = require('bcryptjs');
const path = require('path');
const crypto = require('crypto');
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
        return res.status(400).json({ error: "All fields are required" });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    try {
        const stmt = dbWrapper.prepare(`INSERT INTO users (name, username, email, password, verification_token) VALUES (?, ?, ?, ?, ?)`);
        const result = stmt.run(name, username, email, hashedPassword, verificationToken);
        
        const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
        const verifyUrl = `${baseUrl}/api/verify-email?token=${verificationToken}`;
        
        const mailOptions = {
            from: process.env.SMTP_USER || 'fototecventass@gmail.com',
            to: email,
            subject: 'FotoTec - Verifica tu cuenta',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #667eea;">FotoTec - Verificacion de Cuenta</h1>
                    <p>Hola <strong>${name}</strong>!</p>
                    <p>Gracias por registrarte en FotoTec. Para activar tu cuenta, haz clic en el siguiente enlace:</p>
                    <p style="margin: 30px 0;">
                        <a href="${verifyUrl}" style="background-color: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Verificar Cuenta</a>
                    </p>
                    <p>O copia y pega este enlace en tu navegador:</p>
                    <p style="word-break: break-all; color: #667eea;">${verifyUrl}</p>
                    <p>Este enlace expira en 24 horas.</p>
                    <p>Si no creaste esta cuenta, puedes ignorar este email.</p>
                </div>
            `
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error('Error enviando email de verificacion:', err);
            } else {
                console.log('Email de verificacion enviado:', info.response);
            }
        });

        res.json({ message: "User registered. Please check your email to verify your account.", userId: result.lastInsertRowid });
    } catch (err) {
        if (err.message.includes("UNIQUE constraint failed")) {
            return res.status(400).json({ error: "Username or email already exists" });
        }
        return res.status(500).json({ error: "Database error" });
    }
});

app.post("/api/login", (req, res) => {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
        return res.status(400).json({ error: "Username/email and password are required" });
    }

    try {
        const stmt = dbWrapper.prepare(`SELECT * FROM users WHERE username = ? OR email = ?`);
        const user = stmt.get(usernameOrEmail, usernameOrEmail);

        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const isValidPassword = bcrypt.compareSync(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        if (!user.is_verified) {
            return res.status(403).json({ error: "Please verify your email before logging in", needsVerification: true });
        }

        const { password: _, role, ...userWithoutPassword } = user;
        const userType = role === 'admin' ? 'administrador' : 'cliente';
        const userWithUserType = { ...userWithoutPassword, userType };
        res.json({ message: "Login successful", user: userWithUserType });
    } catch (err) {
        return res.status(500).json({ error: "Database error" });
    }
});

app.get("/api/verify-email", (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).json({ error: "Token is required" });
    }

    try {
        const stmt = dbWrapper.prepare(`SELECT * FROM users WHERE verification_token = ?`);
        const user = stmt.get(token);

        if (!user) {
            return res.status(404).json({ error: "Invalid or expired token" });
        }

        if (user.is_verified) {
            return res.json({ message: "Account already verified" });
        }

        dbWrapper.prepare(`UPDATE users SET is_verified = 1, verification_token = NULL WHERE id = ?`).run(user.id);
        dbWrapper.save();

        res.send(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Cuenta Verificada - FotoTec</title>
                <style>
                    body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
                    .container { background: white; padding: 40px; border-radius: 16px; text-align: center; box-shadow: 0 15px 50px rgba(0,0,0,0.3); max-width: 400px; }
                    h1 { color: #667eea; margin-bottom: 20px; }
                    p { color: #666; margin-bottom: 30px; }
                    a { background-color: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Cuenta Verificada!</h1>
                    <p>Tu cuenta ha sido verificada exitosamente. Ahora puedes iniciar sesion.</p>
                    <a href="/">Ir a FotoTec</a>
                </div>
            </body>
            </html>
        `);
    } catch (err) {
        return res.status(500).json({ error: "Database error" });
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

        dbWrapper.save();

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
        dbWrapper.save();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Error' });
    }
});

app.get('/api/reservas/contador', (req, res) => {
    try {
        const result = dbWrapper.prepare(`SELECT COUNT(*) as total FROM reservas WHERE leido = 0`).get();
        res.json({ total: result.total });
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
        console.log('Rutas disponibles:');
        console.log('  POST /api/register           - Registrar nuevo usuario');
        console.log('  POST /api/login             - Login de usuario');
        console.log('  POST /api/verificar-admin   - Verificar credenciales admin');
        console.log('  POST /enviar-reserva        - Enviar email de pedido');
        console.log('  GET  /api/test-smtp        - Test de conexion SMTP');
        console.log('  GET  /api/clients          - Obtener lista de clientes');
        console.log('  GET  /                     - Health check');
        console.log('');
    });
}).catch(err => {
    console.error('Error al inicializar la base de datos:', err);
    process.exit(1);
});

module.exports = app;
