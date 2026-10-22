const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const tripRoutes = require('./routes/trip.routes');
const parcelRoutes = require('./routes/parcel.routes');
const bookingRoutes = require('./routes/booking.routes');
const trackingRoutes = require('./routes/tracking.routes');
const paymentRoutes = require('./routes/payment.routes');
const reviewRoutes = require('./routes/review.routes');
const notificationRoutes = require('./routes/notification.routes');
const adminRoutes = require('./routes/admin.routes');
const inviteRoutes = require('./routes/invite.routes');
const { errorHandler } = require('./middlewares/error.middleware');
const { signMediaRefs } = require('./utils/cloudinary');

const app = express();

// Behind Railway's proxy: trust it so rate limits and logs see the real client IP.
if (process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT) app.set('trust proxy', 1);

// ── Security & parsing ────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : true,
  credentials: true,
}));

// Stripe webhooks need raw body – mount before json parser
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Locally-stored uploads (dev fallback when Cloudinary isn't configured)
app.use(
  '/uploads',
  express.static(path.join(__dirname, '..', 'uploads'), {
    setHeaders: (res) => res.set('Cross-Origin-Resource-Policy', 'cross-origin'),
  })
);

// Private media (ID documents, parcel/delivery photos) is stored without public URLs: every JSON
// response swaps those references for signed links, so no controller can leak a raw reference.
app.use((_req, res, next) => {
  const json = res.json.bind(res);
  res.json = (body) => json(signMediaRefs(body));
  next();
});

// ── Rate limiting ─────────────────────────────────────────────────────────────
// 100 req/15min per IP was too tight for real usage: the chat panel alone polls
// GET /bookings/:id/messages every 8s (~112 requests/15min on its own), so anyone
// with a chat open for ~13 minutes got locked out of the *entire* API, not just
// chat. Raised to a level that comfortably covers a few concurrent chats plus
// normal browsing from one person/IP, while still capping abuse.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX || '600', 10), // raise only in local dev (the e2e suite makes ~600 requests)
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/parcels', parcelRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/invites', inviteRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── Error handler (must be last) ──────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
