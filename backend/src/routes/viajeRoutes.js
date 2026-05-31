const express = require('express');

const router = express.Router();

const { guardarViaje } = require('../controllers/viajeController');

router.post('/viaje', guardarViaje);

module.exports = router;