import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { Hash } from 'hono/utils/hash';
import { html } from 'hono/html';

const app = new Hono();

// Database schema - defined inline for D1
const schema = {
  users: {
    id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
    name: 'TEXT NOT NULL',
    username: 'TEXT UNIQUE NOT NULL',
    email: 'TEXT UNIQUE NOT NULL',
    password: 'TEXT NOT NULL',
    role: 'TEXT DEFAULT "user" CHECK (role IN ("user", "admin"))',
    created_at: 'DATETIME DEFAULT CURRENT_TIMESTAMP'
  }
};

// In-memory store for users (since D1 doesn't have direct API in Workers)
// For production, use D1 binding
const users = [];
let userIdCounter = 1;

// Password hashing helper
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'fototec-salt-2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password, hash) {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// Serve static files from the same directory
app.get('/', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FotoTec</title>
    <meta http-equiv="refresh" content="0;url=/index.html">
</head>
<body>
    <p>Redirecting to <a href="/index.html">FotoTec</a>...</p>
</body>
</html>`);
});

// Serve static files
app.get('/*', async (c) => {
  const path = c.req.path === '/' ? '/index.html' : c.req.path;
  try {
    const file = await import('fs').then(fs => fs.promises.readFile(`./${path}`));
    const contentType = path.endsWith('.html') ? 'text/html' :
                        path.endsWith('.css') ? 'text/css' :
                        path.endsWith('.js') ? 'application/javascript' :
                        'text/plain';
    return new Response(file, { headers: { 'Content-Type': contentType } });
  } catch {
    return c.text('Not found', 404);
  }
});

// API Routes
app.post('/api/register', async (c) => {
  try {
    const { name, username, email, password } = await c.req.json();

    if (!name || !username || !email || !password) {
      return c.json({ error: 'All fields are required' }, 400);
    }

    if (password.length < 6) {
      return c.json({ error: 'Password must be at least 6 characters' }, 400);
    }

    // Check if user exists
    if (users.find(u => u.username === username)) {
      return c.json({ error: 'Username already exists' }, 400);
    }
    if (users.find(u => u.email === email)) {
      return c.json({ error: 'Email already exists' }, 400);
    }

    const hashedPassword = await hashPassword(password);
    const newUser = {
      id: userIdCounter++,
      name,
      username,
      email,
      password: hashedPassword,
      role: 'user',
      created_at: new Date().toISOString()
    };

    users.push(newUser);
    console.log('User registered:', username);

    return c.json({ message: 'User registered successfully', userId: newUser.id });
  } catch (error) {
    console.error('Register error:', error);
    return c.json({ error: 'Registration failed' }, 500);
  }
});

app.post('/api/login', async (c) => {
  try {
    const { usernameOrEmail, password } = await c.req.json();

    if (!usernameOrEmail || !password) {
      return c.json({ error: 'Username/email and password are required' }, 400);
    }

    const user = users.find(u =>
      u.username === usernameOrEmail || u.email === usernameOrEmail
    );

    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const { password: _, ...userWithoutPassword } = user;
    console.log('User logged in:', user.username);

    return c.json({
      message: 'Login successful',
      user: { ...userWithoutPassword, userType: user.role === 'admin' ? 'administrador' : 'cliente' }
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

app.post('/api/verificar-admin', async (c) => {
  try {
    const { username, password } = await c.req.json();

    const adminUser = users.find(u => u.username === username && u.role === 'admin');

    if (!adminUser) {
      return c.json({ error: 'Invalid admin credentials' }, 401);
    }

    const isValid = await verifyPassword(password, adminUser.password);
    if (!isValid) {
      return c.json({ error: 'Invalid admin credentials' }, 401);
    }

    return c.json({
      success: true,
      user: {
        id: adminUser.id,
        username: adminUser.username,
        userType: 'administrador'
      }
    });
  } catch (error) {
    console.error('Admin verify error:', error);
    return c.json({ error: 'Verification failed' }, 500);
  }
});

// Email sending endpoint (mock for Cloudflare - would need SendGrid/Resend in production)
app.post('/enviar-reserva', async (c) => {
  try {
    const { clientEmail, clientName, pedidoId } = await c.req.json();

    console.log('Reserva received:', { clientEmail, clientName, pedidoId });

    // In production, integrate with SendGrid, Resend, or Mailgun
    return c.json({
      success: true,
      message: 'Reserva recibida (email simulado)'
    });
  } catch (error) {
    console.error('Reserva error:', error);
    return c.json({ error: 'Failed to process reserva' }, 500);
  }
});

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize default admin
async function initAdmin() {
  const adminExists = users.find(u => u.role === 'admin');
  if (!adminExists) {
    const hashedPassword = await hashPassword('admin123');
    users.push({
      id: userIdCounter++,
      name: 'Admin',
      username: 'admin',
      email: 'admin@fototec.com',
      password: hashedPassword,
      role: 'admin',
      created_at: new Date().toISOString()
    });
    console.log('Default admin created');
  }
}

initAdmin();

export default app;
