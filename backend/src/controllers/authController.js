// Importo la conexión con Supabase.
const supabase = require('../config/supabase');


// ====================== LOGIN ======================

const login = async (req, res) => {

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        mensaje: 'Faltan completar datos',
      });
    }

    const emailLimpio = email.trim().toLowerCase();

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailValido.test(emailLimpio)) {
      return res.status(400).json({
        mensaje: 'Ingresá un email válido',
      });
    }

    if (emailLimpio.length > 100) {
      return res.status(400).json({
        mensaje: 'El email es demasiado largo',
      });
    }

    if (password.length < 4 || password.length > 30) {
      return res.status(400).json({
        mensaje: 'La contraseña debe tener entre 4 y 30 caracteres',
      });
    }

    const {
      data: usuarioEncontrado,
      error: errorBusquedaUsuario,
    } = await supabase
      .from('Usuario')
      .select('*')
      .eq('email', emailLimpio)
      .maybeSingle();

    if (errorBusquedaUsuario) {

      console.log('ERROR SUPABASE LOGIN');
      console.log(errorBusquedaUsuario);

      return res.status(500).json({
        mensaje: 'Error al buscar usuario',
        detalle: errorBusquedaUsuario.message,
      });
    }

    if (!usuarioEncontrado) {
      return res.status(404).json({
        mensaje: 'Usuario no encontrado',
      });
    }

    if (usuarioEncontrado.contraseña !== password) {
      return res.status(401).json({
        mensaje: 'Contraseña incorrecta',
      });
    }

    return res.status(200).json({
      mensaje: 'Login exitoso',
      usuario: usuarioEncontrado,
    });

  } catch (error) {

    console.log('ERROR GENERAL LOGIN');
    console.log(error);

    return res.status(500).json({
      mensaje: 'Error general al iniciar sesión',
      detalle: error.message,
    });
  }
};


// ====================== REGISTER ======================

const register = async (req, res) => {

  try {
    const {
      nombre,
      telefono,
      email,
      password,
    } = req.body;

    if (!nombre || !telefono || !email || !password) {
      return res.status(400).json({
        mensaje: 'Faltan completar datos',
      });
    }

    const nombreLimpio = nombre.trim();
    const emailLimpio = email.trim().toLowerCase();

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (nombreLimpio.length < 3 || nombreLimpio.length > 50) {
      return res.status(400).json({
        mensaje: 'El nombre debe tener entre 3 y 50 caracteres',
      });
    }

    if (!emailValido.test(emailLimpio)) {
      return res.status(400).json({
        mensaje: 'Ingresá un email válido',
      });
    }

    if (emailLimpio.length > 100) {
      return res.status(400).json({
        mensaje: 'El email es demasiado largo',
      });
    }

    if (!/^\d{8,15}$/.test(telefono)) {
      return res.status(400).json({
        mensaje: 'El teléfono debe tener entre 8 y 15 números',
      });
    }

    if (password.length < 4 || password.length > 30) {
      return res.status(400).json({
        mensaje: 'La contraseña debe tener entre 4 y 30 caracteres',
      });
    }

    const {
      data: usuarioExistente,
      error: errorVerificacionUsuario,
    } = await supabase
      .from('Usuario')
      .select('*')
      .eq('email', emailLimpio)
      .maybeSingle();

    if (errorVerificacionUsuario) {

      console.log('ERROR SUPABASE VERIFICAR USUARIO');
      console.log(errorVerificacionUsuario);

      return res.status(500).json({
        mensaje: 'Error al verificar usuario',
        detalle: errorVerificacionUsuario.message,
      });
    }

    if (usuarioExistente) {
      return res.status(400).json({
        mensaje: 'El usuario ya existe',
      });
    }

    const idNuevoUsuario = Date.now();

    const fechaDeRegistro = new Date().toISOString().split('T')[0];

    const {
      data: usuarioRegistrado,
      error: errorRegistroUsuario,
    } = await supabase
      .from('Usuario')
      .insert([
        {
          idUsuario: idNuevoUsuario,
          nombre: nombreLimpio,
          email: emailLimpio,
          telefono: Number(telefono),
          contraseña: password,
          fechaRegistro: fechaDeRegistro,
        },
      ])
      .select();

    if (errorRegistroUsuario) {

      console.log('ERROR SUPABASE REGISTRAR USUARIO');
      console.log(errorRegistroUsuario);

      return res.status(500).json({
        mensaje: 'Error al registrar usuario',
        detalle: errorRegistroUsuario.message,
      });
    }

    return res.status(201).json({
      mensaje: 'Usuario registrado correctamente',
      usuario: usuarioRegistrado,
    });

  } catch (error) {

    console.log('ERROR GENERAL REGISTER');
    console.log(error);

    return res.status(500).json({
      mensaje: 'Error general al registrar usuario',
      detalle: error.message,
    });
  }
};


module.exports = {
  login,
  register,
};