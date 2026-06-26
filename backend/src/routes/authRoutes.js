const express = require('express');
const { login, register, obtenerPerfil } = require('../controllers/authController');
const { requireAuth } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', requireAuth, obtenerPerfil);

module.exports = router;
