// Historical trips without classification are always personal.
export const tripType = (trip) => trip.tipoViaje === 'business' ? 'business' : 'personal';

export function filterBusinessTrips(trips) {
  return trips.filter((trip) => tripType(trip) === 'business');
}

export function filterPeriod(trips, period = 'todos', now = new Date()) {
  if (period === 'todos') return trips;
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return trips.filter((trip) => period === 'mes'
    ? String(trip.fechaViaje || '').startsWith(month)
    : !String(trip.fechaViaje || '').startsWith(month));
}

export function estimatedCost(trips) {
  return trips.reduce((sum, trip) => {
    const value = Number(trip.precioEstimado);
    return sum + (trip.precioEstimado != null && Number.isFinite(value) && value >= 0 ? value : 0);
  }, 0);
}

// The service IDs are the same ones returned by the existing comparison.
export function tripProvider(trip) {
  return { 1: 'Uber', 2: 'DiDi', 3: 'Cabify' }[trip.idTipoServicio] || 'Proveedor sin datos';
}

export function businessSummary(trips, period = 'mes', now = new Date()) {
  const business = filterBusinessTrips(trips);
  const selected = filterPeriod(business, period, now);
  const counts = new Map();
  for (const trip of selected) {
    const provider = tripProvider(trip);
    if (provider !== 'Proveedor sin datos') counts.set(provider, (counts.get(provider) || 0) + 1);
  }
  const ranking = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const leaders = ranking.filter((item) => item[1] === ranking[0]?.[1]).map((item) => item[0]);
  return {
    count: selected.length,
    totalCount: business.length,
    cost: estimatedCost(selected),
    provider: leaders.length ? leaders.join(' / ') + (leaders.length > 1 ? ' (empate)' : '') : null,
    latest: [...selected].sort((a, b) => String(b.fechaViaje || '').localeCompare(String(a.fechaViaje || '')) || Number(b.idViaje || 0) - Number(a.idViaje || 0)).slice(0, 5),
  };
}
