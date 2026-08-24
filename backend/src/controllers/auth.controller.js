const twilio = require('twilio');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const { AppError } = require('../middlewares/error.middleware');
const logger = require('../utils/logger');

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });
  return { accessToken, refreshToken };
};

// POST /api/auth/send-otp
const sendOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;

    // Dev bypass: skip Twilio, accept fixed code "123456"
    if (process.env.NODE_ENV === 'development' && process.env.OTP_BYPASS === 'true') {
      logger.info(`[DEV] OTP bypass enabled — use code 123456 for ${phone}`);
      return res.json({ success: true, message: 'OTP sent (dev bypass: use 123456)', dev: true });
    }

    // Try SMS first, fall back to WhatsApp for restricted countries
    try {
      await twilioClient.verify.v2
        .services(process.env.TWILIO_VERIFY_SERVICE_SID)
        .verifications.create({ to: phone, channel: 'sms' });
    } catch (smsErr) {
      const msg = smsErr?.message || '';
      if (msg.includes('restricted country') || msg.includes('blocked') || msg.includes('not supported')) {
        // Fallback to WhatsApp channel
        await twilioClient.verify.v2
          .services(process.env.TWILIO_VERIFY_SERVICE_SID)
          .verifications.create({ to: phone, channel: 'whatsapp' });
        return res.json({ success: true, message: 'OTP sent via WhatsApp', channel: 'whatsapp' });
      }
      throw smsErr;
    }

    res.json({ success: true, message: 'OTP sent' });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/verify-otp
const verifyOtp = async (req, res, next) => {
  try {
    const { phone, code, name } = req.body;

    // Dev bypass: accept fixed code "123456"
    if (process.env.NODE_ENV === 'development' && process.env.OTP_BYPASS === 'true') {
      if (code !== '123456') throw new AppError('Invalid OTP (dev bypass: use 123456)', 400);
    } else {
      const check = await twilioClient.verify.v2
        .services(process.env.TWILIO_VERIFY_SERVICE_SID)
        .verificationChecks.create({ to: phone, code });

      if (check.status !== 'approved') {
        throw new AppError('Invalid or expired OTP', 400);
      }
    }

    // Upsert user (register on first login)
    const user = await prisma.user.upsert({
      where: { phone },
      update: {},
      create: {
        phone,
        name: name || phone,
      },
    });

    const { accessToken, refreshToken } = generateTokens(user.id);

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        isVerified: user.isVerified,
        rating: user.rating,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/refresh
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) throw new AppError('Refresh token required', 400);

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) throw new AppError('User not found', 404);

    const tokens = generateTokens(user.id);
    res.json({ success: true, ...tokens });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new AppError('Invalid or expired refresh token', 401));
    }
    next(err);
  }
};

// POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    // Clear FCM token on logout so user stops receiving push notifications
    await prisma.user.update({
      where: { id: req.user.id },
      data: { fcmToken: null },
    });
    res.json({ success: true, message: 'Logged out' });
  } catch (err) {
    next(err);
  }
};

module.exports = { sendOtp, verifyOtp, refreshToken, logout };
