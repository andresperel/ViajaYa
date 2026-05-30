// Importo la conexión con Supabase.
const supabase = require('../config/supabase');


// ====================== LOGIN ======================

const login = async (req, res) => {

  // Obtengo los datos enviados desde el frontend.
  const { email, password } = req.body;

  // Verifico que el usuario haya completado ambos campos.
  if (!email || !password) {
    return res.status(400).json({
      mensaje: 'Faltan completar datos',
    });
  }

  // Busco un usuario que tenga el email ingresado.
  const {
    data: usuarioEncontrado,
    error: errorBusquedaUsuario,
  } = await supabase
    .from('Usuario')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  // Si ocurrió un error al consultar Supabase.
  if (errorBusquedaUsuario) {
    return res.status(500).json({
      mensaje: 'Error al buscar usuario',
      detalle: errorBusquedaUsuario.message,
    });
  }

  // Si no encontré ningún usuario con ese email.
  if (!usuarioEncontrado) {
    return res.status(404).json({
      mensaje: 'Usuario no encontrado',
    });
  }

  // Comparo la contraseña guardada con la ingresada.
  if (usuarioEncontrado.contraseña !== password) {
    return res.status(401).json({
      mensaje: 'Contraseña incorrecta',
    });
  }

  // Si todo salió bien, devuelvo el usuario.
  return res.status(200).json({
    mensaje: 'Login exitoso',
    usuario: usuarioEncontrado,
  });
};


// ====================== REGISTER ======================

const register = async (req, res) => {

  // Obtengo los datos enviados desde el frontend.
  const {
    nombre,
    telefono,
    email,
    password,
  } = req.body;

  // Verifico que todos los campos estén completos.
  if (!nombre || !telefono || !email || !password) {
    return res.status(400).json({
      mensaje: 'Faltan completar datos',
    });
  }

  // Verifico si ya existe un usuario con ese email.
  const {
    data: usuarioExistente,
    error: errorVerificacionUsuario,
  } = await supabase
    .from('Usuario')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  // Si ocurrió un error durante la búsqueda.
  if (errorVerificacionUsuario) {
    return res.status(500).json({
      mensaje: 'Error al verificar usuario',
      detalle: errorVerificacionUsuario.message,
    });
  }

  // Si ya existe un usuario con ese email.
  if (usuarioExistente) {
    return res.status(400).json({
      mensaje: 'El usuario ya existe',
    });
  }

  // Creo un id porque mi tabla Usuario necesita un idUsuario.
  const idNuevoUsuario = Date.now();

  // Creo una fecha simple con formato año-mes-día.
  const fechaDeRegistro = new Date().toISOString().split('T')[0];

  // Inserto el nuevo usuario en la base de datos.
  const {
    data: usuarioRegistrado,
    error: errorRegistroUsuario,
  } = await supabase
    .from('Usuario')
    .insert([
      {
        idUsuario: idNuevoUsuario,
        nombre: nombre,
        email: email,
        telefono: Number(telefono),
        contraseña: password,
        fechaRegistro: fechaDeRegistro,
      },
    ])
    .select();

  // Si hubo un error al registrar, lo muestro en la terminal.
  if (errorRegistroUsuario) {

    console.log(
      'Error al registrar usuario:',
      errorRegistroUsuario
    );

    return res.status(500).json({
      mensaje: 'Error al registrar usuario',
      detalle: errorRegistroUsuario.message,
    });
  }

  // Si todo salió bien, devuelvo un mensaje de éxito.
  return res.status(201).json({
    mensaje: 'Usuario registrado correctamente',
    usuario: usuarioRegistrado,
  });
};


// Exporto las funciones para utilizarlas en las rutas.
module.exports = {
  login,
  register,
};