const { test } = require('node:test');
const assert = require('node:assert/strict');
const { resolve } = require('node:path');
const jwt = require('jsonwebtoken');
process.env.JWT_SECRET = 'test-secret-for-business-at-least-32-characters';
const dbPath = resolve(__dirname, '../src/config/supabase.js');
let responses = [];
const queries = [];
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { from(table) {
  const query = { table, filters: [], updates: null }; queries.push(query);
  const chain = {
    select() { return chain; }, eq(key, value) { query.filters.push([key, value]); return chain; },
    update(value) { query.updates = value; return chain; },
    insert(value) { query.inserts = value; return chain; },
    order() { return chain; },
    then(resolve, reject) { return Promise.resolve(responses.shift()).then(resolve, reject); },
    single: async () => responses.shift(), maybeSingle: async () => responses.shift(),
  };
  return chain;
} } };
const router = require('../src/routes/businessRoutes');
const handler = path => router.stack.find(layer => layer.route?.path === path).route.stack.at(-1).handle;
const response = () => ({ statusCode: 200, data: null, status(code) { this.statusCode = code; return this; }, json(data) { this.data = data; return this; } });
async function access(results, body = { codigo: ' ABC ' }) {
  responses = results.map(data => ({ data, error: null })); queries.length = 0;
  const res = response(); await handler('/business/acceder')({ body, auth: { userId: 42, email: 'stale@example.com' } }, res); return res;
}
test('admin hardcodeado emite un token exclusivo del panel', async () => {
  const res = response(); await handler('/business/admin/login')({ body: { email: 'admin@viajaya.com', password: 'ViajaYaAdmin2026!' } }, res);
  const payload = jwt.verify(res.data.token, process.env.JWT_SECRET, { audience: 'viajaya-admin', issuer: 'viajaya-business' });
  assert.equal(payload.role, 'admin');
  assert.throws(() => jwt.verify(res.data.token, process.env.JWT_SECRET, { audience: 'viajaya-mobile' }));
});
test('credenciales inválidas no emiten un token', async () => {
  const res = response(); await handler('/business/admin/login')({ body: { email: 'admin@viajaya.com', password: 'incorrecta' } }, res);
  assert.equal(res.statusCode, 401); assert.equal(res.data.token, undefined);
});
test('el panel rechaza tokens de Mobile', () => {
  const middleware = router.stack.find(layer => layer.route?.path === '/business/admin/empresas').route.stack[0].handle;
  const res = response(); let passed = false;
  const token = jwt.sign({ sub: '42' }, process.env.JWT_SECRET, { audience: 'viajaya-mobile', issuer: 'viajaya-api' });
  middleware({ headers: { authorization: `Bearer ${token}` } }, res, () => { passed = true; });
  assert.equal(res.statusCode, 401); assert.equal(passed, false);
});
test('código inválido no vincula cuentas', async () => {
  const res = await access([null]); assert.equal(res.statusCode, 400); assert.equal(queries.length, 1);
});
test('correo no autorizado o inactivo no vincula cuentas', async () => {
  for (const member of [null, { activo: false }]) {
    const res = await access([{ id: 'empresa' }, { email: 'actual@example.com' }, member]);
    assert.equal(res.statusCode, 403); assert.equal(queries.length, 3);
  }
});
test('vincula usando el correo actual de la base y la cuenta autenticada', async () => {
  const res = await access([{ id: 'empresa', nombre: 'Acme' }, { email: 'Actual@example.com' }, { id: 'miembro', activo: true }, { id: 'miembro' }], { codigo: 'abc', email: 'falso@example.com', usuarioId: 999 });
  assert.equal(res.statusCode, 200); assert.equal(res.data.empresa.nombre, 'Acme');
  assert.deepEqual(queries[0].filters, [['codigo', 'ABC']]);
  assert.deepEqual(queries[2].filters, [['empresaId', 'empresa'], ['email', 'actual@example.com']]);
  assert.equal(queries[3].updates.usuarioId, 42);
});
test('una inactivación durante el acceso también lo rechaza', async () => {
  const res = await access([{ id: 'empresa' }, { email: 'actual@example.com' }, { id: 'miembro', activo: true }, null]);
  assert.equal(res.statusCode, 403);
});
test('flujo HTTP: crear empresa, autorizar, acceder, guardar, consultar e inactivar', async (t) => {
  const express = require('express');
  const { guardarViaje } = require('../src/controllers/viajeController');
  const { requireAuth } = require('../src/middlewares/authMiddleware');
  const app = express(); app.use(express.json()); app.use(router); app.post('/viaje', requireAuth, guardarViaje);
  const server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const company = { id: 'empresa', nombre: 'Empresa de prueba', codigo: 'ABC' };
  const member = { id: 'miembro', empresaId: 'empresa', email: 'empleado@example.com', activo: true, usuarioId: 42 };
  const mobileToken = jwt.sign({ email: member.email }, process.env.JWT_SECRET, { subject: '42', issuer: 'viajaya-api', audience: 'viajaya-mobile', expiresIn: '1h' });
  async function request(path, method, body, token, data = []) {
    responses = data.map(item => ({ data: item, error: null })); queries.length = 0;
    const r = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
    return { status: r.status, data: await r.json() };
  }
  const login = await request('/business/admin/login', 'POST', { email: 'admin@viajaya.com', password: 'ViajaYaAdmin2026!' });
  const adminToken = login.data.token;
  assert.equal(login.status, 200);
  assert.equal((await request('/business/admin/empresas', 'GET', null, mobileToken)).status, 401);
  assert.equal((await request('/business/admin/empresas', 'POST', { nombre: company.nombre }, adminToken, [company])).status, 201);
  assert.equal(queries[0].table, 'EmpresaCorporativa'); assert.match(queries[0].inserts.codigo, /^[A-F0-9]{16}$/);
  assert.equal((await request('/business/admin/empresas/empresa/usuarios', 'POST', { email: ' Empleado@example.com ' }, adminToken, [member])).status, 201);
  assert.equal(queries[0].inserts.email, member.email);
  assert.equal((await request('/business/acceder', 'POST', { codigo: 'abc' }, mobileToken, [company, { email: member.email }, member, member])).status, 200);
  const trip = { idViaje: 99, idUsuario: 42, precioEstimado: 1500, estado: 'pendiente' };
  const tripBody = { tipoViaje: 'business', calleOrigen: 'Origen', calleDestino: 'Destino', precioEstimado: 1500, tiempoEstimado: 10, idTipoServicio: 1, empresaId: 'empresa-ajena' };
  assert.equal((await request('/viaje', 'POST', tripBody, mobileToken, [member, trip])).status, 201);
  assert.equal(queries[1].inserts[0].empresaId, company.id);
  const detail = await request('/business/admin/empresas/empresa', 'GET', null, adminToken, [company, [member], [trip]]);
  assert.equal(detail.status, 200); assert.equal(detail.data.stats.viajes, 1); assert.equal(detail.data.stats.gastoEstimado, 1500); assert.equal(detail.data.stats.activos, 1);
  assert.equal(detail.data.usuarios[0].viajes, 1);
  assert.equal((await request('/business/admin/usuarios/miembro', 'PATCH', { activo: false }, adminToken, [{ ...member, activo: false }])).status, 200);
  const profile = await request('/business/mi-empresa', 'GET', null, mobileToken, [{ ...member, activo: false, EmpresaCorporativa: company }]);
  assert.deepEqual(profile.data, { empresa: null, inactivo: true });
  assert.equal((await request('/viaje', 'POST', tripBody, mobileToken, [{ ...member, activo: false }])).status, 403);
  assert.equal(queries.length, 1);
});
