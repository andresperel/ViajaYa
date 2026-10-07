const supabase = require('../config/supabase');
const { validateTripClassification } = require('../validation/businessTrips');

async function guardarViaje(req, res) {
  let clasificacion;
  try {
    clasificacion = validateTripClassification(req.body);
  } catch (error) {
    return res.status(400).json({ mensaje: error.message });
  }
  const {
    calleOrigen,
    calleDestino,
    precioEstimado,
    tiempoEstimado,
    idTipoServicio,
  } = req.body || {};

  const idTipoServicioNumero = Number(idTipoServicio);
  const precioNumero = Number(precioEstimado);
  const tiempoNumero = Number(tiempoEstimado);
  if (
    !calleOrigen
    || !calleDestino
    || !Number.isFinite(precioNumero)
    || !Number.isFinite(tiempoNumero)
    || !idTipoServicioNumero
  ) {
    return res.status(400).json({ mensaje: 'Faltan datos para guardar el viaje.' });
  }

  const datosViaje = {
    ...clasificacion,
    idViaje: Date.now(),
    calleOrigen,
    alturaOrigen: 0,
    calleDestino,
    alturaDestino: 0,
    precioEstimado: precioNumero,
    tiempoEstimado: tiempoNumero,
    fechaViaje: new Date().toISOString().split('T')[0],
    estado: 'pendiente',
    fechaConfirmacion: null,
    idUsuario: req.auth.userId,
    idTipoServicio: idTipoServicioNumero,
  };
  let { data: viaje, error } = await supabase
    .from('Viaje')
    .insert([datosViaje])
    .select()
    .single();

  // Compatibility while local migrations await approval. Never drop Business metadata.
  for (let retry = 0; retry < 2 && error; retry += 1) {
    const missingColumn = /does not exist|schema cache|could not find/i.test(error.message);
    if (!missingColumn) break;
    if (/tipoViaje|motivoViaje/i.test(error.message)) {
      if (clasificacion.tipoViaje === 'business' || clasificacion.motivoViaje) {
        return res.status(503).json({ mensaje: 'El guardado Business requiere aplicar la migración de ViajaYa Business.' });
      }
      delete datosViaje.tipoViaje;
      delete datosViaje.motivoViaje;
    } else if (/estado|fechaConfirmacion/i.test(error.message)) {
      delete datosViaje.estado;
      delete datosViaje.fechaConfirmacion;
    } else break;
    ({ data: viaje, error } = await supabase.from('Viaje').insert([datosViaje]).select().single());
  }

  if (error) {
    console.error('Error al guardar viaje:', error);
    return res.status(500).json({ mensaje: 'Error al guardar viaje.', detalle: error.message });
  }

  return res.status(201).json({ mensaje: 'Viaje guardado correctamente.', viaje: { ...viaje, ...clasificacion } });
}

async function obtenerViajes(req, res) {
  const { data: viajes, error } = await supabase
    .from('Viaje')
    .select('*')
    .eq('idUsuario', req.auth.userId)
    .order('fechaViaje', { ascending: false });

  if (error) {
    console.error('Error al obtener viajes:', error);
    return res.status(500).json({ mensaje: 'Error al obtener viajes.' });
  }

  return res.status(200).json(viajes);
}

async function obtenerViajesPorUsuario(req, res) {
  const idSolicitado = req.params.idUsuario ? Number(req.params.idUsuario) : req.auth.userId;
  if (!idSolicitado || idSolicitado !== req.auth.userId) {
    return res.status(403).json({ mensaje: 'No tenes permiso para consultar estos viajes.' });
  }

  return obtenerViajes(req, res);
}

async function obtenerStatsViajes(req, res) {
  const { data: viajes, error } = await supabase
    .from('Viaje')
    .select('precioEstimado')
    .eq('idUsuario', req.auth.userId)
    .eq('estado', 'realizado');

  if (error) {
    console.error('Error al obtener stats:', error);
    return res.status(500).json({ mensaje: 'Error al obtener estadisticas.', detalle: error.message });
  }

  const cantidad = viajes.length;
  const totalGastado = viajes.reduce((total, viaje) => total + Number(viaje.precioEstimado || 0), 0);

  return res.status(200).json({ cantidad, totalGastado });
}

async function verificarViaje(req, res) {
  const idViaje = Number(req.params.idViaje);
  if (!Number.isSafeInteger(idViaje) || idViaje <= 0) {
    return res.status(400).json({ mensaje: 'El identificador del viaje no es valido.' });
  }

  const { data: viaje, error } = await supabase
    .from('Viaje')
    .select('*')
    .eq('idViaje', idViaje)
    .eq('idUsuario', req.auth.userId)
    .maybeSingle();

  if (error) {
    console.error('Error al verificar viaje:', error);
    return res.status(500).json({ mensaje: 'No se pudo verificar el viaje.' });
  }
  if (!viaje) {
    return res.status(404).json({ mensaje: 'El viaje no fue encontrado.' });
  }

  return res.status(200).json({ verificado: true, viaje });
}

async function vincularViajeUber(req, res) {
  const idViaje = Number(req.params.idViaje);
  const idViajeProveedor = typeof req.body?.idViajeProveedor === 'string'
    ? req.body.idViajeProveedor.trim() : '';
  if (!Number.isSafeInteger(idViaje) || idViaje <= 0 || !idViajeProveedor || idViajeProveedor.length > 200) {
    return res.status(400).json({ mensaje: 'Indica un identificador de viaje de Uber válido.' });
  }
  const { data: viaje, error } = await supabase.from('Viaje')
    .update({ proveedor: 'uber', idViajeProveedor })
    .eq('idViaje', idViaje).eq('idUsuario', req.auth.userId)
    .select().maybeSingle();
  if (error) {
    console.error('Error al vincular viaje Uber:', error);
    return res.status(500).json({ mensaje: 'No se pudo vincular el viaje. Verifica que esté aplicada la migración de estados.' });
  }
  if (!viaje) return res.status(404).json({ mensaje: 'El viaje no fue encontrado.' });
  return res.status(200).json({ mensaje: 'Seguimiento de Uber vinculado.', viaje });
}

async function actualizarEstadoViaje(req, res) {
  const idViaje = Number(req.params.idViaje);
  const estado = typeof req.body?.estado === 'string' ? req.body.estado.toLowerCase() : '';
  if (!Number.isSafeInteger(idViaje) || idViaje <= 0) {
    return res.status(400).json({ mensaje: 'El identificador del viaje no es valido.' });
  }
  if (!['realizado', 'cancelado'].includes(estado)) {
    return res.status(400).json({ mensaje: 'El estado debe ser realizado o cancelado.' });
  }

  const { data: viaje, error } = await supabase
    .from('Viaje')
    .update({ estado, fechaConfirmacion: new Date().toISOString() })
    .eq('idViaje', idViaje)
    .eq('idUsuario', req.auth.userId)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error al confirmar viaje:', error);
    return res.status(500).json({ mensaje: 'No se pudo actualizar el viaje.' });
  }
  if (!viaje) {
    return res.status(404).json({ mensaje: 'El viaje no fue encontrado.' });
  }
  return res.status(200).json({ mensaje: 'Estado actualizado.', viaje });
}

module.exports = { guardarViaje, obtenerViajes, obtenerViajesPorUsuario, obtenerStatsViajes, verificarViaje, actualizarEstadoViaje, vincularViajeUber };
