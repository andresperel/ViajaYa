// Prueba optativa contra Supabase real. Solo elimina los registros creados aquí.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });
const app = require('../src/app');
const db = require('../src/config/supabase');
const { createClient } = require('@supabase/supabase-js');

async function main() {
  const suffix = crypto.randomUUID();
  const emails = [`business-smoke-${suffix}@example.com`, `business-outsider-${suffix}@example.com`];
  const password = crypto.randomBytes(12).toString('hex');
  const createdUsers = [];
  const createdTrips = [];
  let companyId;
  let server;
  function checked(response) { if (response.error) throw new Error(response.error.message); return response.data; }
  try {
    const service = checked(await db.from('TipoServicio').select('idTipoServicio').limit(1).maybeSingle());
    assert.ok(service, 'Debe existir al menos un tipo de servicio para probar viajes.');
    server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
    const base = `http://127.0.0.1:${server.address().port}`;
    async function request(route, expected, { method = 'GET', body, token } = {}) {
      const response = await fetch(base + route, {
        method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20000),
      });
      const data = await response.json();
      assert.equal(response.status, expected, `${method} ${route}: ${data.mensaje || data.detalle || 'respuesta inesperada'}`);
      return data;
    }
    const page = await fetch(base + '/business-admin/');
    assert.equal(page.status, 200); assert.match(await page.text(), /Administración de empresas/);
    await request('/business/admin/empresas', 401);
    const admin = await request('/business/admin/login', 200, { method: 'POST', body: { email: 'admin@viajaya.com', password: 'ViajaYaAdmin2026!' } });
    const company = await request('/business/admin/empresas', 201, { method: 'POST', token: admin.token, body: { nombre: `Prueba temporal ${suffix}` } });
    companyId = company.id; assert.match(company.codigo, /^[A-F0-9]{16}$/);
    const accounts = [];
    for (const email of emails) {
      const registration = await request('/register', 201, { method: 'POST', body: { nombre: 'Prueba Corporativa', telefono: '1123456789', email, password } });
      createdUsers.push(registration.usuario.idUsuario);
      accounts.push(await request('/login', 200, { method: 'POST', body: { email, password } }));
    }
    const employee = accounts[0];
    const outsider = accounts[1];
    await request('/business/admin/empresas', 401, { token: employee.token });
    const member = await request(`/business/admin/empresas/${companyId}/usuarios`, 201, { method: 'POST', token: admin.token, body: { email: emails[0] } });
    await request(`/business/admin/empresas/${companyId}/usuarios`, 409, { method: 'POST', token: admin.token, body: { email: emails[0] } });
    await request('/business/acceder', 400, { method: 'POST', token: employee.token, body: { codigo: 'INVALIDO' } });
    await request('/business/acceder', 403, { method: 'POST', token: outsider.token, body: { codigo: company.codigo } });
    const joined = await request('/business/acceder', 200, { method: 'POST', token: employee.token, body: { codigo: company.codigo.toLowerCase() } });
    assert.equal(joined.empresa.id, companyId);
    const membership = await request('/business/mi-empresa', 200, { token: employee.token });
    assert.equal(membership.empresa.nombre, company.nombre);
    console.log('Empresa, correos autorizados y acceso por código: OK.');
    const tripBody = { calleOrigen: 'Origen de prueba', calleDestino: 'Destino de prueba', precioEstimado: 1500, tiempoEstimado: 10, idTipoServicio: service.idTipoServicio };
    const business = await request('/viaje', 201, { method: 'POST', token: employee.token, body: { ...tripBody, tipoViaje: 'business', motivoViaje: 'Prueba del flujo', empresaId: crypto.randomUUID() } });
    createdTrips.push(business.viaje.idViaje); assert.equal(business.viaje.empresaId, companyId);
    const personal = await request('/viaje', 201, { method: 'POST', token: employee.token, body: { ...tripBody, tipoViaje: 'personal' } });
    createdTrips.push(personal.viaje.idViaje); assert.equal(personal.viaje.empresaId, null);
    checked(await db.from('Viaje').update({ estado: 'realizado', fechaConfirmacion: new Date().toISOString() }).eq('idViaje', business.viaje.idViaje).eq('idUsuario', employee.usuario.idUsuario));
    const stats = await request(`/business/admin/empresas/${companyId}`, 200, { token: admin.token });
    assert.equal(stats.stats.viajes, 1); assert.equal(stats.stats.realizados, 1); assert.equal(stats.stats.gastoEstimado, 1500);
    assert.equal(stats.stats.activos, 1); assert.equal(stats.stats.vinculados, 1); assert.equal(stats.usuarios[0].viajes, 1);
    const history = await request('/mis-viajes', 200, { token: employee.token });
    assert.equal(history.length, 2);
    console.log('Viajes personales/corporativos y estadísticas de empresa: OK.');
    await request(`/business/admin/usuarios/${member.id}`, 200, { method: 'PATCH', token: admin.token, body: { activo: false } });
    const inactive = await request('/business/mi-empresa', 200, { token: employee.token });
    assert.deepEqual(inactive, { empresa: null, inactivo: true });
    await request('/business/acceder', 403, { method: 'POST', token: employee.token, body: { codigo: company.codigo } });
    await request('/viaje', 403, { method: 'POST', token: employee.token, body: { ...tripBody, tipoViaje: 'business' } });
    const blockedInsert = await db.from('Viaje').insert({
      idViaje: Date.now(), idUsuario: employee.usuario.idUsuario, idTipoServicio: service.idTipoServicio,
      calleOrigen: 'Origen de prueba', alturaOrigen: 0, calleDestino: 'Destino de prueba', alturaDestino: 0,
      precioEstimado: 1500, tiempoEstimado: 10, fechaViaje: new Date().toISOString().slice(0, 10), tipoViaje: 'business', empresaId: companyId,
    });
    assert.equal(blockedInsert.error?.code, '42501', 'La base también debe impedir viajes de empleados inactivos.');
    const after = await request(`/business/admin/empresas/${companyId}`, 200, { token: admin.token });
    assert.equal(after.stats.activos, 0); assert.equal(after.stats.viajes, 1);
    await request(`/business/admin/usuarios/${member.id}`, 200, { method: 'PATCH', token: admin.token, body: { activo: true } });
    await request('/business/acceder', 200, { method: 'POST', token: employee.token, body: { codigo: company.codigo } });
    console.log('Inactivación, bloqueo en API/base y reactivación: OK.');
    const publicKey = process.env.SUPABASE_KEY || '';
    let isPublic = publicKey.startsWith('sb_publishable_');
    try { isPublic ||= JSON.parse(Buffer.from(publicKey.split('.')[1], 'base64url')).role === 'anon'; } catch { /* clave no JWT */ }
    if (isPublic) {
      const publicDb = createClient(process.env.SUPABASE_URL, publicKey, { auth: { persistSession: false, autoRefreshToken: false } });
      const visible = checked(await publicDb.from('EmpresaCorporativa').select('id').eq('id', companyId));
      assert.deepEqual(visible, []);
      const visibleMembers = checked(await publicDb.from('EmpresaUsuario').select('id').eq('empresaId', companyId));
      assert.deepEqual(visibleMembers, []);
      console.log('Datos corporativos protegidos del acceso público: OK.');
    }
    console.log('Flujo Business real verificado.');
  } finally {
    // Los identificadores se capturan de las respuestas creadas por esta prueba.
    const cleanupErrors = [];
    async function cleanup(query) { try { checked(await query); } catch (error) { cleanupErrors.push(error.message); } }
    for (const id of createdTrips) await cleanup(db.from('Viaje').delete().eq('idViaje', id));
    if (companyId) {
      await cleanup(db.from('EmpresaUsuario').delete().eq('empresaId', companyId));
      await cleanup(db.from('EmpresaCorporativa').delete().eq('id', companyId));
    }
    for (const id of createdUsers) await cleanup(db.from('Usuario').delete().eq('idUsuario', id).in('email', emails));
    if (server) await new Promise(resolve => server.close(resolve));
    if (cleanupErrors.length) throw new Error(`No se pudo limpiar la prueba: ${cleanupErrors.join('; ')}`);
    console.log('Datos temporales de prueba eliminados.');
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
