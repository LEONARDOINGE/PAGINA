// ============ SERVIDOR EXPRESS CON NODEMAILER ============
// Backend para autenticación y envío de emails

const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
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
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
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
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
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
