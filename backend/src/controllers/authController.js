const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

const SALT_ROUNDS = 12;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_REGEX = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;
const BCRYPT_HASH = /^\$2[aby]\$\d{2}\$.{53}$/;

function usuarioPublico(usuario) {
  return {
    idUsuario: usuario.idUsuario,
    nombre: usuario.nombre,
    email: usuario.email,
    telefono: usuario.telefono,
    fechaRegistro: usuario.fechaRegistro,
  };
}

function validarPassword(password) {
  return typeof password === 'string'
    && password.length >= 8
    && password.length <= 72
    && Buffer.byteLength(password, 'utf8') <= 72
    && !/\s/.test(password)
    && /[a-z]/.test(password)
    && /[A-Z]/.test(password)
    && /\d/.test(password)
    && /[^A-Za-z0-9]/.test(password);
}

function validarPasswordLogin(password) {
  return typeof password === 'string'
    && password.length > 0
    && Buffer.byteLength(password, 'utf8') <= 72;
}

function crearToken(usuario) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET no esta configurado correctamente.');
  }

  return jwt.sign(
    { email: usuario.email },
    process.env.JWT_SECRET,
    {
      algorithm: 'HS256',
      subject: String(usuario.idUsuario),
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      issuer: process.env.JWT_ISSUER || 'viajaya-api',
      audience: process.env.JWT_AUDIENCE || 'viajaya-mobile',
    }
  );
}

async function login(req, res) {
  try {
    const { email, password } = req.body || {};

    if (typeof email !== 'string' || !validarPasswordLogin(password)) {
      return res.status(400).json({ mensaje: 'Email o contrasena invalidos.' });
    }

    const emailLimpio = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(emailLimpio) || emailLimpio.length > 100) {
      return res.status(400).json({ mensaje: 'Email o contrasena invalidos.' });
    }

    const { data: usuario, error } = await supabase
      .from('Usuario')
      .select('*')
      .eq('email', emailLimpio)
      .maybeSingle();

    if (error) {
      console.error('Error al buscar usuario:', error);
      return res.status(500).json({ mensaje: 'Error al iniciar sesion.' });
    }

    const passwordGuardada = usuario?.contraseña || '';
    const passwordCorrecta = usuario && (BCRYPT_HASH.test(passwordGuardada)
      ? await bcrypt.compare(password, passwordGuardada)
      : password === passwordGuardada);
    if (!passwordCorrecta) {
      return res.status(401).json({ mensaje: 'Email o contrasena incorrectos.' });
    }

    // Las cuentas antiguas tenian contrasenas sin hash. Se actualizan al primer login valido.
    if (!BCRYPT_HASH.test(passwordGuardada)) {
      const { error: updateError } = await supabase
        .from('Usuario')
        .update({ contraseña: await bcrypt.hash(password, SALT_ROUNDS) })
        .eq('idUsuario', usuario.idUsuario);
      if (updateError) {
        console.error('Error al migrar contrasena:', updateError);
        return res.status(500).json({ mensaje: 'Error al iniciar sesion.' });
      }
    }

    return res.status(200).json({
      mensaje: 'Login exitoso.',
      token: crearToken(usuario),
      usuario: usuarioPublico(usuario),
    });
  } catch (error) {
    console.error('Error general al iniciar sesion:', error);
    return res.status(500).json({ mensaje: 'Error general al iniciar sesion.' });
  }
}

async function register(req, res) {
  try {
    const { nombre, telefono, email, password } = req.body || {};

    if (
      typeof nombre !== 'string'
      || typeof telefono !== 'string'
      || typeof email !== 'string'
      || !validarPassword(password)
    ) {
      return res.status(400).json({
        mensaje: 'Datos inválidos. La contraseña debe tener entre 8 y 72 caracteres e incluir mayúscula, minúscula, número y carácter especial, sin espacios.',
      });
    }

    const nombreLimpio = nombre.trim();
    const emailLimpio = email.trim().toLowerCase();

    if (nombreLimpio.length < 3 || nombreLimpio.length > 50) {
      return res.status(400).json({ mensaje: 'El nombre debe tener entre 3 y 50 caracteres.' });
    }
    if (!NAME_REGEX.test(nombreLimpio)) {
      return res.status(400).json({ mensaje: 'El nombre solo puede contener letras, espacios, apóstrofes y guiones.' });
    }
    if (!EMAIL_REGEX.test(emailLimpio) || emailLimpio.length > 100) {
      return res.status(400).json({ mensaje: 'Ingresa un email valido.' });
    }
    if (!/^\d{8,15}$/.test(telefono)) {
      return res.status(400).json({ mensaje: 'El telefono debe tener entre 8 y 15 numeros.' });
    }

    const { data: usuarioExistente, error: errorVerificacion } = await supabase
      .from('Usuario')
      .select('idUsuario')
      .eq('email', emailLimpio)
      .maybeSingle();

    if (errorVerificacion) {
      console.error('Error al verificar usuario:', errorVerificacion);
      return res.status(500).json({ mensaje: 'Error al registrar usuario.' });
    }
    if (usuarioExistente) {
      return res.status(409).json({ mensaje: 'El usuario ya existe.' });
    }

    const { data: usuario, error: errorRegistro } = await supabase
      .from('Usuario')
      .insert([{
        idUsuario: Date.now(),
        nombre: nombreLimpio,
        email: emailLimpio,
        telefono: Number(telefono),
        contraseña: await bcrypt.hash(password, SALT_ROUNDS),
        fechaRegistro: new Date().toISOString().split('T')[0],
      }])
      .select()
      .single();

    if (errorRegistro) {
      console.error('Error al registrar usuario:', errorRegistro);
      return res.status(500).json({ mensaje: 'Error al registrar usuario.' });
    }

    return res.status(201).json({
      mensaje: 'Usuario registrado correctamente.',
      usuario: usuarioPublico(usuario),
    });
  } catch (error) {
    console.error('Error general al registrar usuario:', error);
    return res.status(500).json({ mensaje: 'Error general al registrar usuario.' });
  }
}

async function obtenerPerfil(req, res) {
  try {
    const { data: usuario, error } = await supabase
      .from('Usuario')
      .select('idUsuario,nombre,email,telefono,fechaRegistro')
      .eq('idUsuario', req.auth.userId)
      .maybeSingle();

    if (error) {
      console.error('Error al obtener perfil:', error);
      return res.status(500).json({ mensaje: 'Error al obtener el perfil.' });
    }
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    }

    return res.status(200).json({ usuario });
  } catch (error) {
    console.error('Error general al obtener perfil:', error);
    return res.status(500).json({ mensaje: 'Error general al obtener el perfil.' });
  }
}

module.exports = { login, register, obtenerPerfil };
