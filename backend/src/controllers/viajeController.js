const supabase = require('../config/supabase');

async function guardarViaje(req, res) {
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

  const { data: viaje, error } = await supabase
    .from('Viaje')
    .insert([{
      idViaje: Date.now(),
      calleOrigen,
      alturaOrigen: 0,
      calleDestino,
      alturaDestino: 0,
      precioEstimado: precioNumero,
      tiempoEstimado: tiempoNumero,
      fechaViaje: new Date().toISOString().split('T')[0],
      idUsuario: req.auth.userId,
      idTipoServicio: idTipoServicioNumero,
    }])
    .select()
    .single();

  if (error) {
    console.error('Error al guardar viaje:', error);
    return res.status(500).json({ mensaje: 'Error al guardar viaje.', detalle: error.message });
  }

  return res.status(201).json({ mensaje: 'Viaje guardado correctamente.', viaje });
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
    .eq('idUsuario', req.auth.userId);

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

module.exports = { guardarViaje, obtenerViajes, obtenerViajesPorUsuario, obtenerStatsViajes, verificarViaje };
