const express = require('express');
const {
  guardarViaje,
  obtenerViajes,
  obtenerViajesPorUsuario,
  obtenerStatsViajes,
} = require('../controllers/viajeController');
const { requireAuth } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/viaje', requireAuth, guardarViaje);
router.get('/viajes', requireAuth, obtenerViajes);
router.get('/mis-viajes', requireAuth, obtenerViajesPorUsuario);
router.get('/mis-viajes/stats', requireAuth, obtenerStatsViajes);
router.get('/viajes/usuario/:idUsuario', requireAuth, obtenerViajesPorUsuario);

module.exports = router;
