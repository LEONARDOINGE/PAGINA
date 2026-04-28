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
