const express = require('express');
const { body } = require('express-validator');
const { createPaymentIntent, handleWebhook, getPayment } = require('../controllers/payment.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');

const router = express.Router();

// Stripe webhook (raw body, no auth)
router.post('/webhook', handleWebhook);

router.use(authenticate);

router.post('/intent',
  [body('bookingId').isString()],
  validate,
  createPaymentIntent
);

router.get('/:bookingId', getPayment);

module.exports = router;
