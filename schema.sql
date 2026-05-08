-- Schema para Cloudflare D1 - FotoTec

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
    is_verified INTEGER DEFAULT 0,
    verification_token TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de reservas
CREATE TABLE IF NOT EXISTS reservas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL,
    telefono TEXT NOT NULL,
    fecha_cumpleanos TEXT,
    tipo_sesion TEXT NOT NULL,
    estilo TEXT,
    cantidad_personas INTEGER,
    fecha_sesion TEXT NOT NULL,
    hora_sesion TEXT NOT NULL,
    notas TEXT,
    interes_impresion TEXT,
    tipo_papel TEXT,
    terminos TEXT,
    datos_crm TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Crear índice para búsqueda rápida de usuarios
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Insertar admin inicial (contraseña: admin123)
-- Hash SHA-256 de 'admin123' + salt 'fototec-salt-2024'
INSERT OR IGNORE INTO users (name, username, email, password, role)
VALUES (
    'Admin',
    'admin',
    'admin@fototec.com',
    'd4c69c8865376debdd718fb35cbd0fc15294ec898014833a03c168d4efe32029',
    'admin'
);
