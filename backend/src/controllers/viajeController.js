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
  if (
    !calleOrigen
    || !calleDestino
    || !precioEstimado
    || !tiempoEstimado
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
      precioEstimado,
      tiempoEstimado,
      fechaViaje: new Date().toISOString().split('T')[0],
      idUsuario: req.auth.userId,
      idTipoServicio: idTipoServicioNumero,
    }])
    .select()
    .single();

  if (error) {
    console.error('Error al guardar viaje:', error);
    return res.status(500).json({ mensaje: 'Error al guardar viaje.' });
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

module.exports = { guardarViaje, obtenerViajes, obtenerViajesPorUsuario };
