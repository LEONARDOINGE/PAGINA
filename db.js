const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcryptjs");

// Path to the database file
const dbPath = path.join(__dirname, "database.db");

// Create or open the database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error opening database:", err.message);
    } else {
        console.log("Connected to the SQLite database.");
    }
});

// Create tables
db.serialize(() => {
    // Users table
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT "user" CHECK (role IN ("user", "admin")),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error("Error creating users table:", err.message);
        } else {
            console.log("Users table created or already exists.");
        }
    });

    // Insert default admin if not exists
    const defaultAdminPassword = bcrypt.hashSync("admin123", 10);
    db.run(`
        INSERT OR IGNORE INTO users (name, username, email, password, role)
        VALUES ("Admin", "admin", "admin@fototec.com", ?, "admin")
    `, [defaultAdminPassword], function(err) {
        if (err) {
            console.error("Error inserting default admin:", err.message);
        } else if (this.changes > 0) {
            console.log("Default admin user created.");
        } else {
            console.log("Default admin user already exists.");
        }
    });
});

module.exports = db;
