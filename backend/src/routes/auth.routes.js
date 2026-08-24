const express = require('express');
const { body } = require('express-validator');
const { sendOtp, verifyOtp, refreshToken, logout } = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');

const router = express.Router();

router.post('/send-otp',
  [body('phone').isMobilePhone()],
  validate,
  sendOtp
);

router.post('/verify-otp',
  [
    body('phone').isMobilePhone(),
    body('code').isLength({ min: 6, max: 6 }),
    body('name').optional().isString().trim(),
  ],
  validate,
  verifyOtp
);

router.post('/refresh', refreshToken);
router.post('/logout', authenticate, logout);

module.exports = router;
