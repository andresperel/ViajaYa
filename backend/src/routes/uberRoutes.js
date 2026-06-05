const express = require('express');

const router = express.Router();

const {
  obtenerEstimacionUber,
} = require('../controllers/uberController');

router.post('/uber/estimate', obtenerEstimacionUber);

module.exports = router;