const express = require('express');
const {
  login,
  register,
  forgotPassword,
  resetPassword,
  socialLogin,
  obtenerPerfil,
} = require('../controllers/authController');
const { requireAuth } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/social-login', socialLogin);
router.get('/me', requireAuth, obtenerPerfil);

module.exports = router;
