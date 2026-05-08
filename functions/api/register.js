export async function onRequest({ request, env }) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  }

  try {
    const { name, username, email, password } = await request.json();

    if (!name || !username || !email || !password) {
      return new Response(JSON.stringify({ error: 'Todos los campos son requeridos' }), { status: 400, headers });
    }

    if (password.length < 6) {
      return new Response(JSON.stringify({ error: 'La contrasena debe tener al menos 6 caracteres' }), { status: 400, headers });
    }

    const existing = await env.DB.prepare(
      'SELECT id FROM users WHERE username = ? OR email = ?'
    ).bind(username, email).first();

    if (existing) {
      return new Response(JSON.stringify({
        accountExists: true,
        message: 'Esta cuenta ya existe. Por favor inicia sesion.'
      }), { status: 400, headers });
    }

    const hashedPassword = await hashPassword(password);

    const result = await env.DB.prepare(
      'INSERT INTO users (name, username, email, password, role) VALUES (?, ?, ?, ?, ?)'
    ).bind(name, username, email, hashedPassword, 'user').run();

    const userId = result.meta.last_row_id;

    return new Response(JSON.stringify({
      success: true,
      message: 'Cuenta creada exitosamente. Iniciando sesion...',
      userId: userId,
      user: {
        id: userId,
        name: name,
        username: username,
        email: email,
        userType: 'cliente'
      }
    }), { headers });

  } catch (error) {
    console.error('Register error:', error);
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
