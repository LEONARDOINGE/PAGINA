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
    const body = await request.json();
    console.log('Reserva received:', JSON.stringify(body, null, 2));

    const {
      nombre,
      email,
      telefono,
      fecha_cumpleanos,
      tipo_sesion,
      estilo,
      cantidad_personas,
      fecha_sesion,
      hora_sesion,
      notas,
      interes_impresion,
      tipo_papel,
      terminos,
      datos_crm
    } = body;

    if (!nombre || !email || !telefono || !tipo_sesion || !fecha_sesion || !hora_sesion) {
      return new Response(JSON.stringify({ error: 'Faltan campos requeridos' }), { status: 400, headers });
    }

    const result = await env.DB.prepare(`
      INSERT INTO reservas (nombre, email, telefono, fecha_cumpleanos, tipo_sesion, estilo, cantidad_personas, fecha_sesion, hora_sesion, notas, interes_impresion, tipo_papel, terminos, datos_crm)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      nombre, email, telefono, fecha_cumpleanos || null,
      tipo_sesion, estilo || null, cantidad_personas || null,
      fecha_sesion, hora_sesion, notas || null,
      interes_impresion || null, tipo_papel || null,
      terminos || null, datos_crm || null
    ).run();

    const reservaId = result.meta.last_row_id;

    const tipos = {
      estudio: 'Sesión de Estudio',
      estudio_tematico: 'Sesión Temática',
      tecnica: 'Fotografía Técnica',
      boda: 'Sesión de Boda',
      evento: 'Cobertura de Evento'
    };

    const emailHtml = `
    <h2>Nueva Reserva Recibida</h2>
    <table style="border-collapse: collapse; width: 100%;">
      <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Nombre</td><td style="padding: 8px; border: 1px solid #ddd;">${nombre}</td></tr>
      <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Email</td><td style="padding: 8px; border: 1px solid #ddd;">${email}</td></tr>
      <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Teléfono</td><td style="padding: 8px; border: 1px solid #ddd;">${telefono}</td></tr>
      <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Tipo de Sesión</td><td style="padding: 8px; border: 1px solid #ddd;">${tipos[tipo_sesion] || tipo_sesion}</td></tr>
      <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Fecha</td><td style="padding: 8px; border: 1px solid #ddd;">${fecha_sesion}</td></tr>
      <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Hora</td><td style="padding: 8px; border: 1px solid #ddd;">${hora_sesion}</td></tr>
      <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Personas</td><td style="padding: 8px; border: 1px solid #ddd;">${cantidad_personas || 'No especificado'}</td></tr>
      <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Notas</td><td style="padding: 8px; border: 1px solid #ddd;">${notas || 'Ninguna'}</td></tr>
    </table>
    <p><strong>ID de Reserva:</strong> ${reservaId}</p>
    `;

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'FotoTec <fototecventass@gmail.com>',
        to: ['fototecventass@gmail.com'],
        subject: `Nueva Reserva de ${nombre} - ${tipos[tipo_sesion] || tipo_sesion}`,
        html: emailHtml
      })
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Reserva recibida. Te contactaremos pronto.',
      reservaId
    }), { headers });

  } catch (error) {
    console.error('Reserva error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
}
