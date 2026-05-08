export async function onRequest({ request, env }) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  return new Response(JSON.stringify({
    hasResendKey: !!env.RESEND_API_KEY,
    resendKeyLength: env.RESEND_API_KEY ? env.RESEND_API_KEY.length : 0,
    resendKeyPrefix: env.RESEND_API_KEY ? env.RESEND_API_KEY.substring(0, 10) : null,
  }), { headers });
}
