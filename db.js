const initSqlJs = require("sql.js").default;
const path = require("path");
const bcrypt = require("bcryptjs");
const fs = require("fs");

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, "database.db");

let db;
let SQL;
let dbReady = false;

const dbWrapper = {
    prepare(sql) {
        return {
            run(...params) {
                db.run(sql, params);
                const res = db.exec("SELECT last_insert_rowid() as id");
                return { lastInsertRowid: res[0] ? res[0].values[0][0] : 0 };
            },
            get(...params) {
                const stmt = db.prepare(sql);
                stmt.bind(params);
                if (stmt.step()) {
                    const cols = stmt.getColumnNames();
                    const vals = stmt.get();
                    stmt.free();
                    const row = {};
                    cols.forEach((c, i) => row[c] = vals[i]);
                    return row;
                }
                stmt.free();
                return undefined;
            },
            all(...params) {
                const stmt = db.prepare(sql);
                stmt.bind(params);
                const rows = [];
                while (stmt.step()) {
                    const cols = stmt.getColumnNames();
                    const vals = stmt.get();
                    const row = {};
                    cols.forEach((c, i) => row[c] = vals[i]);
                    rows.push(row);
                }
                stmt.free();
                return rows;
            }
        };
    },
    exec(sql) {
        db.run(sql);
    },
    save() {
        if (!dbReady) return;
        try {
            const data = db.export();
            fs.writeFileSync(dbPath, Buffer.from(data));
        } catch (e) {
            console.log('No se pudo guardar BD:', e.message);
        }
    }
};

async function init() {
    const wasmPath = path.join(__dirname, "node_modules", "sql.js", "dist", "sql-wasm.wasm");
    SQL = await initSqlJs({ locateFile: () => wasmPath });

    let fileBuffer = null;
    if (fs.existsSync(dbPath)) {
        try {
            fileBuffer = fs.readFileSync(dbPath);
            console.log('BD cargada desde archivo');
        } catch (e) {
            console.log('No se pudo leer BD, creando nueva');
        }
    } else {
        console.log('No existe BD, creando nueva');
    }

    db = new SQL.Database(fileBuffer);

    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        is_verified INTEGER DEFAULT 1,
        verification_token TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS reservas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        email TEXT NOT NULL,
        telefono TEXT NOT NULL,
        tipo_sesion TEXT NOT NULL,
        estilo TEXT,
        cantidad_personas INTEGER,
        fecha_sesion TEXT NOT NULL,
        hora_sesion TEXT NOT NULL,
        notas TEXT,
        tipo_papel TEXT,
        leido INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    const defaultAdminPassword = bcrypt.hashSync("admin123", 10);
    db.run(
        `INSERT OR IGNORE INTO users (name, username, email, password, role, is_verified) VALUES (?, ?, ?, ?, ?, 1)`,
        ["Admin", "admin", "admin@fototec.com", defaultAdminPassword, "admin"]
    );

    dbWrapper.save();
    dbReady = true;
    console.log('Base de datos lista');

    return dbWrapper;
}

let readyPromise = init();

dbWrapper.ready = readyPromise;

module.exports = dbWrapper;
