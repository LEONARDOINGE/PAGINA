const express = require('express');
const cors = require('cors');
const dbWrapper = require('./db');
const bcrypt = require('bcryptjs');
const path = require('path');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const dns = require('dns');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

let transporter;

function initTransporter() {
    return new Promise((resolve) => {
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;

        console.log('=== CONFIG SMTP ===');
        console.log('SMTP_USER:', smtpUser || 'NO CONFIGURADO');
        console.log('SMTP_PASS:', smtpPass ? 'OK' : 'NO CONFIGURADO');
        console.log('SMTP_HOST:', process.env.SMTP_HOST);
        console.log('SMTP_PORT:', process.env.SMTP_PORT);
        console.log('====================');

        transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: { user: smtpUser, pass: smtpPass },
            tls: { rejectUnauthorized: false, servername: 'smtp.gmail.com' }
        });

        transporter.verify((error, success) => {
            if (error) {
                console.error('Nodemailer verify error:', error.message);
            } else {
                console.log('Nodemailer listo');
            }
            resolve();
        });
    });
}

app.get('/api/test-smtp', (req, res) => {
    console.log('=== DIAGNOSTICO SMTP ===');
    console.log('SMTP_USER:', process.env.SMTP_USER);
    console.log('SMTP_PASS:', process.env.SMTP_PASS ? '(configurado)' : '(VACIO)');
    console.log('========================');

    const testEmail = process.env.SMTP_USER || 'fototecventass@gmail.com';
    const mailOptions = {
        from: testEmail,
        to: testEmail,
        subject: 'Test SMTP - FotoTec',
        html: `<h1>Test SMTP</h1><p>Hora: ${new Date().toISOString()}</p>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Test SMTP error:', error);
            return res.status(500).json({
                success: false,
                error: error.message,
                code: error.code,
                command: error.command
            });
        }
        console.log('Test SMTP exitoso');
        res.json({ success: true, message: 'SMTP funciona!' });
    });
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

    let productosHTML = '';
    if (productos && Array.isArray(productos) && productos.length > 0) {
        productosHTML = productos.map(p => `
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd;">${p.nombre || 'Sesión fotográfica'}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${p.cantidad || 1}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">$${p.precio || 0}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">$${((p.cantidad || 1) * (p.precio || 0)).toFixed(2)}</td>
            </tr>
        `).join('');
    } else {
        productosHTML = `<tr><td style="padding: 8px; border: 1px solid #ddd;">Sesión fotográfica</td><td style="padding: 8px; border: 1px solid #ddd; text-align: center;">1</td><td style="padding: 8px; border: 1px solid #ddd; text-align: right;">$0</td><td style="padding: 8px; border: 1px solid #ddd; text-align: right;">$0</td></tr>`;
    }

    const sesionInfo = `
        <tr><td style="padding: 6px; border: 1px solid #ddd;"><strong>Tipo de Sesión</strong></td><td style="padding: 6px; border: 1px solid #ddd;">${tipoSesion || 'No especificado'}</td></tr>
        <tr><td style="padding: 6px; border: 1px solid #ddd;"><strong>Estilo</strong></td><td style="padding: 6px; border: 1px solid #ddd;">${estilo || 'No especificado'}</td></tr>
        <tr><td style="padding: 6px; border: 1px solid #ddd;"><strong>Personas</strong></td><td style="padding: 6px; border: 1px solid #ddd;">${cantidadPersonas || 'No especificado'}</td></tr>
        <tr><td style="padding: 6px; border: 1px solid #ddd;"><strong>Fecha</strong></td><td style="padding: 6px; border: 1px solid #ddd;">${fechaSesion || 'No especificada'}</td></tr>
        <tr><td style="padding: 6px; border: 1px solid #ddd;"><strong>Hora</strong></td><td style="padding: 6px; border: 1px solid #ddd;">${horaSesion || 'No especificada'}</td></tr>
        <tr><td style="padding: 6px; border: 1px solid #ddd;"><strong>Teléfono</strong></td><td style="padding: 6px; border: 1px solid #ddd;">${telefono || 'No proporcionado'}</td></tr>
        <tr><td style="padding: 6px; border: 1px solid #ddd;"><strong>Notas</strong></td><td style="padding: 6px; border: 1px solid #ddd;">${notas || 'Ninguna'}</td></tr>
    `;

    const mailOptions = {
        from: process.env.SMTP_USER || 'fototecventass@gmail.com',
        to: clientEmail,
        subject: `FotoTec - Solicitud de Reserva #${idPedido}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 2em;">📸 FotoTec</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Solicitud de Reserva Recibida</p>
                </div>
                <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px; border: 1px solid #eee;">
                    <h2 style="color: #667eea; margin-top: 0;">¡Hola <strong>${clientName}</strong>!</h2>
                    <p>Hemos recibido tu solicitud de reserva. Nuestro equipo se pondrá en contacto contigo pronto para confirmar la disponibilidad y los detalles.</p>

                    <h3 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">📋 Detalles de la Solicitud</h3>
                    <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                        <tbody>
                            ${sesionInfo}
                        </tbody>
                    </table>

                    <h3 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">📦 Resumen</h3>
                    <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                        <thead>
                            <tr style="background-color: #667eea; color: white;">
                                <th style="padding: 10px; text-align: left;">Producto/Servicio</th>
                                <th style="padding: 10px; text-align: center;">Cantidad</th>
                                <th style="padding: 10px; text-align: right;">Precio</th>
                                <th style="padding: 10px; text-align: right;">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${productosHTML}
                        </tbody>
                    </table>
                    <h3 style="text-align: right; color: #667eea;">Total: <span style="font-size: 1.5em;">$${total?.toFixed(2) || '0.00'}</span></h3>

                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 20px;">
                        <p style="margin: 0;"><strong>📞Teléfono:</strong> +52 899 207 0611</p>
                        <p style="margin: 5px 0 0 0;"><strong>📧Email:</strong> fototecventass@gmail.com</p>
                        <p style="margin: 5px 0 0 0;"><strong>📍Dirección:</strong> Av. Tecnológico 318, Reynosa, Tamps.</p>
                    </div>
                    <p style="color: #999; font-size: 0.85em; margin-top: 20px; text-align: center;">
                        Esta es una confirmación de que recibimos tu solicitud. El pago se realiza al confirmar la cita.
                    </p>
                </div>
            </div>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error al enviar email de reserva:', error);
            let mensajeError = 'Error al enviar email';
            if (error.message.includes('Invalid login')) {
                mensajeError = 'Error de autenticacion SMTP. Verifica SMTP_PASS en Render.';
            } else if (error.message.includes('ECONNREFUSED')) {
                mensajeError = 'No se pudo conectar al servidor SMTP.';
            } else if (error.message.includes('ETIMEDOUT')) {
                mensajeError = 'Tiempo de espera agotado con el servidor SMTP.';
            }
            return res.status(500).json({
                success: false,
                error: mensajeError,
                details: error.message
            });
        }

        console.log('Email de reserva enviado:', info.response);
        res.json({
            success: true,
            message: 'Reserva recibida. Te contactaremos pronto.',
            pedidoId: idPedido,
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

dbWrapper.ready.then(async () => {
    console.log('Base de datos lista');
    await initTransporter();

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
