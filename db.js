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
    VALUES ("Admin", "admin", "admin@fototec.com", ?, "admin")
`);
stmt.run(defaultAdminPassword);

module.exports = db;