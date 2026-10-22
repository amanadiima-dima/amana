const express = require('express');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const { sendOtp, verifyOtp, completeRegistration, refreshToken, logout } = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');

const router = express.Router();

// Per-phone throttles (SMS cost / pumping abuse and OTP brute force).
// Relaxed under the dev OTP bypass so manual testing isn't blocked; tunable via env.
const devBypass = process.env.NODE_ENV === 'development' && process.env.OTP_BYPASS === 'true';
const byPhone = (req) => String(req.body?.phone || req.ip);
const sendOtpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: parseInt(process.env.OTP_SEND_LIMIT || (devBypass ? '1000' : '5'), 10),
  keyGenerator: byPhone,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many codes requested for this number. Try again in a few minutes.' },
});
const verifyOtpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: parseInt(process.env.OTP_VERIFY_LIMIT || (devBypass ? '1000' : '5'), 10),
  keyGenerator: byPhone,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many wrong codes. Try again in a few minutes.' },
});

// E.164: leading "+", 8–15 digits total. More reliable than isMobilePhone(),
// which rejects many valid international numbers (and all test numbers).
const phoneValidator = body('phone')
  .matches(/^\+[1-9]\d{7,14}$/)
  .withMessage('Phone must be in international format, e.g. +33612345678');

router.post('/send-otp',
  sendOtpLimiter,
  [phoneValidator],
  validate,
  sendOtp
);

router.post('/verify-otp',
  verifyOtpLimiter,
  [
    phoneValidator,
    body('code').isLength({ min: 6, max: 6 }),
  ],
  validate,
  verifyOtp
);

router.post('/complete-registration',
  [body('registrationToken').isString(), body('name').isString().trim().isLength({ min: 2, max: 60 })],
  validate,
  completeRegistration
);

router.post('/refresh', refreshToken);
router.post('/logout', authenticate, logout);

module.exports = router;
