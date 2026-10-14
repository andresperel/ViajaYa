const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../config/supabase');
const { requireAuth } = require('../middlewares/authMiddleware');
const router = express.Router();
const ADMIN_EMAIL = 'admin@viajaya.com';
const ADMIN_PASSWORD = 'ViajaYaAdmin2026!';
const wrap = (fn) => async (req, res) => {
  try { await fn(req, res); } catch (error) {
    console.error('Business:', error.message);
    res.status(500).json({ mensaje: 'No se pudo completar la operación Business. Verificá la migración y la conexión.' });
  }
};
function result(response) { if (response.error) throw response.error; return response.data; }
function admin(req, res, next) {
  try {
    const token = (req.headers.authorization || '').replace(/^Bearer /, '');
    jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'], audience: 'viajaya-admin', issuer: 'viajaya-business' });
    next();
  } catch { res.status(401).json({ mensaje: 'Iniciá sesión como administrador.' }); }
}
router.post('/business/admin/login', wrap(async (req, res) => {
  if (req.body?.email !== ADMIN_EMAIL || req.body?.password !== ADMIN_PASSWORD) return res.status(401).json({ mensaje: 'Credenciales incorrectas.' });
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET inválido');
  res.json({ token: jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '2h', audience: 'viajaya-admin', issuer: 'viajaya-business' }) });
}));
router.get('/business/admin/empresas', admin, wrap(async (req, res) => {
  res.json(result(await db.from('EmpresaCorporativa').select('*').order('creada', { ascending: false })));
}));
router.post('/business/admin/empresas', admin, wrap(async (req, res) => {
  const nombre = typeof req.body?.nombre === 'string' ? req.body.nombre.trim() : '';
  if (nombre.length < 2 || nombre.length > 100) return res.status(400).json({ mensaje: 'El nombre debe tener entre 2 y 100 caracteres.' });
  res.status(201).json(result(await db.from('EmpresaCorporativa').insert({ nombre, codigo: crypto.randomBytes(8).toString('hex').toUpperCase() }).select().single()));
}));
router.get('/business/admin/empresas/:id', admin, wrap(async (req, res) => {
  const empresa = result(await db.from('EmpresaCorporativa').select('*').eq('id', req.params.id).maybeSingle());
  if (!empresa) return res.status(404).json({ mensaje: 'Empresa no encontrada.' });
  const usuarios = result(await db.from('EmpresaUsuario').select('*').eq('empresaId', empresa.id).order('email'));
  const viajes = result(await db.from('Viaje').select('idUsuario,precioEstimado,estado,fechaViaje').eq('empresaId', empresa.id));
  const resumen = (items) => ({ viajes: items.length, realizados: items.filter(v => v.estado === 'realizado').length, gastoEstimado: items.filter(v => v.estado !== 'cancelado').reduce((s, v) => s + Number(v.precioEstimado || 0), 0) });
  res.json({ empresa, usuarios: usuarios.map(u => ({ ...u, ...resumen(viajes.filter(v => String(v.idUsuario) === String(u.usuarioId))) })), stats: { ...resumen(viajes), activos: usuarios.filter(u => u.activo).length, vinculados: usuarios.filter(u => u.usuarioId != null).length } });
}));
router.post('/business/admin/empresas/:id/usuarios', admin, wrap(async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (email.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ mensaje: 'Ingresá un correo válido.' });
  const response = await db.from('EmpresaUsuario').insert({ empresaId: req.params.id, email }).select().single();
  if (response.error?.code === '23505') return res.status(409).json({ mensaje: 'El correo ya pertenece a una empresa.' });
  res.status(201).json(result(response));
}));
router.patch('/business/admin/usuarios/:id', admin, wrap(async (req, res) => {
  if (typeof req.body?.activo !== 'boolean') return res.status(400).json({ mensaje: 'Indicá el estado del usuario.' });
  const usuario = result(await db.from('EmpresaUsuario').update({ activo: req.body.activo }).eq('id', req.params.id).select().maybeSingle());
  if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
  res.json(usuario);
}));
router.get('/business/mi-empresa', requireAuth, wrap(async (req, res) => {
  const miembro = result(await db.from('EmpresaUsuario').select('*,EmpresaCorporativa(*)').eq('usuarioId', req.auth.userId).maybeSingle());
  res.json({ empresa: miembro?.activo ? miembro.EmpresaCorporativa : null, inactivo: Boolean(miembro && !miembro.activo) });
}));
router.post('/business/acceder', requireAuth, wrap(async (req, res) => {
  const codigo = typeof req.body?.codigo === 'string' ? req.body.codigo.trim().toUpperCase() : '';
  const empresa = result(await db.from('EmpresaCorporativa').select('*').eq('codigo', codigo).maybeSingle());
  if (!empresa) return res.status(400).json({ mensaje: 'Código de empresa inválido.' });
  // El correo actual se obtiene de la cuenta, no del formulario ni del código.
  const usuario = result(await db.from('Usuario').select('email').eq('idUsuario', req.auth.userId).single());
  const miembro = result(await db.from('EmpresaUsuario').select('*').eq('empresaId', empresa.id).eq('email', usuario.email.toLowerCase()).maybeSingle());
  if (!miembro?.activo) return res.status(403).json({ mensaje: 'Tu correo no está habilitado en esta empresa.' });
  if (miembro.usuarioId && String(miembro.usuarioId) !== String(req.auth.userId)) return res.status(403).json({ mensaje: 'Este correo ya está vinculado a otra cuenta.' });
  const actualizado = result(await db.from('EmpresaUsuario').update({ usuarioId: req.auth.userId, fechaAcceso: new Date().toISOString() }).eq('id', miembro.id).eq('activo', true).select().maybeSingle());
  if (!actualizado) return res.status(403).json({ mensaje: 'El acceso fue inactivado.' });
  res.json({ empresa });
}));
module.exports = router;
