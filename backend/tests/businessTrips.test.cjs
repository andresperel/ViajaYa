const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateTripClassification } = require('../src/validation/businessTrips');
const { resolve } = require('node:path');

// Replace only the database dependency; these tests never contact Supabase.
const configPath = resolve(__dirname, '../src/config/supabase.js');
const inserts = [];
let responses = [];
let membership = { data: { empresaId: 'empresa-demo', activo: true }, error: null };
require.cache[configPath] = {
  id: configPath, filename: configPath, loaded: true,
  exports: { from: (table) => table === 'EmpresaUsuario' ? { select: () => ({ eq: () => ({ maybeSingle: async () => membership }) }) } : ({ insert: (rows) => {
    inserts.push({ ...rows[0] });
    return { select: () => ({ single: async () => responses.shift() }) };
  } }) },
};
const { guardarViaje } = require('../src/controllers/viajeController');
async function save(body, results) {
  inserts.length = 0;
  responses = [...results];
  const res = { statusCode: null, data: null, status(code) { this.statusCode = code; return this; }, json(data) { this.data = data; return this; } };
  await guardarViaje({ body: { calleOrigen: 'Origen', calleDestino: 'Destino', precioEstimado: 1000, tiempoEstimado: 10, idTipoServicio: 1, ...body }, auth: { userId: 42 } }, res);
  return res;
}

test('clientes anteriores guardan personal por defecto', () => {
  assert.deepEqual(validateTripClassification(), { tipoViaje: 'personal', motivoViaje: null });
});
test('acepta Business, recorta motivo y respeta 200 caracteres Unicode', () => {
  assert.deepEqual(validateTripClassification({ tipoViaje: 'business', motivoViaje: ' Cliente ' }), { tipoViaje: 'business', motivoViaje: 'Cliente' });
  assert.equal(validateTripClassification({ motivoViaje: '😀'.repeat(200) }).motivoViaje.length, 400);
});
test('rechaza tipos inválidos y motivos no textuales o demasiado largos', () => {
  for (const tipoViaje of [null, '', 'corporate', {}, 1]) assert.throws(() => validateTripClassification({ tipoViaje }));
  for (const motivoViaje of [123, {}, [], 'a'.repeat(201), '😀'.repeat(201)]) assert.throws(() => validateTripClassification({ motivoViaje }));
});

test('el controlador guarda clasificación, motivo y dueño autenticado', async () => {
  const res = await save({ tipoViaje: 'business', motivoViaje: ' Cliente ' }, [{ data: { idViaje: 10 }, error: null }]);
  assert.equal(res.statusCode, 201);
  assert.equal(inserts[0].tipoViaje, 'business');
  assert.equal(inserts[0].motivoViaje, 'Cliente');
  assert.equal(inserts[0].idUsuario, 42);
  assert.equal(inserts[0].empresaId, 'empresa-demo');
  assert.equal(inserts[0].estado, 'pendiente');
  assert.equal(res.data.viaje.tipoViaje, 'business');
});
test('rechaza viajes corporativos de empleados inactivos y no inserta', async () => {
  membership = { data: { empresaId: 'empresa-demo', activo: false }, error: null };
  try {
    const res = await save({ tipoViaje: 'business', empresaId: 'empresa-ajena' }, []);
    assert.equal(res.statusCode, 403);
    assert.equal(inserts.length, 0);
  } finally { membership = { data: { empresaId: 'empresa-demo', activo: true }, error: null }; }
});
test('sin migración Business responde 503 y nunca reintenta como personal', async () => {
  const res = await save({ tipoViaje: 'business' }, [{ data: null, error: { message: "Could not find the 'tipoViaje' column in the schema cache" } }]);
  assert.equal(res.statusCode, 503);
  assert.equal(inserts.length, 1);
  assert.equal(inserts[0].tipoViaje, 'business');
});
test('inactivación entre verificación e inserción devuelve 403', async () => {
  const res = await save({ tipoViaje: 'business' }, [{ data: null, error: { code: '42501', message: 'No tenés acceso activo a esta empresa.' } }]);
  assert.equal(res.statusCode, 403);
});
test('Personal sigue guardando si faltan ambas migraciones', async () => {
  const res = await save({}, [
    { data: null, error: { message: "Could not find the 'motivoViaje' column in the schema cache" } },
    { data: null, error: { message: 'column estado does not exist' } },
    { data: { idViaje: 10 }, error: null },
  ]);
  assert.equal(res.statusCode, 201);
  assert.equal(inserts.length, 3);
  assert.equal(inserts[0].tipoViaje, 'personal');
  assert.equal(inserts[2].tipoViaje, undefined);
  assert.equal(res.data.viaje.tipoViaje, 'personal');
});
test('el fallback de estados conserva metadatos Business', async () => {
  const res = await save({ tipoViaje: 'business', motivoViaje: 'Trabajo' }, [
    { data: null, error: { message: 'column estado does not exist' } },
    { data: { idViaje: 10 }, error: null },
  ]);
  assert.equal(res.statusCode, 201);
  assert.equal(inserts[1].tipoViaje, 'business');
  assert.equal(inserts[1].motivoViaje, 'Trabajo');
});
test('validación inválida responde 400 antes de escribir a Supabase', async () => {
  const res = await save({ motivoViaje: 'a'.repeat(201) }, []);
  assert.equal(res.statusCode, 400);
  assert.equal(inserts.length, 0);
});
