const express = require('express');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const { register, registerVerify, login, loginVerify, forgotPassword, resetPassword, refreshToken, logout } = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');

const router = express.Router();

// Per-phone/identifier throttles (SMS cost / pumping abuse and OTP brute force).
// Relaxed under the dev OTP bypass so manual testing isn't blocked; tunable via env.
const devBypass = process.env.NODE_ENV === 'development' && process.env.OTP_BYPASS === 'true';
const byPhone = (req) => String(req.body?.phone || req.body?.identifier || req.body?.loginToken || req.ip).trim().toLowerCase();
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

const password = body('password').isString().isLength({ min: 8, max: 128 }).withMessage('The password must have at least 8 characters');
const email = body('email').optional({ values: 'falsy' }).isEmail().withMessage('Enter a valid email address');
const code = body('code').isString().isLength({ min: 6, max: 6 });
const identifier = body('identifier').isString().trim().isLength({ min: 3, max: 120 });
const name = body('name').isString().trim().isLength({ min: 2, max: 60 }).withMessage('Enter your first name');
const lastName = body('lastName').isString().trim().isLength({ min: 1, max: 60 }).withMessage('Enter your last name');

// Sign-up: details → code to the phone → account.
router.post('/register', sendOtpLimiter, [name, lastName, phoneValidator, email, password], validate, register);
router.post('/register/verify', verifyOtpLimiter, [name, lastName, phoneValidator, email, password, code], validate, registerVerify);
// Sign-in: email or phone + password → code to the account's phone → session.
router.post('/login', verifyOtpLimiter, [identifier, body('password').isString().isLength({ min: 1, max: 128 })], validate, login);
router.post('/login/verify', verifyOtpLimiter, [body('loginToken').isString(), code], validate, loginVerify);
// Forgotten (or first) password: code to the account's phone → new password.
router.post('/password/forgot', sendOtpLimiter, [identifier], validate, forgotPassword);
router.post('/password/reset', verifyOtpLimiter, [identifier, code, password], validate, resetPassword);

router.post('/refresh', refreshToken);
router.post('/logout', authenticate, logout);

module.exports = router;
