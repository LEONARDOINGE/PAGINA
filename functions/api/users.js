export async function onRequest({ request, env }) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  }

  try {
    const users = await env.DB.prepare(
      'SELECT id, name, username, email, role, created_at FROM users ORDER BY created_at DESC'
    ).all();

    return new Response(JSON.stringify({
      success: true,
      users: users.results
    }), { headers });

  } catch (error) {
    console.error('Users error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
}
