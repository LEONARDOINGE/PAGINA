// Cloudflare Worker - API Handler for FotoTec

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Only handle API routes
    if (path.startsWith('/api/') || path === '/enviar-reserva') {
      return handleAPI(request, env);
    }

    // For root, serve the index.html
    if (path === '/') {
      const html = await fetch(`${url.origin}/index.html`);
      return html;
    }

    // For static files, fetch from the origin
    return fetch(request);
  }
};

async function handleAPI(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    // Health check
    if (path === '/api/health' && method === 'GET') {
      return new Response(JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        worker: 'fototec-api'
      }), { headers });
    }

    // Register
    if (path === '/api/register' && method === 'POST') {
      const { name, username, email, password } = await request.json();

      if (!name || !username || !email || !password) {
        return new Response(JSON.stringify({ error: 'All fields are required' }), { status: 400, headers });
      }
      if (password.length < 6) {
        return new Response(JSON.stringify({ error: 'Password must be at least 6 characters' }), { status: 400, headers });
      }

      const existing = await env.DB.prepare(
        'SELECT id FROM users WHERE username = ? OR email = ?'
      ).bind(username, email).first();

      if (existing) {
        return new Response(JSON.stringify({ error: 'Username or email already exists' }), { status: 400, headers });
      }

      const hashedPassword = await hashPassword(password);

      const result = await env.DB.prepare(
        'INSERT INTO users (name, username, email, password, role) VALUES (?, ?, ?, ?, ?)'
      ).bind(name, username, email, hashedPassword, 'user').run();

      return new Response(JSON.stringify({
        success: true,
        message: 'User registered successfully',
        userId: result.meta.last_row_id
      }), { headers });
    }

    // Login
    if (path === '/api/login' && method === 'POST') {
      const { usernameOrEmail, password } = await request.json();

      if (!usernameOrEmail || !password) {
        return new Response(JSON.stringify({ error: 'Username/email and password are required' }), { status: 400, headers });
      }

      const user = await env.DB.prepare(
        'SELECT * FROM users WHERE username = ? OR email = ?'
      ).bind(usernameOrEmail, usernameOrEmail).first();

      if (!user) {
        return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401, headers });
      }

      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401, headers });
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          userType: user.role === 'admin' ? 'administrador' : 'cliente'
        }
      }), { headers });
    }

    // Verify Admin
    if (path === '/api/verificar-admin' && method === 'POST') {
      const { username, password } = await request.json();

      const adminUser = await env.DB.prepare(
        'SELECT * FROM users WHERE username = ? AND role = ?'
      ).bind(username, 'admin').first();

      if (!adminUser || !await verifyPassword(password, adminUser.password)) {
        return new Response(JSON.stringify({ error: 'Invalid admin credentials' }), { status: 401, headers });
      }

      return new Response(JSON.stringify({
        success: true,
        user: {
          id: adminUser.id,
          username: adminUser.username,
          userType: 'administrador'
        }
      }), { headers });
    }

    // Reservas
    if (path === '/enviar-reserva' && method === 'POST') {
      const body = await request.json();
      console.log('Reserva:', body);
      return new Response(JSON.stringify({
        success: true,
        message: 'Reserva received'
      }), { headers });
    }

    return new Response(JSON.stringify({ error: 'API endpoint not found' }), { status: 404, headers });

  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
}

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
