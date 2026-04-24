const express = require("express");
const cors = require("cors");
const db = require("./db");
const bcrypt = require("bcryptjs");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

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

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
