const axios = require('axios');

// Esta función calcula distancia, duración y precios estimados.
const calcularViaje = async (req, res) => {
  try {
    const { origen, destino } = req.body;

    if (!origen || !destino) {
      return res.status(400).json({
        mensaje: 'Faltan origen o destino',
      });
    }

    // Busco coordenadas del origen.
    const respuestaOrigen = await axios.get(
      'https://api.openrouteservice.org/geocode/search',
      {
        params: {
          api_key: process.env.OPENROUTESERVICE_API_KEY,
          text: origen,
          'boundary.country': 'AR',
        },
      }
    );

    // Busco coordenadas del destino.
    const respuestaDestino = await axios.get(
      'https://api.openrouteservice.org/geocode/search',
      {
        params: {
          api_key: process.env.OPENROUTESERVICE_API_KEY,
          text: destino,
          'boundary.country': 'AR',
        },
      }
    );

    const coordenadasOrigen = respuestaOrigen.data.features[0]?.geometry.coordinates;
    const coordenadasDestino = respuestaDestino.data.features[0]?.geometry.coordinates;

    if (!coordenadasOrigen || !coordenadasDestino) {
      return res.status(404).json({
        mensaje: 'No pude encontrar origen o destino',
      });
    }

    // Calculo la ruta en auto.
    const respuestaRuta = await axios.post(
      'https://api.openrouteservice.org/v2/directions/driving-car',
      {
        coordinates: [
          coordenadasOrigen,
          coordenadasDestino,
        ],
      },
      {
        headers: {
          Authorization: process.env.OPENROUTESERVICE_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const resumen = respuestaRuta.data.routes[0].summary;

    const distanciaKm = Number((resumen.distance / 1000).toFixed(2));
    const duracionMin = Math.round(resumen.duration / 60);

    // Motor propio de estimación de precios.
    const precioDidi = Math.round(850 + distanciaKm * 420 + duracionMin * 35);
    const precioUber = Math.round(950 + distanciaKm * 450 + duracionMin * 40);
    const precioCabify = Math.round(1100 + distanciaKm * 470 + duracionMin * 45);

    return res.status(200).json({
      mensaje: 'Viaje calculado correctamente',
      origenEncontrado: respuestaOrigen.data.features[0].properties.label,
      destinoEncontrado: respuestaDestino.data.features[0].properties.label,
      distanciaKm,
      duracionMin,
      opciones: [
        {
          empresa: 'Didi',
          tipo: 'Express',
          precio: precioDidi,
          tiempoEstimado: duracionMin,
          idTipoServicio: 2,
        },
        {
          empresa: 'Uber',
          tipo: 'UberX',
          precio: precioUber,
          tiempoEstimado: duracionMin,
          idTipoServicio: 1,
        },
        {
          empresa: 'Cabify',
          tipo: 'Lite',
          precio: precioCabify,
          tiempoEstimado: duracionMin,
          idTipoServicio: 3,
        },
      ],
    });

  } catch (error) {
    console.log('Error al calcular viaje:', error.response?.data || error.message);

    return res.status(500).json({
      mensaje: 'Error al calcular el viaje',
      detalle: error.response?.data || error.message,
    });
  }
};

module.exports = {
  calcularViaje,
};