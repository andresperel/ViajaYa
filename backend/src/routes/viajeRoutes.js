const express = require('express');

const router = express.Router();

const {
  guardarViaje,
  obtenerViajes,
  obtenerViajesPorUsuario,
} = require('../controllers/viajeController');

router.post('/viaje', guardarViaje);

router.get('/viajes', obtenerViajes);

router.get('/viajes/usuario/:idUsuario', obtenerViajesPorUsuario);

module.exports = router;