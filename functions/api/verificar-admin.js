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
    const { username, password } = await request.json();

    if (!username || !password) {
      return new Response(JSON.stringify({ error: 'Username and password required' }), { status: 400, headers });
    }

    const adminUser = await env.DB.prepare(
      'SELECT * FROM users WHERE username = ? AND role = ?'
    ).bind(username, 'admin').first();

    if (!adminUser) {
      return new Response(JSON.stringify({ error: 'Invalid admin credentials' }), { status: 401, headers });
    }

    const isValid = await verifyPassword(password, adminUser.password);
    if (!isValid) {
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

  } catch (error) {
    console.error('Admin verify error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
}

async function verifyPassword(password, hash) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'fototec-salt-2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return passwordHash === hash;
}
