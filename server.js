const express = require('express');
const cors = require('cors');
const dbWrapper = require('./db');
const bcrypt = require('bcryptjs');
const path = require('path');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    tls: { rejectUnauthorized: false }
});

transporter.verify((error, success) => {
    if (error) {
        console.error('Nodemailer verify error:', error);
    } else {
        console.log('Nodemailer está listo para enviar mensajes');
    }
});

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
    const { clientEmail, clientName, pedidoId, productos, total } = req.body;

    if (!clientEmail || !clientName || !pedidoId) {
        return res.status(400).json({
            success: false,
            error: 'Faltan datos requeridos (email, nombre, pedidoId)'
        });
    }

    let productosHTML = '';
    if (productos && Array.isArray(productos)) {
        productosHTML = productos.map(p => `
            <tr>
                <td>${p.nombre}</td>
                <td>${p.cantidad}</td>
                <td>$${p.precio}</td>
                <td>$${(p.cantidad * p.precio).toFixed(2)}</td>
            </tr>
        `).join('');
    }

    const mailOptions = {
        from: process.env.SMTP_USER || 'fototecventass@gmail.com',
        to: clientEmail,
        subject: `Pedido Confirmado #${pedidoId}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1>FotoTec - Confirmacion de Pedido</h1>
                <p>Hola <strong>${clientName}</strong>!</p>
                <p>Tu pedido ha sido recibido. Detalles:</p>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <thead>
                        <tr style="background-color: #667eea; color: white;">
                            <th style="padding: 10px; text-align: left;">Producto</th>
                            <th style="padding: 10px; text-align: center;">Cantidad</th>
                            <th style="padding: 10px; text-align: right;">Precio</th>
                            <th style="padding: 10px; text-align: right;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${productosHTML}
                    </tbody>
                </table>
                <h3 style="text-align: right;">Total: <span style="color: #667eea; font-size: 1.5em;">$${total?.toFixed(2) || '0.00'}</span></h3>
                <hr style="margin: 30px 0; border: none; border-top: 2px solid #eee;">
                <p>ID Pedido: #${pedidoId}</p>
                <p>Estado: Pendiente de Confirmacion</p>
                <p>Fecha: ${new Date().toLocaleDateString('es-ES')}</p>
                <hr style="margin: 30px 0; border: none; border-top: 2px solid #eee;">
                <p>En breve recibiras un email confirmando el envio.</p>
                <p style="color: #999; font-size: 0.9em;">
                    Contacto: fototecventass@gmail.com
                </p>
            </div>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error al enviar email de reserva:', error);
            return res.status(500).json({
                success: false,
                error: 'Error al enviar email',
                details: error.message
            });
        }

        console.log('Email de reserva enviado:', info.response);
        res.json({
            success: true,
            message: 'Email de confirmacion enviado exitosamente',
            emailSent: info.response
        });
    });
});

app.get('/enviar-reserva/test', (req, res) => {
    const testEmail = process.env.SMTP_USER || 'fototecventass@gmail.com';

    const mailOptions = {
        from: testEmail,
        to: testEmail,
        subject: 'Test de SMTP - FotoTec',
        html: `
            <h1>Test de Conexion SMTP</h1>
            <p>Si recibes este email, la configuracion de SMTP esta correcta.</p>
            <p><strong>Hora:</strong> ${new Date().toLocaleString('es-ES')}</p>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error en test SMTP:', error);
            return res.status(500).json({
                success: false,
                error: 'Error al conectar SMTP',
                details: error.message
            });
        }

        console.log('Test SMTP exitoso:', info.response);
        res.json({
            success: true,
            message: 'Test SMTP exitoso - Email enviado',
            smtpUser: testEmail
        });
    });
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
        console.log('  GET  /enviar-reserva/test  - Test de conexion SMTP');
        console.log('  GET  /api/clients          - Obtener lista de clientes');
        console.log('  GET  /                     - Health check');
        console.log('');
    });
}).catch(err => {
    console.error('Error al inicializar la base de datos:', err);
    process.exit(1);
});

module.exports = app;
