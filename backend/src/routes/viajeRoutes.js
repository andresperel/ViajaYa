const express = require('express');
const {
  guardarViaje,
  obtenerViajes,
  obtenerViajesPorUsuario,
  obtenerStatsViajes,
  verificarViaje,
  vincularViajeUber,
} = require('../controllers/viajeController');
const { requireAuth } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/viaje', requireAuth, guardarViaje);
router.get('/viajes', requireAuth, obtenerViajes);
router.get('/mis-viajes', requireAuth, obtenerViajesPorUsuario);
router.get('/mis-viajes/stats', requireAuth, obtenerStatsViajes);
router.get('/viajes/usuario/:idUsuario', requireAuth, obtenerViajesPorUsuario);
router.get('/viaje/:idViaje/verificar', requireAuth, verificarViaje);
router.post('/viaje/:idViaje/uber', requireAuth, vincularViajeUber);

module.exports = router;
