const express = require('express');

const router = express.Router();

const {
  calcularViaje,
  buscarSugerencias,
} = require('../controllers/routeController');

router.get('/direcciones/sugerencias', buscarSugerencias);
router.post('/calcular-viaje', calcularViaje);

module.exports = router;
