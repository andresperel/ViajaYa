const express = require('express');

const router = express.Router();

const {
  calcularViaje,
} = require('../controllers/routeController');

router.post('/calcular-viaje', calcularViaje);

module.exports = router;