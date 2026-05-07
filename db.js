const Database = require("better-sqlite3");
const path = require("path");
const bcrypt = require("bcryptjs");
const fs = require("fs");

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, "database.db");

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.exec(`DROP TABLE IF EXISTS users`);

db.exec(`
    CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

const defaultAdminPassword = bcrypt.hashSync("admin123", 10);
const stmt = db.prepare(`
    INSERT OR IGNORE INTO users (name, username, email, password, role)
    VALUES (?, ?, ?, ?, ?)
`);
stmt.run("Admin", "admin", "admin@fototec.com", defaultAdminPassword, "admin");

// Crear tabla de productos
db.exec(`
    CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        precio REAL NOT NULL,
        stock INTEGER DEFAULT 0,
        categoria TEXT,
        imagen_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

// Crear tabla de reservas
db.exec(`
    CREATE TABLE IF NOT EXISTS reservas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        producto_id INTEGER NOT NULL,
        cantidad INTEGER NOT NULL,
        total_price REAL NOT NULL,
        estado TEXT DEFAULT 'pendiente',
        notas TEXT,
        fecha_reserva DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(usuario_id) REFERENCES users(id),
        FOREIGN KEY(producto_id) REFERENCES productos(id)
    )
`);

module.exports = db;