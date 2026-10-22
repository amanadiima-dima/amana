const twilio = require('twilio');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const { AppError } = require('../middlewares/error.middleware');
const logger = require('../utils/logger');
const { claimInvitedBookings } = require('../services/bookingFlow.service');

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

// Issue tokens for a user and link any payment requests that were sent to this phone before it had an account.
const sendSession = async (res, user) => {
  if (user.isActive === false) throw new AppError('This account has been disabled. Contact support if you think this is a mistake.', 403);
  await claimInvitedBookings(user).catch((e) => logger.warn('claimInvitedBookings failed', { error: e.message }));
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
      role: user.role,
    },
  });
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

    // The server decides whether this is a login or a sign-up: no "I'm new" checkbox needed.
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) return await sendSession(res, existing);

    const cleanName = String(name || '').trim();
    if (cleanName.length < 2) {
      // New number: the code is verified, we only need a name. Short-lived token proves the phone
      // was verified (a verified OTP can't be checked twice), so the name step can't be skipped or forged.
      const registrationToken = jwt.sign({ typ: 'register', phone }, process.env.JWT_SECRET, { expiresIn: '15m' });
      return res.json({ success: true, needsProfile: true, registrationToken });
    }
    const created = await prisma.user.create({ data: { phone, name: cleanName.slice(0, 60) } });
    return await sendSession(res, created);
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/complete-registration  body: { registrationToken, name, acceptTerms: true }
const completeRegistration = async (req, res, next) => {
  try {
    let decoded;
    try {
      decoded = jwt.verify(String(req.body.registrationToken || ''), process.env.JWT_SECRET);
    } catch {
      throw new AppError('Your verification expired — please request a new code', 400);
    }
    if (decoded.typ !== 'register' || !decoded.phone) throw new AppError('Invalid registration token', 400);
    if (req.body.acceptTerms !== true) throw new AppError('You must be 18 or older and accept the Terms and Privacy Policy', 400);

    const phone = decoded.phone;
    let user = await prisma.user.findUnique({ where: { phone } });
    if (!user) user = await prisma.user.create({ data: { phone, name: String(req.body.name).trim().slice(0, 60), termsAcceptedAt: new Date() } });
    return await sendSession(res, user);
  } catch (err) { next(err); }
};

// POST /api/auth/refresh
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) throw new AppError('Refresh token required', 400);

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || !user.isActive) throw new AppError('User not found or inactive', 401);

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

module.exports = { sendOtp, verifyOtp, completeRegistration, refreshToken, logout };
