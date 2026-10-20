const axios = require('axios');
const https = require('https');

const CABA_BBOX = Object.freeze({ minLon: -58.70, minLat: -34.85, maxLon: -58.25, maxLat: -34.45 });
const ORS_TIMEOUT_MS = 12_000;
const cache = new Map();

const orsHttp = axios.create({
  baseURL: 'https://api.openrouteservice.org',
  timeout: ORS_TIMEOUT_MS,
  httpsAgent: (process.env.ORS_ALLOW_INSECURE_TLS === 'true' || process.env.NODE_ENV !== 'production')
    ? new https.Agent({ rejectUnauthorized: false })
    : undefined,
});

const googleRoutesHttp = axios.create({
  baseURL: 'https://routes.googleapis.com',
  timeout: ORS_TIMEOUT_MS,
});
const googleMapsHttp = axios.create({ baseURL: 'https://maps.googleapis.com', timeout: ORS_TIMEOUT_MS });
const nominatimHttp = axios.create({
  baseURL: 'https://nominatim.openstreetmap.org',
  timeout: ORS_TIMEOUT_MS,
  headers: { 'User-Agent': 'ViajaYa/1.0 direccion-autocomplete' },
});
const georefHttp = axios.create({
  baseURL: 'https://apis.datos.gob.ar/georef/api',
  timeout: ORS_TIMEOUT_MS,
  headers: { 'User-Agent': 'ViajaYa/1.0 direccion-autocomplete' },
});

const inCaba = ([lon, lat]) => Number.isFinite(lon) && Number.isFinite(lat)
  && lon >= CABA_BBOX.minLon && lon <= CABA_BBOX.maxLon && lat >= CABA_BBOX.minLat && lat <= CABA_BBOX.maxLat;

const normalizarDireccion = (value) => value.trim().replace(/\s+/g, ' ');
const normalizarParaComparar = (value = '') => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9 ]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const puntuarSugerencia = (item, query) => {
  const label = normalizarParaComparar(item.label);
  const terms = normalizarParaComparar(query).split(' ').filter(Boolean);
  const coincidencias = terms.filter((term) => label.includes(term)).length;
  const empiezaIgual = label.startsWith(normalizarParaComparar(query)) ? 3 : 0;
  const tieneAltura = /\d/.test(query) && label.includes((query.match(/\d+/) || [''])[0]) ? 2 : 0;
  return coincidencias * 2 + empiezaIgual + tieneAltura + (Number(item.confidence) || 0);
};

const deduplicarYOrdenar = (items, query) => {
  const vistos = new Set();
  const terms = normalizarParaComparar(query)
    .split(' ')
    .filter((term) => term.length >= 3 && !/^\d+$/.test(term));
  return items
    .filter((item) => item?.label && inCaba(item.coordinates || []))
    .filter((item) => {
      const label = normalizarParaComparar(item.label);
      return terms.length === 0 || terms.every((term) => label.includes(term));
    })
    .sort((a, b) => puntuarSugerencia(b, query) - puntuarSugerencia(a, query))
    .filter((item) => {
      const [lon, lat] = item.coordinates;
      const key = `${normalizarParaComparar(item.label)}:${lon.toFixed(4)},${lat.toFixed(4)}`;
      if (vistos.has(key)) return false;
      vistos.add(key);
      return true;
    })
    .slice(0, 12);
};

async function buscarEnOpenStreetMap(query) {
  const { data } = await nominatimHttp.get('/search', {
    params: {
      q: `${query}, Ciudad Autonoma de Buenos Aires, Argentina`,
      format: 'jsonv2',
      addressdetails: 1,
      namedetails: 1,
      limit: 15,
      countrycodes: 'ar',
      viewbox: `${CABA_BBOX.minLon},${CABA_BBOX.maxLat},${CABA_BBOX.maxLon},${CABA_BBOX.minLat}`,
      bounded: 1,
      'accept-language': 'es',
    },
  });
  return (data || []).map((item) => ({
    label: item.display_name,
    coordinates: [Number(item.lon), Number(item.lat)],
    confidence: Number(item.importance) || 0,
    provider: 'openstreetmap',
  }));
}

async function buscarEnGeoref(query) {
  // GeoRef es la fuente oficial argentina y resulta especialmente precisa
  // cuando el usuario ya escribio calle y altura.
  if (!/\d/.test(query)) return [];
  const { data } = await georefHttp.get('/direcciones', {
    params: { direccion: query, provincia: '02', max: 10 },
  });
  return (data.direcciones || [])
    .filter((item) => Number.isFinite(item.ubicacion?.lon) && Number.isFinite(item.ubicacion?.lat))
    .map((item) => ({
      label: item.nomenclatura,
      coordinates: [item.ubicacion.lon, item.ubicacion.lat],
      confidence: 1,
      provider: 'georef-argentina',
    }));
}

async function geocodificarEnCaba(direccion, apiKey) {
  const query = normalizarDireccion(direccion).toLowerCase();
  const cached = cache.get(query);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const { data } = await orsHttp.get('/geocode/search', {
    params: {
      api_key: apiKey,
      text: `${direccion}, Ciudad Autónoma de Buenos Aires`,
      'boundary.country': 'AR',
      'boundary.rect.min_lon': CABA_BBOX.minLon,
      'boundary.rect.min_lat': CABA_BBOX.minLat,
      'boundary.rect.max_lon': CABA_BBOX.maxLon,
      'boundary.rect.max_lat': CABA_BBOX.maxLat,
      layers: 'address,venue',
      size: 10,
    },
  });

  const feature = data.features?.find((candidate) => inCaba(candidate.geometry?.coordinates || []));
  if (!feature) return null;

  const value = {
    coordinates: feature.geometry.coordinates, // GeoJSON: [longitud, latitud]
    label: feature.properties?.label || direccion,
    confidence: feature.properties?.confidence ?? null,
  };
  cache.set(query, { value, expiresAt: Date.now() + 10 * 60 * 1000 });
  return value;
}

async function buscarSugerencias(req, res) {
  const query = typeof req.query.q === 'string' ? normalizarDireccion(req.query.q) : '';
  if (query.length < 3) return res.status(400).json({ mensaje: 'Ingresá al menos 3 caracteres.' });
  if (!process.env.OPENROUTESERVICE_API_KEY && !process.env.GOOGLE_MAPS_API_KEY) return res.status(503).json({ mensaje: 'El servicio de rutas no está configurado.' });
  const cacheKey = `sugerencias:${query.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return res.json(cached.value);

  try {
    if (process.env.GOOGLE_MAPS_API_KEY) {
      const { data } = await googleMapsHttp.get('/maps/api/geocode/json', {
        params: { address: `${query}, Ciudad Autónoma de Buenos Aires, Argentina`, components: 'country:AR', region: 'ar', language: 'es', key: process.env.GOOGLE_MAPS_API_KEY },
      });
      if (data.status !== 'OK') throw new Error(`GOOGLE_GEOCODING_${data.status}`);
      const sugerenciasGoogle = data.results
        .map((result) => ({ label: result.formatted_address, coordinates: [result.geometry.location.lng, result.geometry.location.lat], confidence: result.partial_match ? 0.5 : 1 }))
        .filter((item) => inCaba(item.coordinates));
      const resultado = { sugerencias: sugerenciasGoogle, proveedor: 'google-geocoding' };
      cache.set(cacheKey, { value: resultado, expiresAt: Date.now() + 5 * 60 * 1000 });
      return res.json(resultado);
    }
    const params = {
      api_key: process.env.OPENROUTESERVICE_API_KEY,
      text: `${query}, Ciudad Autónoma de Buenos Aires`,
      'boundary.country': 'AR',
      'boundary.rect.min_lon': CABA_BBOX.minLon,
      'boundary.rect.min_lat': CABA_BBOX.minLat,
      'boundary.rect.max_lon': CABA_BBOX.maxLon,
      'boundary.rect.max_lat': CABA_BBOX.maxLat,
      layers: 'address,venue',
      size: 20,
    };
    const [orsResult, osmResult, georefResult] = await Promise.allSettled([
      orsHttp.get('/geocode/autocomplete', { params }),
      buscarEnOpenStreetMap(query),
      buscarEnGeoref(query),
    ]);

    const sugerenciasOrs = orsResult.status === 'fulfilled'
      ? (orsResult.value.data.features || []).map((feature) => ({
        label: feature.properties?.label,
        coordinates: feature.geometry?.coordinates,
        confidence: feature.properties?.confidence ?? null,
        provider: 'openrouteservice',
      }))
      : [];
    const sugerenciasOsm = osmResult.status === 'fulfilled' ? osmResult.value : [];
    const sugerenciasGeoref = georefResult.status === 'fulfilled' ? georefResult.value : [];
    const sugerencias = deduplicarYOrdenar(
      [...sugerenciasGeoref, ...sugerenciasOrs, ...sugerenciasOsm],
      query,
    );

    if (sugerencias.length === 0) throw new Error('NO_AUTOCOMPLETE_RESULTS');

    const resultado = { sugerencias, proveedor: 'combinado' };
    cache.set(cacheKey, { value: resultado, expiresAt: Date.now() + 5 * 60 * 1000 });
    return res.json(resultado);
  } catch (error) {
    const status = error.code === 'ECONNABORTED' ? 504 : error.response?.status === 429 ? 429 : 502;
    console.error('Error autocomplete:', status, error.response?.statusText || error.message);
    return res.status(status).json({
      mensaje: status === 429
        ? 'El buscador alcanzo su limite temporal. Espera unos segundos e intenta nuevamente.'
        : 'No pudimos buscar direcciones en este momento.',
    });
  }
}

function crearOpciones({ distanciaKm, duracionMin }) {
  const base = distanciaKm * 420 + duracionMin * 38;
  return [
    { empresa: 'DiDi', tipo: 'Express', precio: Math.round(780 + base * 0.94), llegadaMin: 7, duracionMin, confort: 3.8, rating: 4.7, idTipoServicio: 2, recomendacion: 'Más económico' },
    { empresa: 'Uber', tipo: 'Comfort', precio: Math.round(990 + base * 1.06), llegadaMin: 3, duracionMin: Math.max(1, duracionMin - 1), confort: 4.7, rating: 4.9, idTipoServicio: 1, recomendacion: 'Mejor valor' },
    { empresa: 'Cabify', tipo: 'Executive', precio: Math.round(1160 + base * 1.13), llegadaMin: 5, duracionMin: Math.max(1, duracionMin - 2), confort: 4.5, rating: 4.8, idTipoServicio: 3, recomendacion: 'Más rápido' },
  ];
}

const durationToSeconds = (duration) => Number.parseFloat(String(duration || '0').replace('s', ''));

async function calcularRuta(coordenadasOrigen, coordenadasDestino) {
  if (process.env.GOOGLE_MAPS_API_KEY) {
    const { data } = await googleRoutesHttp.post('/directions/v2:computeRoutes', {
      origin: { location: { latLng: { latitude: coordenadasOrigen[1], longitude: coordenadasOrigen[0] } } },
      destination: { location: { latLng: { latitude: coordenadasDestino[1], longitude: coordenadasDestino[0] } } },
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
      languageCode: 'es-419',
    }, {
      headers: {
        'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration',
      },
    });
    const route = data.routes?.[0];
    if (!route || !Number.isFinite(route.distanceMeters) || !Number.isFinite(durationToSeconds(route.duration))) throw new Error('GOOGLE_ROUTES_RESPONSE_INVALID');
    return { distanceMeters: route.distanceMeters, durationSeconds: durationToSeconds(route.duration), provider: 'google-routes' };
  }

  const { data } = await orsHttp.post('/v2/directions/driving-car', { coordinates: [coordenadasOrigen, coordenadasDestino] }, {
    headers: { Authorization: process.env.OPENROUTESERVICE_API_KEY, 'Content-Type': 'application/json' },
  });
  const summary = data.routes?.[0]?.summary;
  if (!summary || !Number.isFinite(summary.distance) || !Number.isFinite(summary.duration)) throw new Error('ORS_RESPONSE_INVALID');
  return { distanceMeters: summary.distance, durationSeconds: summary.duration, provider: 'openrouteservice' };
}

async function calcularViaje(req, res) {
  const { origen, destino, origenCoordenadas, destinoCoordenadas } = req.body || {};
  if (typeof origen !== 'string' || typeof destino !== 'string' || !origen.trim() || !destino.trim()) {
    return res.status(400).json({ mensaje: 'Origen y destino deben ser direcciones válidas.' });
  }
  if (origen.length > 160 || destino.length > 160) {
    return res.status(400).json({ mensaje: 'Cada dirección puede tener hasta 160 caracteres.' });
  }
  if (!process.env.OPENROUTESERVICE_API_KEY && !process.env.GOOGLE_MAPS_API_KEY) {
    return res.status(503).json({ mensaje: 'El servicio de rutas no está configurado.' });
  }

  try {
    const coordenadasSeleccionadasSonValidas = (coordinates) => Array.isArray(coordinates) && coordinates.length === 2 && inCaba(coordinates);
    const [origenBuscado, destinoBuscado] = await Promise.all([
      coordenadasSeleccionadasSonValidas(origenCoordenadas) ? null : geocodificarEnCaba(origen, process.env.OPENROUTESERVICE_API_KEY),
      coordenadasSeleccionadasSonValidas(destinoCoordenadas) ? null : geocodificarEnCaba(destino, process.env.OPENROUTESERVICE_API_KEY),
    ]);
    const origenResuelto = origenBuscado || { coordinates: origenCoordenadas, label: origen, confidence: null };
    const destinoResuelto = destinoBuscado || { coordinates: destinoCoordenadas, label: destino, confidence: null };
    if (!origenResuelto || !destinoResuelto) {
      return res.status(404).json({ mensaje: 'No encontramos una de las direcciones dentro de CABA. Probá agregando calle y altura.' });
    }

    const route = await calcularRuta(origenResuelto.coordinates, destinoResuelto.coordinates);
    const distanciaKm = Number((route.distanceMeters / 1000).toFixed(2)); // metros → km
    const duracionMin = Math.max(1, Math.round(route.durationSeconds / 60)); // segundos → min
    return res.json({
      mensaje: 'Viaje calculado correctamente',
      ruta: { distanciaKm, duracionMin, perfil: 'driving-car', proveedor: route.provider },
      origen: origenResuelto,
      destino: destinoResuelto,
      opciones: crearOpciones({ distanciaKm, duracionMin }),
    });
  } catch (error) {
    const status = error.code === 'ECONNABORTED' ? 504 : error.response?.status === 429 ? 429 : 502;
    console.error('Error ORS:', error.response?.data || error.message);
    return res.status(status).json({
      mensaje: status === 429 ? 'El servicio de rutas alcanzó su límite temporal. Intentá nuevamente en unos segundos.' : 'No pudimos calcular la ruta en este momento.',
      codigo: error.code || error.response?.status || 'ORS_ERROR',
    });
  }
}

module.exports = { calcularViaje, buscarSugerencias, crearOpciones };
