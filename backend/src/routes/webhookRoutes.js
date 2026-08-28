const express = require('express');
const { recibirWebhookUber } = require('../controllers/webhookController');

const router = express.Router();
router.get('/webhooks/uber', (req, res) => {
  res.status(200).json({
    estado: 'ok',
    webhook: 'uber',
    mensaje: 'Endpoint activo. Los eventos de Uber se reciben mediante POST firmado.',
  });
});
router.post('/webhooks/uber', recibirWebhookUber);

module.exports = router;
