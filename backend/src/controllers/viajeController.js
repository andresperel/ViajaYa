const supabase = require('../config/supabase');

const guardarViaje = async (req, res) => {
  const {
    calleOrigen,
    calleDestino,
    precioEstimado,
    tiempoEstimado,
    idUsuario,
    idTipoServicio,
  } = req.body;

  const idUsuarioNumero = Number(idUsuario);
  const idTipoServicioNumero = Number(idTipoServicio);

  if (
    !calleOrigen ||
    !calleDestino ||
    !precioEstimado ||
    !tiempoEstimado ||
    !idUsuarioNumero ||
    !idTipoServicioNumero
  ) {
    return res.status(400).json({
      mensaje: 'Faltan datos para guardar el viaje',
      datosRecibidos: req.body,
    });
  }

  const idNuevoViaje = Date.now();
  const fechaDeHoy = new Date().toISOString().split('T')[0];

  const {
    data: viajeGuardado,
    error: errorGuardarViaje,
  } = await supabase
    .from('Viaje')
    .insert([
      {
        idViaje: idNuevoViaje,
        calleOrigen,
        alturaOrigen: 0,
        calleDestino,
        alturaDestino: 0,
        precioEstimado,
        tiempoEstimado,
        fechaViaje: fechaDeHoy,
        idUsuario: idUsuarioNumero,
        idTipoServicio: idTipoServicioNumero,
      },
    ])
    .select();

  if (errorGuardarViaje) {
    console.log('Error al guardar viaje:', errorGuardarViaje);

    return res.status(500).json({
      mensaje: 'Error al guardar viaje',
      detalle: errorGuardarViaje.message,
    });
  }

  return res.status(201).json({
    mensaje: 'Viaje guardado correctamente',
    viaje: viajeGuardado,
  });
};

const obtenerViajes = async (req, res) => {
  const {
    data: viajes,
    error: errorViajes,
  } = await supabase
    .from('Viaje')
    .select('*')
    .order('fechaViaje', { ascending: false });

  if (errorViajes) {
    return res.status(500).json({
      mensaje: 'Error al obtener viajes',
      detalle: errorViajes.message,
    });
  }

  return res.status(200).json(viajes);
};

const obtenerViajesPorUsuario = async (req, res) => {
  const idUsuario = Number(req.params.idUsuario);

  if (!idUsuario) {
    return res.status(400).json({
      mensaje: 'Falta idUsuario',
    });
  }

  const {
    data: viajes,
    error: errorViajes,
  } = await supabase
    .from('Viaje')
    .select('*')
    .eq('idUsuario', idUsuario)
    .order('fechaViaje', { ascending: false });

  if (errorViajes) {
    return res.status(500).json({
      mensaje: 'Error al obtener viajes del usuario',
      detalle: errorViajes.message,
    });
  }

  return res.status(200).json(viajes);
};

module.exports = {
  guardarViaje,
  obtenerViajes,
  obtenerViajesPorUsuario,
};