const express = require("express");
const cors = require("cors");
const db = require("./db");
const bcrypt = require("bcryptjs");
const path = require("path");
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(cors());
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
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
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
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
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
