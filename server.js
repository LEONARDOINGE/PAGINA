<<<<<<< HEAD
const express = require("express");
const cors = require("cors");
const db = require("./db");
const bcrypt = require("bcryptjs");
const path = require("path");
=======
// ============ SERVIDOR EXPRESS CON NODEMAILER ============
// Backend para autenticación y envío de emails

const express = require('express');
const cors = require('cors');
>>>>>>> f9cbc238828c374abb4819880866ba586e847293
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
<<<<<<< HEAD
const PORT = 3000;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER || 'fototecventass@gmail.com',
        pass: process.env.SMTP_PASS || 'iusykmyujsrycadt'
    },
    tls: { rejectUnauthorized: false }
});

// Verificar conexión/credenciales al iniciar
transporter.verify((error, success) => {
    if (error) {
        console.error('Nodemailer verify error:', error);
    } else {
        console.log('Nodemailer está listo para enviar mensajes');
    }
});

// Register endpoint
app.post("/api/register", (req, res) => {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    db.run(
        `INSERT INTO users (name, username, email, password) VALUES (?, ?, ?, ?)`,
        [name, username, email, hashedPassword],
        function(err) {
            if (err) {
                if (err.message.includes("UNIQUE constraint failed")) {
                    return res.status(400).json({ error: "Username or email already exists" });
                }
                return res.status(500).json({ error: "Database error" });
            }
            res.json({ message: "User registered successfully", userId: this.lastID });
        }
    );
});

// Login endpoint
app.post("/api/login", (req, res) => {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
        return res.status(400).json({ error: "Username/email and password are required" });
    }

    db.get(
        `SELECT * FROM users WHERE username = ? OR email = ?`,
        [usernameOrEmail, usernameOrEmail],
        (err, user) => {
            if (err) {
                return res.status(500).json({ error: "Database error" });
            }
            if (!user) {
                return res.status(401).json({ error: "Invalid credentials" });
            }

            const isValidPassword = bcrypt.compareSync(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({ error: "Invalid credentials" });
            }

            // Return user info without password
            const { password: _, ...userWithoutPassword } = user;
            res.json({ message: "Login successful", user: userWithoutPassword });
        }
    );
});

// Get all users (for admin)
app.get("/api/users", (req, res) => {
    db.all(`SELECT id, name, username, email, role, created_at FROM users`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: "Database error" });
        }
        res.json(rows);
    });
});

// Ruta para procesar la reserva
app.post('/enviar-reserva', (req, res) => {
    const { nombre, fecha, telefono, mensaje } = req.body;

    const mailOptions = {
        from: `Sistema de Reservas Fototec <${process.env.SMTP_USER || 'fototecventass@gmail.com'}>`,
        to: process.env.SMTP_USER || 'fototecventass@gmail.com', // Llega a la cuenta configurada
        subject: `Reserva Nueva: ${nombre}`,
        text: `Detalles de la reserva:\n\nNombre: ${nombre}\nFecha: ${fecha}\nTeléfono: ${telefono}\nMensaje: ${mensaje}`
=======
const PORT = process.env.PORT || 3000;

// ============ MIDDLEWARE ============
app.use(cors());
app.use(express.json());

// ============ DATOS (En desarrollo, usaría MongoDB) ============
let clients = [];

// ============ CONFIGURACIÓN DE NODEMAILER ============
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER || 'fototecventass@gmail.com',
        pass: process.env.SMTP_PASS || 'iusykmyujsrycadt'
    }
});

// Verificar conexión con SMTP
transporter.verify((error, success) => {
    if (error) {
        console.log('❌ Error de conexión SMTP:', error);
    } else {
        console.log('✅ Servidor SMTP listo para enviar emails');
    }
});

// ============ RUTAS DE AUTENTICACIÓN ============

/**
 * Registro de cliente
 * POST /api/register
 */
app.post('/api/register', (req, res) => {
    const { name, username, email, password } = req.body;

    // Validaciones
    if (!name || !username || !email || !password) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Verificar si el usuario ya existe
    if (clients.some(c => c.username === username || c.email === email)) {
        return res.status(400).json({ error: 'El usuario o email ya existe' });
    }

    // Crear nuevo cliente
    const newClient = {
        id: clients.length + 1,
        name,
        username,
        email,
        password, // En producción, usar bcrypt para hashear
        phone: '',
        createdAt: new Date().toISOString(),
        userType: 'cliente'
    };

    clients.push(newClient);

    // Enviar email de bienvenida
    const mailOptions = {
        from: process.env.SMTP_USER || 'fototecventass@gmail.com',
        to: email,
        subject: '¡Bienvenido a FotoTec!',
        html: `
            <h1>¡Hola ${name}!</h1>
            <p>Tu cuenta ha sido creada exitosamente.</p>
            <p><strong>Usuario:</strong> ${username}</p>
            <p>Ahora puedes acceder a FotoTec con tus credenciales.</p>
            <br>
            <p>📞 Si tienes preguntas, contáctanos a: fototecventass@gmail.com</p>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('⚠️ Error al enviar email:', error);
        } else {
            console.log('✅ Email enviado:', info.response);
        }
    });

    res.status(201).json({ 
        success: true, 
        message: 'Cliente registrado exitosamente',
        user: { id: newClient.id, username, email }
    });
});

/**
 * Login de cliente
 * POST /api/login
 */
app.post('/api/login', (req, res) => {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
        return res.status(400).json({ error: 'Usuario/email y contraseña requeridos' });
    }

    // Buscar cliente
    const client = clients.find(c => 
        (c.username === usernameOrEmail || c.email === usernameOrEmail) &&
        c.password === password
    );

    if (!client) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    res.json({ 
        success: true,
        message: 'Login exitoso',
        user: {
            id: client.id,
            name: client.name,
            username: client.username,
            email: client.email,
            userType: client.userType
        }
    });
});

// ============ RUTAS DE EMAIL ============

/**
 * Enviar email de reserva/pedido
 * POST /enviar-reserva
 */
app.post('/enviar-reserva', (req, res) => {
    const { clientEmail, clientName, pedidoId, productos, total } = req.body;

    if (!clientEmail || !clientName || !pedidoId) {
        return res.status(400).json({ 
            success: false, 
            error: 'Faltan datos requeridos (email, nombre, pedidoId)' 
        });
    }

    // Crear HTML del email
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
        subject: `🎉 Pedido Confirmado #${pedidoId}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1>📸 FotoTec - Confirmación de Pedido</h1>
                
                <p>¡Hola <strong>${clientName}</strong>!</p>
                
                <p>Tu pedido ha sido recibido y confirmado. Aquí están los detalles:</p>
                
                <h2>Detalles del Pedido</h2>
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
                
                <h3>Información del Pedido</h3>
                <p>
                    <strong>ID Pedido:</strong> #${pedidoId}<br>
                    <strong>Estado:</strong> Pendiente de Confirmación<br>
                    <strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES')}
                </p>
                
                <hr style="margin: 30px 0; border: none; border-top: 2px solid #eee;">
                
                <p>En breve recibirás un email confirmando el envío de tu pedido.</p>
                
                <p style="color: #999; font-size: 0.9em;">
                    📞 Si tienes preguntas, contáctanos: fototecventass@gmail.com<br>
                    © 2026 FotoTec. Todos los derechos reservados.
                </p>
            </div>
        `
>>>>>>> f9cbc238828c374abb4819880866ba586e847293
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
<<<<<<< HEAD
            console.error("Error al enviar:", error);
            res.status(500).json({ error: error.message, code: error.code, response: error.response });
        } else {
            console.log("Correo enviado con éxito:", info.response);
            res.json({ message: "¡Reserva enviada! Nos pondremos en contacto pronto.", info: info.response });
        }
    });
});

// Ruta de prueba para comprobar envío rápido
app.get('/enviar-reserva/test', (req, res) => {
    const mailOptions = {
        from: `Prueba <${process.env.SMTP_USER || 'fototecventass@gmail.com'}>`,
        to: process.env.SMTP_USER || 'fototecventass@gmail.com',
        subject: 'Prueba de envío - Sistema de Reservas',
        text: 'Este es un correo de prueba para verificar la configuración SMTP.'
=======
            console.log('❌ Error al enviar email de reserva:', error);
            return res.status(500).json({ 
                success: false, 
                error: 'Error al enviar email',
                details: error.message 
            });
        }

        console.log('✅ Email de reserva enviado:', info.response);
        res.json({ 
            success: true, 
            message: 'Email de confirmación enviado exitosamente',
            emailSent: info.response 
        });
    });
});

/**
 * Probar conexión SMTP
 * GET /enviar-reserva/test
 */
app.get('/enviar-reserva/test', (req, res) => {
    const testEmail = process.env.SMTP_USER || 'fototecventass@gmail.com';

    const mailOptions = {
        from: testEmail,
        to: testEmail,
        subject: '🧪 Test de SMTP - FotoTec',
        html: `
            <h1>✅ Test de Conexión SMTP</h1>
            <p>Si recibes este email, la configuración de SMTP está correcta.</p>
            <p><strong>Hora:</strong> ${new Date().toLocaleString('es-ES')}</p>
        `
>>>>>>> f9cbc238828c374abb4819880866ba586e847293
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
<<<<<<< HEAD
            console.error('Error en prueba de envío:', error);
            return res.status(500).json({ ok: false, error: error.message, code: error.code, response: error.response });
        }
        console.log('Prueba enviada:', info.response);
        res.json({ ok: true, info: info.response });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Ruta simple para recibir el formulario de registro desde /registro
app.post('/registro', (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).send('<h3>Faltan campos requeridos</h3><a href="/">Volver</a>');
    }

    if (password.length < 6) {
        return res.status(400).send('<h3>La contraseña debe tener al menos 6 caracteres</h3><a href="/">Volver</a>');
    }

    const hashed = bcrypt.hashSync(password, 10);

    // Usamos 'username' tanto para name como para username en la tabla
    db.run(
        `INSERT INTO users (name, username, email, password) VALUES (?, ?, ?, ?)`,
        [username, username, email, hashed],
        function(err) {
            if (err) {
                console.error('Error al insertar usuario:', err.message);
                const msg = err.message && err.message.includes('UNIQUE') ? 'El usuario o email ya existe' : 'Error en la base de datos';
                return res.status(500).send(`<h3>${msg}</h3><a href="/">Volver</a>`);
            }

            // Enviar notificación por correo (no bloquear respuesta al cliente)
            const mailOptions = {
                from: `Sistema FotoTec <${process.env.SMTP_USER || 'fototecventass@gmail.com'}>`,
                to: process.env.SMTP_USER || 'fototecventass@gmail.com',
                subject: `Nuevo usuario: ${username}`,
                text: `Se registró un nuevo usuario:\nNombre: ${username}\nEmail: ${email}`
            };

            transporter.sendMail(mailOptions, (mailErr, info) => {
                if (mailErr) console.error('Error al enviar correo de notificación:', mailErr);
                else console.log('Notificación enviada:', info && info.response);
            });

            // Responder al cliente
            res.send('<h1>Registro exitoso</h1><p>Tu cuenta se ha creado.</p><a href="/">Volver</a>');
        }
    );
});

// Ruta para procesar formulario de login desde el HTML
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send('<h3>Faltan campos requeridos</h3><a href="/">Volver</a>');
    }

    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err) {
            console.error('DB error on login:', err.message);
            return res.status(500).send('<h3>Error en el servidor</h3>');
        }
        if (!user) {
            return res.send('<h3>Correo o contraseña incorrectos</h3><a href="/">Volver</a>');
        }

        const valid = bcrypt.compareSync(password, user.password);
        if (!valid) {
            return res.send('<h3>Correo o contraseña incorrectos</h3><a href="/">Volver</a>');
        }

        // Login correcto
        res.send(`<h1>Bienvenido de nuevo, ${user.name}</h1><p>Has iniciado sesión correctamente.</p><a href="/">Ir al inicio</a>`);
    });
});
=======
            console.log('❌ Error en test SMTP:', error);
            return res.status(500).json({ 
                success: false,
                error: 'Error al conectar SMTP',
                details: error.message
            });
        }

        console.log('✅ Test SMTP exitoso:', info.response);
        res.json({ 
            success: true,
            message: 'Test SMTP exitoso - Email enviado',
            smtpUser: testEmail
        });
    });
});

// ============ RUTAS DE VERIFICACIÓN ============

/**
 * Verificar credenciales de admin
 * POST /api/verificar-admin
 */
app.post('/api/verificar-admin', (req, res) => {
    const { username, password } = req.body;

    // Admin hardcodeado (en producción, iría a la BD)
    const adminCredentials = {
        username: 'admin',
        password: '12345',
        userType: 'administrador'
    };

    if (username === adminCredentials.username && password === adminCredentials.password) {
        res.json({ 
            success: true,
            user: {
                id: 0,
                username: adminCredentials.username,
                userType: adminCredentials.userType
            }
        });
    } else {
        res.status(401).json({ 
            success: false,
            error: 'Credenciales de admin inválidas' 
        });
    }
});

// ============ RUTAS DE DATOS ============

/**
 * Obtener todos los clientes (solo para admin)
 * GET /api/clients
 */
app.get('/api/clients', (req, res) => {
    res.json({ 
        success: true,
        count: clients.length,
        clients: clients 
    });
});

/**
 * Health check
 * GET /
 */
app.get('/', (req, res) => {
    res.json({ 
        status: 'OK',
        message: 'Servidor FotoTec Express está corriendo',
        port: PORT,
        timestamp: new Date().toISOString()
    });
});

// ============ MANEJO DE ERRORES ============

app.use((err, req, res, next) => {
    console.error('❌ Error:', err);
    res.status(500).json({ 
        error: 'Error interno del servidor',
        message: err.message 
    });
});

// ============ INICIO DEL SERVIDOR ============

app.listen(PORT, () => {
    console.log('');
    console.log('╔════════════════════════════════════════╗');
    console.log('║   🚀 SERVIDOR FOTOTEC INICIADO        ║');
    console.log('╠════════════════════════════════════════╣');
    console.log(`║   Puerto: ${PORT}`);
    console.log(`║   URL: http://localhost:${PORT}`);
    console.log('║   ✅ CORS habilitado');
    console.log('║   📧 Nodemailer configurado');
    console.log('╚════════════════════════════════════════╝');
    console.log('');
    console.log('Rutas disponibles:');
    console.log('  POST /api/register           - Registrar nuevo cliente');
    console.log('  POST /api/login              - Login de cliente');
    console.log('  POST /api/verificar-admin    - Verificar credenciales admin');
    console.log('  POST /enviar-reserva         - Enviar email de pedido');
    console.log('  GET  /enviar-reserva/test    - Test de conexión SMTP');
    console.log('  GET  /api/clients            - Obtener lista de clientes');
    console.log('  GET  /                       - Health check');
    console.log('');
});

module.exports = app;
>>>>>>> f9cbc238828c374abb4819880866ba586e847293
