const express = require('express');

const router = express.Router();

const {
  guardarViaje,
  obtenerViajes,
} = require('../controllers/viajeController');

// Guarda un viaje.
router.post('/viaje', guardarViaje);

// Devuelve todos los viajes.
router.get('/viajes', obtenerViajes);

module.exports = router;