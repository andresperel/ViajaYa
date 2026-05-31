// Importo la conexión con Supabase.
const supabase = require('../config/supabase');

// Esta función guarda un viaje elegido por el usuario.
const guardarViaje = async (req, res) => {

  // Recibo los datos que mando desde el frontend.
  const {
    calleOrigen,
    calleDestino,
    precioEstimado,
    tiempoEstimado,
    idUsuario,
    idTipoServicio,
  } = req.body;

  // Verifico que los datos principales estén completos.
  if (!calleOrigen || !calleDestino || !precioEstimado || !idUsuario || !idTipoServicio) {
    return res.status(400).json({
      mensaje: 'Faltan datos para guardar el viaje',
    });
  }

  // Creo un id para el viaje.
  const idNuevoViaje = Date.now();

  // Creo la fecha actual en formato año-mes-día.
  const fechaDeHoy = new Date().toISOString().split('T')[0];

  // Inserto el viaje en la tabla Viaje.
  const {
    data: viajeGuardado,
    error: errorGuardarViaje,
  } = await supabase
    .from('Viaje')
    .insert([
      {
        idViaje: idNuevoViaje,
        calleOrigen: calleOrigen,
        alturaOrigen: 0,
        calleDestino: calleDestino,
        alturaDestino: 0,
        precioEstimado: precioEstimado,
        tiempoEstimado: tiempoEstimado,
        fechaViaje: fechaDeHoy,
        idUsuario: idUsuario,
        idTipoServicio: idTipoServicio,
      },
    ])
    .select();

  // Si Supabase devuelve error, lo muestro.
  if (errorGuardarViaje) {
    console.log('Error al guardar viaje:', errorGuardarViaje);

    return res.status(500).json({
      mensaje: 'Error al guardar viaje',
      detalle: errorGuardarViaje.message,
    });
  }

  // Si salió bien, devuelvo el viaje guardado.
  return res.status(201).json({
    mensaje: 'Viaje guardado correctamente',
    viaje: viajeGuardado,
  });
};

module.exports = {
  guardarViaje,
};