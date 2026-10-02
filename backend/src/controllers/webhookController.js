const crypto = require('crypto');
const supabase = require('../config/supabase');

const ESTADOS_COMPLETADOS = new Set(['completed']);
const ESTADOS_CANCELADOS = new Set(['driver_canceled', 'rider_canceled', 'canceled']);

function firmaValida(req) {
  const firmaRecibida = req.get('x-uber-signature') || '';
  const secreto = process.env.UBER_WEBHOOK_SIGNING_KEY || process.env.UBER_CLIENT_SECRET;
  if (!firmaRecibida || !secreto || !req.rawBody) return false;
  const firmaCalculada = crypto.createHmac('sha256', secreto).update(req.rawBody).digest('hex');
  const recibida = Buffer.from(firmaRecibida.toLowerCase(), 'utf8');
  const calculada = Buffer.from(firmaCalculada, 'utf8');
  return recibida.length === calculada.length && crypto.timingSafeEqual(recibida, calculada);
}

async function recibirWebhookUber(req, res) {
  if (!firmaValida(req)) return res.status(401).json({ mensaje: 'Firma de Uber invalida.' });
  const { event_id: eventId, event_type: eventType, meta = {} } = req.body || {};
  const idViajeProveedor = meta.resource_id;
  const estadoProveedor = String(meta.status || '').toLowerCase();
  if (!eventId || !idViajeProveedor || !estadoProveedor || !String(eventType).includes('status_changed')) {
    return res.status(200).end();
  }

  let estado;
  if (ESTADOS_COMPLETADOS.has(estadoProveedor)) estado = 'realizado';
  else if (ESTADOS_CANCELADOS.has(estadoProveedor)) estado = 'cancelado';
  else return res.status(200).end();

  const { error } = await supabase
    .from('Viaje')
    .update({
      estado,
      estadoProveedor,
      ultimoEventoProveedor: eventId,
      fechaConfirmacion: new Date().toISOString(),
    })
    .eq('proveedor', 'uber')
    .eq('idViajeProveedor', idViajeProveedor);

  if (error) {
    console.error('Error procesando webhook Uber:', error);
    return res.status(500).json({ mensaje: 'No se pudo procesar el evento.' });
  }
  return res.status(200).end();
}

module.exports = { recibirWebhookUber };
