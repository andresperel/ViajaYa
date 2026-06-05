const axios = require('axios');

let tokenGuardado = null;
let tokenExpiraEn = null;

// Esta función pide un access token a Uber usando client credentials.
const obtenerTokenUber = async () => {
  const ahora = Date.now();

  if (tokenGuardado && tokenExpiraEn && ahora < tokenExpiraEn) {
    return tokenGuardado;
  }

  const respuesta = await axios.post(
    `${process.env.UBER_LOGIN_URL}/oauth/v2/token`,
    new URLSearchParams({
      client_id: process.env.UBER_CLIENT_ID,
      client_secret: process.env.UBER_CLIENT_SECRET,
      grant_type: 'client_credentials',
      scope: process.env.UBER_SCOPE,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  tokenGuardado = respuesta.data.access_token;
  tokenExpiraEn = Date.now() + (respuesta.data.expires_in - 60) * 1000;

  return tokenGuardado;
};

// Esta función pide estimaciones de viaje a Uber Guest Rides.
const obtenerEstimacionUber = async (req, res) => {
  try {
    const {
      pickup,
      dropoff,
    } = req.body;

    if (!pickup || !dropoff) {
      return res.status(400).json({
        mensaje: 'Faltan coordenadas de origen o destino',
      });
    }

    const tokenUber = await obtenerTokenUber();

    const respuestaUber = await axios.post(
      `${process.env.UBER_BASE_URL}/v1/guests/trips/estimates`,
      {
        pickup: pickup,
        dropoff: dropoff,
      },
      {
        headers: {
          Authorization: `Bearer ${tokenUber}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return res.status(200).json({
      mensaje: 'Estimación obtenida desde Uber',
      datos: respuestaUber.data,
    });

  } catch (error) {
    console.log('Error Uber:', error.response?.data || error.message);

    return res.status(500).json({
      mensaje: 'Error al consultar Uber',
      detalle: error.response?.data || error.message,
    });
  }
};

module.exports = {
  obtenerEstimacionUber,
};