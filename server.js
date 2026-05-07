const express = require('express');
const cors = require('cors');
const db = require('./db');
const bcrypt = require('bcryptjs');
const path = require('path');
const nodemailer = require('nodemailer');
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

    try {
        const stmt = db.prepare(`INSERT INTO users (name, username, email, password) VALUES (?, ?, ?, ?)`);
        const result = stmt.run(name, username, email, hashedPassword);
        res.json({ message: "User registered successfully", userId: result.lastInsertRowid });
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
        const stmt = db.prepare(`SELECT * FROM users WHERE username = ? OR email = ?`);
        const user = stmt.get(usernameOrEmail, usernameOrEmail);

        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const isValidPassword = bcrypt.compareSync(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const { password: _, role, ...userWithoutPassword } = user;
        const userType = role === 'admin' ? 'administrador' : 'cliente';
        const userWithUserType = { ...userWithoutPassword, userType };
        res.json({ message: "Login successful", user: userWithUserType });
    } catch (err) {
        return res.status(500).json({ error: "Database error" });
    }
});

app.get("/api/users", (req, res) => {
    try {
        const stmt = db.prepare(`SELECT id, name, username, email, role, created_at FROM users`);
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
        const stmt = db.prepare('SELECT * FROM users WHERE username = ? AND role = ?');
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
        const stmt = db.prepare('SELECT id, name, username, email, created_at FROM users');
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

// ========== RUTAS CRUD DE PRODUCTOS ==========

// Obtener todos los productos
app.get('/api/productos', (req, res) => {
    try {
        const stmt = db.prepare('SELECT * FROM productos');
        const productos = stmt.all();
        res.json({
            success: true,
            count: productos.length,
            productos: productos
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Database error', details: err.message });
    }
});

// Obtener un producto por ID
app.get('/api/productos/:id', (req, res) => {
    try {
        const stmt = db.prepare('SELECT * FROM productos WHERE id = ?');
        const producto = stmt.get(req.params.id);
        if (!producto) {
            return res.status(404).json({ success: false, error: 'Producto no encontrado' });
        }
        res.json({ success: true, producto: producto });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Database error', details: err.message });
    }
});

// Crear un nuevo producto
app.post('/api/productos', (req, res) => {
    const { nombre, descripcion, precio, stock, categoria, imagen_url } = req.body;

    if (!nombre || !precio) {
        return res.status(400).json({ success: false, error: 'Nombre y precio son requeridos' });
    }

    try {
        const stmt = db.prepare(`
            INSERT INTO productos (nombre, descripcion, precio, stock, categoria, imagen_url)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(nombre, descripcion || null, precio, stock || 0, categoria || null, imagen_url || null);
        res.json({
            success: true,
            message: 'Producto creado exitosamente',
            id: result.lastInsertRowid
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Database error', details: err.message });
    }
});

// Actualizar un producto
app.put('/api/productos/:id', (req, res) => {
    const { nombre, descripcion, precio, stock, categoria, imagen_url } = req.body;

    if (!nombre || !precio) {
        return res.status(400).json({ success: false, error: 'Nombre y precio son requeridos' });
    }

    try {
        const stmt = db.prepare(`
            UPDATE productos 
            SET nombre = ?, descripcion = ?, precio = ?, stock = ?, categoria = ?, imagen_url = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);
        const result = stmt.run(nombre, descripcion || null, precio, stock || 0, categoria || null, imagen_url || null, req.params.id);
        if (result.changes === 0) {
            return res.status(404).json({ success: false, error: 'Producto no encontrado' });
        }
        res.json({ success: true, message: 'Producto actualizado exitosamente' });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Database error', details: err.message });
    }
});

// Eliminar un producto
app.delete('/api/productos/:id', (req, res) => {
    try {
        const stmt = db.prepare('DELETE FROM productos WHERE id = ?');
        const result = stmt.run(req.params.id);
        if (result.changes === 0) {
            return res.status(404).json({ success: false, error: 'Producto no encontrado' });
        }
        res.json({ success: true, message: 'Producto eliminado exitosamente' });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Database error', details: err.message });
    }
});

// ========== RUTAS CRUD DE RESERVAS ==========

// Obtener todas las reservas
app.get('/api/reservas', (req, res) => {
    try {
        const stmt = db.prepare(`
            SELECT r.*, u.name, u.email, p.nombre as producto_nombre, p.precio
            FROM reservas r
            JOIN users u ON r.usuario_id = u.id
            JOIN productos p ON r.producto_id = p.id
        `);
        const reservas = stmt.all();
        res.json({
            success: true,
            count: reservas.length,
            reservas: reservas
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Database error', details: err.message });
    }
});

// Obtener reservas de un usuario
app.get('/api/reservas/usuario/:usuario_id', (req, res) => {
    try {
        const stmt = db.prepare(`
            SELECT r.*, p.nombre as producto_nombre, p.precio
            FROM reservas r
            JOIN productos p ON r.producto_id = p.id
            WHERE r.usuario_id = ?
        `);
        const reservas = stmt.all(req.params.usuario_id);
        res.json({
            success: true,
            count: reservas.length,
            reservas: reservas
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Database error', details: err.message });
    }
});

// Crear una nueva reserva
app.post('/api/reservas', (req, res) => {
    const { usuario_id, producto_id, cantidad, notas } = req.body;

    if (!usuario_id || !producto_id || !cantidad) {
        return res.status(400).json({ success: false, error: 'usuario_id, producto_id y cantidad son requeridos' });
    }

    try {
        // Obtener el precio del producto
        const productoStmt = db.prepare('SELECT precio, stock FROM productos WHERE id = ?');
        const producto = productoStmt.get(producto_id);

        if (!producto) {
            return res.status(404).json({ success: false, error: 'Producto no encontrado' });
        }

        if (producto.stock < cantidad) {
            return res.status(400).json({ success: false, error: 'Stock insuficiente' });
        }

        const total_price = producto.precio * cantidad;

        const stmt = db.prepare(`
            INSERT INTO reservas (usuario_id, producto_id, cantidad, total_price, notas)
            VALUES (?, ?, ?, ?, ?)
        `);
        const result = stmt.run(usuario_id, producto_id, cantidad, total_price, notas || null);

        // Reducir el stock del producto
        const updateStockStmt = db.prepare('UPDATE productos SET stock = stock - ? WHERE id = ?');
        updateStockStmt.run(cantidad, producto_id);

        res.json({
            success: true,
            message: 'Reserva creada exitosamente',
            id: result.lastInsertRowid,
            total_price: total_price
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Database error', details: err.message });
    }
});

// Actualizar estado de una reserva
app.put('/api/reservas/:id', (req, res) => {
    const { estado, notas } = req.body;

    if (!estado) {
        return res.status(400).json({ success: false, error: 'estado es requerido' });
    }

    try {
        const stmt = db.prepare('UPDATE reservas SET estado = ?, notas = ? WHERE id = ?');
        const result = stmt.run(estado, notas || null, req.params.id);

        if (result.changes === 0) {
            return res.status(404).json({ success: false, error: 'Reserva no encontrada' });
        }

        res.json({ success: true, message: 'Reserva actualizada exitosamente' });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Database error', details: err.message });
    }
});

// Cancelar una reserva (eliminar)
app.delete('/api/reservas/:id', (req, res) => {
    try {
        // Obtener los detalles de la reserva para devolver el stock
        const getReservaStmt = db.prepare('SELECT producto_id, cantidad FROM reservas WHERE id = ?');
        const reserva = getReservaStmt.get(req.params.id);

        if (!reserva) {
            return res.status(404).json({ success: false, error: 'Reserva no encontrada' });
        }

        // Devolver el stock al producto
        const updateStockStmt = db.prepare('UPDATE productos SET stock = stock + ? WHERE id = ?');
        updateStockStmt.run(reserva.cantidad, reserva.producto_id);

        // Eliminar la reserva
        const deleteStmt = db.prepare('DELETE FROM reservas WHERE id = ?');
        deleteStmt.run(req.params.id);

        res.json({ success: true, message: 'Reserva cancelada exitosamente' });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Database error', details: err.message });
    }
});

app.get('/', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Servidor FotoTec Express esta corriendo',
        port: PORT,
        timestamp: new Date().toISOString()
    });
});

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Error interno del servidor',
        message: err.message
    });
});

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
    console.log('  GET  /enviar-reserva/test   - Test de conexion SMTP');
    console.log('  GET  /api/clients           - Obtener lista de clientes');
    console.log('  GET  /api/productos         - Obtener todos los productos');
    console.log('  GET  /api/productos/:id     - Obtener un producto');
    console.log('  POST /api/productos         - Crear nuevo producto');
    console.log('  PUT  /api/productos/:id     - Actualizar producto');
    console.log('  DELETE /api/productos/:id   - Eliminar producto');
    console.log('  GET  /api/reservas          - Obtener todas las reservas');
    console.log('  GET  /api/reservas/usuario/:id - Reservas de un usuario');
    console.log('  POST /api/reservas          - Crear nueva reserva');
    console.log('  PUT  /api/reservas/:id      - Actualizar estado de reserva');
    console.log('  DELETE /api/reservas/:id    - Cancelar reserva');
    console.log('  GET  /                      - Health check');
    console.log('');
});

module.exports = app;