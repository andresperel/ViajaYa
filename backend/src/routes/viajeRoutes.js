const express = require('express');
const {
  guardarViaje,
  obtenerViajes,
  obtenerViajesPorUsuario,
} = require('../controllers/viajeController');
const { requireAuth } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/viaje', requireAuth, guardarViaje);
router.get('/viajes', requireAuth, obtenerViajes);
router.get('/mis-viajes', requireAuth, obtenerViajesPorUsuario);
router.get('/viajes/usuario/:idUsuario', requireAuth, obtenerViajesPorUsuario);

module.exports = router;
