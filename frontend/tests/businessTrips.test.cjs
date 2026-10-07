const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const helpers = import(`data:text/javascript;base64,${readFileSync(resolve(__dirname, '../utils/businessTrips.js')).toString('base64')}`);
const now = new Date(2026, 9, 7);
const trips = [
  { idViaje: 1, fechaViaje: '2026-10-01', precioEstimado: 9999, idTipoServicio: 1 },
  { idViaje: 2, tipoViaje: 'personal', fechaViaje: '2026-10-01', precioEstimado: 500 },
  { idViaje: 3, tipoViaje: 'business', fechaViaje: '2026-10-01', precioEstimado: 1200, idTipoServicio: 1, estado: 'pendiente' },
  { idViaje: 4, tipoViaje: 'business', fechaViaje: '2026-10-03', precioEstimado: '800', idTipoServicio: 2, motivoViaje: 'Cliente' },
  { idViaje: 5, tipoViaje: 'business', fechaViaje: '2026-09-30', precioEstimado: 3000, idTipoServicio: 3 },
];

test('históricos son personales y Business excluye personales', async () => {
  const h = await helpers;
  assert.equal(h.tripType(trips[0]), 'personal');
  assert.deepEqual(h.filterBusinessTrips(trips).map(t => t.idViaje), [3, 4, 5]);
});
test('períodos y métricas usan solo Business y fechas del mes local', async () => {
  const h = await helpers;
  const summary = h.businessSummary(trips, 'mes', now);
  assert.equal(summary.count, 2);
  assert.equal(summary.totalCount, 3);
  assert.equal(summary.cost, 2000);
  assert.equal(summary.provider, 'DiDi / Uber (empate)');
  assert.deepEqual(summary.latest.map(t => t.idViaje), [4, 3]);
  assert.equal(summary.latest[0].motivoViaje, 'Cliente');
  assert.equal(h.businessSummary(trips, 'anteriores', now).cost, 3000);
  assert.equal(h.businessSummary(trips, 'todos', now).cost, 5000);
  assert.equal(trips[2].estado, 'pendiente');
});
test('sin datos no inventa proveedores ni costos y descarta precios inválidos', async () => {
  const h = await helpers;
  assert.deepEqual(h.businessSummary([], 'mes', now), { count: 0, totalCount: 0, cost: 0, provider: null, latest: [] });
  assert.equal(h.estimatedCost([{ precioEstimado: 'abc' }, { precioEstimado: -20 }, { precioEstimado: null }]), 0);
  assert.equal(h.tripProvider({ idTipoServicio: 999 }), 'Proveedor sin datos');
});
test('últimos viajes tienen desempate estable, límite de cinco y no mutan el historial', async () => {
  const h = await helpers;
  const input = Array.from({ length: 7 }, (_, i) => ({ idViaje: i, tipoViaje: 'business', fechaViaje: '2026-10-01' }));
  assert.deepEqual(h.businessSummary(input, 'mes', now).latest.map(t => t.idViaje), [6, 5, 4, 3, 2]);
  assert.deepEqual(input.map(t => t.idViaje), [0, 1, 2, 3, 4, 5, 6]);
});
