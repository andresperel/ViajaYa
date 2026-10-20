const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

const SALT_ROUNDS = 12;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_REGEX = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;
const BCRYPT_HASH = /^\$2[aby]\$\d{2}\$.{53}$/;
const resetTokensEnMemoria = new Map();

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
    && password.length >= 6
    && password.length <= 30
    && Buffer.byteLength(password, 'utf8') <= 72;
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

function crearCodigoReset() {
  return String(crypto.randomInt(100000, 999999));
}

async function enviarEmailReset(email, token) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESET_EMAIL_FROM || 'ViajaYa <onboarding@resend.dev>';

  if (!apiKey) {
    console.log(`Codigo de recuperacion para ${email}: ${token}`);
    return false;
  }

  const respuesta = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: 'Restablece tu contrasena de ViajaYa',
      text: `Tu codigo para restablecer la contrasena es: ${token}`,
    }),
  });

  if (!respuesta.ok) {
    const detalle = await respuesta.text();
    throw new Error(`No se pudo enviar el email: ${detalle}`);
  }

  return true;
}

async function buscarUsuarioPorEmail(email) {
  return supabase
    .from('Usuario')
    .select('*')
    .eq('email', email)
    .maybeSingle();
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

    const { data: usuario, error } = await buscarUsuarioPorEmail(emailLimpio);

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
        mensaje: 'Datos invalidos. La contrasena debe tener entre 6 y 30 caracteres.',
      });
    }

    const nombreLimpio = nombre.trim();
    const emailLimpio = email.trim().toLowerCase();
    const telefonoLimpio = telefono.replace(/\D/g, '');

    if (nombreLimpio.length < 3 || nombreLimpio.length > 50) {
      return res.status(400).json({ mensaje: 'El nombre debe tener entre 3 y 50 caracteres.' });
    }
    if (!NAME_REGEX.test(nombreLimpio)) {
      return res.status(400).json({ mensaje: 'El nombre solo puede contener letras, espacios, apostrofes y guiones.' });
    }
    if (!EMAIL_REGEX.test(emailLimpio) || emailLimpio.length > 100) {
      return res.status(400).json({ mensaje: 'Ingresa un email valido.' });
    }
    if (!/^\d{8,15}$/.test(telefonoLimpio)) {
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
        telefono: Number(telefonoLimpio),
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

async function forgotPassword(req, res) {
  try {
    const { email } = req.body || {};

    if (typeof email !== 'string') {
      return res.status(400).json({ mensaje: 'Ingresa un email valido.' });
    }

    const emailLimpio = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(emailLimpio) || emailLimpio.length > 100) {
      return res.status(400).json({ mensaje: 'Ingresa un email valido.' });
    }

    const { data: usuario, error } = await buscarUsuarioPorEmail(emailLimpio);
    if (error) {
      console.error('Error al buscar usuario para reset:', error);
      return res.status(500).json({ mensaje: 'Error al enviar el email.' });
    }

    if (!usuario) {
      return res.status(200).json({ mensaje: 'Si el email existe, te enviamos un codigo.' });
    }

    const token = crearCodigoReset();
    const expira = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { error: updateError } = await supabase
      .from('Usuario')
      .update({
        resetToken: token,
        resetTokenExpira: expira,
      })
      .eq('idUsuario', usuario.idUsuario);

    if (updateError) {
      resetTokensEnMemoria.set(emailLimpio, { token, expira });
      console.warn('No se pudieron guardar columnas resetToken/resetTokenExpira. Usando memoria:', updateError.message);
    }

    const emailEnviado = await enviarEmailReset(emailLimpio, token);

    return res.status(200).json({
      mensaje: emailEnviado
        ? 'Te enviamos un codigo para restablecer tu contrasena.'
        : 'El email no esta configurado en este entorno. Usa el codigo de prueba.',
      emailEnviado,
      devToken: process.env.NODE_ENV === 'production' ? undefined : token,
    });
  } catch (error) {
    console.error('Error general al pedir reset:', error);
    return res.status(500).json({ mensaje: 'Error al enviar el email.' });
  }
}

async function resetPassword(req, res) {
  try {
    const { email, token, password } = req.body || {};

    if (typeof email !== 'string' || typeof token !== 'string' || !validarPassword(password)) {
      return res.status(400).json({ mensaje: 'Datos invalidos.' });
    }

    const emailLimpio = email.trim().toLowerCase();
    const tokenLimpio = token.trim();

    const { data: usuario, error } = await buscarUsuarioPorEmail(emailLimpio);
    if (error) {
      console.error('Error al buscar usuario para actualizar contrasena:', error);
      return res.status(500).json({ mensaje: 'Error al restablecer la contrasena.' });
    }
    if (!usuario) {
      return res.status(400).json({ mensaje: 'Codigo invalido o vencido.' });
    }

    const resetEnMemoria = resetTokensEnMemoria.get(emailLimpio);
    const tokenGuardado = usuario.resetToken || resetEnMemoria?.token;
    const expira = usuario.resetTokenExpira || resetEnMemoria?.expira;

    if (!tokenGuardado || tokenGuardado !== tokenLimpio || !expira || new Date(expira).getTime() < Date.now()) {
      return res.status(400).json({ mensaje: 'Codigo invalido o vencido.' });
    }

    const nuevaPasswordHasheada = await bcrypt.hash(password, SALT_ROUNDS);
    let { error: updateError } = await supabase
      .from('Usuario')
      .update({
        contraseña: nuevaPasswordHasheada,
        resetToken: null,
        resetTokenExpira: null,
      })
      .eq('idUsuario', usuario.idUsuario);

    if (updateError) {
      const { error: retryError } = await supabase
        .from('Usuario')
        .update({ contraseña: nuevaPasswordHasheada })
        .eq('idUsuario', usuario.idUsuario);

      if (retryError) {
        console.error('Error al actualizar contrasena:', retryError);
        return res.status(500).json({ mensaje: 'Error al restablecer la contrasena.' });
      }
    }

    resetTokensEnMemoria.delete(emailLimpio);

    return res.status(200).json({ mensaje: 'Contrasena actualizada correctamente.' });
  } catch (error) {
    console.error('Error general al restablecer contrasena:', error);
    return res.status(500).json({ mensaje: 'Error al restablecer la contrasena.' });
  }
}

async function socialLogin(req, res) {
  try {
    const { provider, email: emailBody, nombre: nombreBody, accessToken, supabaseAccessToken } = req.body || {};
    const providerLimpio = String(provider || '').trim().toLowerCase();

    if (!['google', 'apple'].includes(providerLimpio)) {
      return res.status(400).json({ mensaje: 'Proveedor invalido.' });
    }

    // Mobile currently sends only an Apple email/name, not a verifiable identity
    // token. Fail closed before any account lookup or creation. Keep Google and
    // password authentication unchanged. See docs/BUSINESS-WEB.md for restoration.
    if (providerLimpio === 'apple') {
      return res.status(403).json({
        mensaje: 'El inicio de sesión con Apple está temporalmente deshabilitado hasta incorporar una verificación segura. Usá email y contraseña o Google.',
      });
    }

    let emailSocial = emailBody;
    let nombreSocial = nombreBody;

    if (providerLimpio === 'google') {
      if (typeof supabaseAccessToken === 'string' && supabaseAccessToken) {
        const { data: authData, error: authError } = await supabase.auth.getUser(supabaseAccessToken);
        if (authError || !authData.user?.email || !authData.user.email_confirmed_at) {
          return res.status(401).json({ mensaje: 'La sesion de Google no es valida.' });
        }
        emailSocial = authData.user.email;
        nombreSocial = authData.user.user_metadata?.full_name
          || authData.user.user_metadata?.name
          || nombreSocial;
      } else if (typeof accessToken === 'string' && accessToken) {
        const respuestaGoogle = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!respuestaGoogle.ok) {
          return res.status(401).json({ mensaje: 'La sesion de Google no es valida.' });
        }

        const perfilGoogle = await respuestaGoogle.json();
        if (!perfilGoogle.email_verified) {
          return res.status(401).json({ mensaje: 'Google no verifico este correo.' });
        }
        emailSocial = perfilGoogle.email;
        nombreSocial = perfilGoogle.name;
      } else {
        return res.status(400).json({ mensaje: 'Falta la credencial de Google.' });
      }
    }

    if (typeof emailSocial !== 'string') {
      return res.status(400).json({ mensaje: 'No recibimos el email de la cuenta.' });
    }

    const email = emailSocial.trim().toLowerCase();
    if (!EMAIL_REGEX.test(email) || email.length > 100) {
      return res.status(400).json({ mensaje: 'Email de cuenta social invalido.' });
    }

    const nombre = typeof nombreSocial === 'string' && nombreSocial.trim()
      ? nombreSocial.trim().slice(0, 50)
      : providerLimpio === 'google' ? 'Usuario Google' : 'Usuario Apple';

    const { data: usuarioExistente, error: errorBusqueda } = await buscarUsuarioPorEmail(email);
    if (errorBusqueda) {
      console.error('Error al buscar usuario social:', errorBusqueda);
      return res.status(500).json({ mensaje: 'Error al iniciar sesion social.' });
    }

    let usuario = usuarioExistente;

    if (!usuario) {
      const { data: usuarioCreado, error: errorRegistro } = await supabase
        .from('Usuario')
        .insert([{
          idUsuario: Date.now(),
          nombre,
          email,
          telefono: 0,
          contraseña: await bcrypt.hash(crypto.randomBytes(24).toString('hex'), SALT_ROUNDS),
          fechaRegistro: new Date().toISOString().split('T')[0],
        }])
        .select()
        .single();

      if (errorRegistro) {
        console.error('Error al registrar usuario social:', errorRegistro);
        return res.status(500).json({ mensaje: 'Error al iniciar sesion social.' });
      }

      usuario = usuarioCreado;
    }

    return res.status(200).json({
      mensaje: 'Login social exitoso.',
      token: crearToken(usuario),
      usuario: usuarioPublico(usuario),
    });
  } catch (error) {
    console.error('Error general en login social:', error);
    return res.status(500).json({ mensaje: 'Error general al iniciar sesion social.' });
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

module.exports = {
  login,
  register,
  forgotPassword,
  resetPassword,
  socialLogin,
  obtenerPerfil,
};
