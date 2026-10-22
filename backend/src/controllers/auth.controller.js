const twilio = require('twilio');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
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

const devBypass = () => process.env.NODE_ENV === 'development' && process.env.OTP_BYPASS === 'true';

// Sends a one-time code to the phone (Twilio Verify): SMS, or WhatsApp for countries where SMS is restricted.
const sendCode = async (phone) => {
  if (devBypass()) {
    logger.info(`[DEV] OTP bypass enabled — use code 123456 for ${phone}`);
    return 'dev';
  }
  try {
    await twilioClient.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID).verifications.create({ to: phone, channel: 'sms' });
    return 'sms';
  } catch (smsErr) {
    const msg = smsErr?.message || '';
    if (msg.includes('restricted country') || msg.includes('blocked') || msg.includes('not supported')) {
      await twilioClient.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID).verifications.create({ to: phone, channel: 'whatsapp' });
      return 'whatsapp';
    }
    throw smsErr;
  }
};

const checkCode = async (phone, code) => {
  if (devBypass()) {
    if (code !== '123456') throw new AppError('Invalid code (dev bypass: use 123456)', 400);
    return;
  }
  const check = await twilioClient.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID).verificationChecks.create({ to: phone, code });
  if (check.status !== 'approved') throw new AppError('Invalid or expired code', 400);
};

const normEmail = (email) => (email ? String(email).trim().toLowerCase() : null);
const findByIdentifier = (identifier) => {
  const id = String(identifier || '').trim();
  return id.includes('@')
    ? prisma.user.findUnique({ where: { email: id.toLowerCase() } })
    : prisma.user.findUnique({ where: { phone: id.replace(/[\s().-]/g, '') } });
};
const phoneHint = (phone) => `•••• ${phone.slice(-4)}`;

// Wrong passwords per identifier: 5 tries, then locked for 15 minutes (on top of the per-IP limits).
const passwordFails = new Map();
const MAX_PASSWORD_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;
const checkLock = (key) => {
  const f = passwordFails.get(key);
  if (f && f.count >= MAX_PASSWORD_FAILS && Date.now() - f.at < LOCK_MS) throw new AppError('Too many wrong passwords. Try again in 15 minutes or reset your password.', 429);
};
const recordFail = (key) => {
  const f = passwordFails.get(key);
  passwordFails.set(key, { count: f && Date.now() - f.at < LOCK_MS ? f.count + 1 : 1, at: Date.now() });
};

const assertNewAccount = async ({ phone, email }) => {
  if (await prisma.user.findUnique({ where: { phone } })) throw new AppError('This phone number already has an account — sign in instead', 409);
  if (email && (await prisma.user.findUnique({ where: { email } }))) throw new AppError('This email is already used by another account', 409);
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
      email: user.email,
      name: user.name,
      isVerified: user.isVerified,
      rating: user.rating,
      role: user.role,
    },
  });
};

// POST /api/auth/register  body: { name, phone, email?, password, acceptTerms: true }
// Checks the details and texts a code to the phone; the account is created by /register/verify.
const register = async (req, res, next) => {
  try {
    if (req.body.acceptTerms !== true) throw new AppError('You must be 18 or older and accept the Terms and Privacy Policy', 400);
    const phone = req.body.phone;
    await assertNewAccount({ phone, email: normEmail(req.body.email) });
    const channel = await sendCode(phone);
    res.json({ success: true, channel });
  } catch (err) { next(err); }
};

// POST /api/auth/register/verify  body: same as /register + { code } — proves the phone and creates the account.
const registerVerify = async (req, res, next) => {
  try {
    if (req.body.acceptTerms !== true) throw new AppError('You must be 18 or older and accept the Terms and Privacy Policy', 400);
    const { phone, code, password } = req.body;
    const email = normEmail(req.body.email);
    await assertNewAccount({ phone, email });
    await checkCode(phone, code);
    const user = await prisma.user.create({
      data: { phone, email, name: String(req.body.name).trim().slice(0, 60), passwordHash: await bcrypt.hash(password, 10), termsAcceptedAt: new Date() },
    }).catch((e) => { throw e.code === 'P2002' ? new AppError('This phone number or email already has an account', 409) : e; });
    return await sendSession(res, user);
  } catch (err) { next(err); }
};

// POST /api/auth/login  body: { identifier (email or phone), password }
// Step 1 of 2: a correct password texts a code to the account's phone; the session comes from /login/verify.
const login = async (req, res, next) => {
  try {
    const key = String(req.body.identifier).trim().toLowerCase();
    checkLock(key);
    const user = await findByIdentifier(req.body.identifier);
    const ok = user?.passwordHash && !user.deletedAt && (await bcrypt.compare(String(req.body.password), user.passwordHash));
    if (!ok) {
      recordFail(key);
      throw new AppError('Wrong email/phone or password', 401);
    }
    passwordFails.delete(key);
    if (!user.isActive) throw new AppError('This account has been disabled. Contact support if you think this is a mistake.', 403);
    const channel = await sendCode(user.phone);
    const loginToken = jwt.sign({ typ: 'login', userId: user.id }, process.env.JWT_SECRET, { expiresIn: '10m' });
    res.json({ success: true, loginToken, phoneHint: phoneHint(user.phone), channel });
  } catch (err) { next(err); }
};

// POST /api/auth/login/verify  body: { loginToken, code }
const loginVerify = async (req, res, next) => {
  try {
    let decoded;
    try {
      decoded = jwt.verify(String(req.body.loginToken || ''), process.env.JWT_SECRET);
    } catch {
      throw new AppError('Your sign-in expired — please enter your password again', 400);
    }
    if (decoded.typ !== 'login') throw new AppError('Invalid sign-in token', 400);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) throw new AppError('Account not found', 404);
    await checkCode(user.phone, req.body.code);
    return await sendSession(res, user);
  } catch (err) { next(err); }
};

// POST /api/auth/password/forgot  body: { identifier }
// Always answers the same way, so it can't be used to find out who has an account.
const forgotPassword = async (req, res, next) => {
  try {
    const user = await findByIdentifier(req.body.identifier);
    if (user && user.isActive && !user.deletedAt) await sendCode(user.phone);
    res.json({ success: true });
  } catch (err) { next(err); }
};

// POST /api/auth/password/reset  body: { identifier, code, password } — sets the new password and signs in.
// Also how accounts created before passwords existed get their first one.
const resetPassword = async (req, res, next) => {
  try {
    const user = await findByIdentifier(req.body.identifier);
    if (!user || user.deletedAt) throw new AppError('Invalid or expired code', 400);
    await checkCode(user.phone, req.body.code);
    const updated = await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(req.body.password, 10) } });
    passwordFails.delete(String(req.body.identifier).trim().toLowerCase());
    return await sendSession(res, updated);
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

module.exports = { register, registerVerify, login, loginVerify, forgotPassword, resetPassword, refreshToken, logout };
