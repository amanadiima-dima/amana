const prisma = require('../utils/prisma');
const { AppError } = require('../middlewares/error.middleware');
const { signedUrl } = require('../utils/cloudinary');
const { STUBBED } = require('../utils/stripeStub');
const { releasePayment, refundPayment } = require('../services/payment.service');
const { notifyUsers } = require('./../services/notify.service');

const audit = (actorId, action, targetType, targetId, note) =>
  prisma.auditLog.create({ data: { actorId, action, targetType, targetId, note: note ? String(note).slice(0, 300) : null } }).catch(() => {});

const listUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 500 } = req.query;
    const users = await prisma.user.findMany({
      skip: (page - 1) * limit,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      select: { id: true, phone: true, name: true, role: true, isVerified: true, isActive: true, rating: true, createdAt: true },
    });
    res.json({ success: true, users });
  } catch (err) { next(err); }
};

const listPendingVerifications = async (req, res, next) => {
  try {
    const verifications = await prisma.idVerification.findMany({
      where: { status: 'PENDING' },
      include: { user: { select: { id: true, name: true, phone: true } } },
      orderBy: { createdAt: 'asc' },
    });
    // Sensitive media is private: hand the reviewer signed links (or the dev-local URL).
    res.json({
      success: true,
      verifications: verifications.map((v) => ({
        ...v,
        frontPhoto: signedUrl(v.frontPhoto),
        backPhoto: signedUrl(v.backPhoto),
        selfieVideo: signedUrl(v.selfieVideo),
      })),
    });
  } catch (err) { next(err); }
};

const reviewVerification = async (req, res, next) => {
  try {
    const { status, reviewNote } = req.body;
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      throw new AppError('Status must be APPROVED or REJECTED', 400);
    }

    const verification = await prisma.idVerification.update({
      where: { id: req.params.id },
      data: { status, reviewNote },
    });

    if (status === 'APPROVED') {
      await prisma.user.update({ where: { id: verification.userId }, data: { isVerified: true } });
    }
    await audit(req.user.id, `VERIFICATION_${status}`, 'IdVerification', verification.id, reviewNote);
    await notifyUsers([verification.userId], status === 'APPROVED' ? 'Your identity is verified ✓' : 'Your ID verification was not approved', status === 'APPROVED' ? 'You can now post trips and parcels.' : (reviewNote || 'Please upload clearer photos and a new selfie video.'), { type: 'ID_REVIEW' });

    res.json({ success: true, verification });
  } catch (err) { next(err); }
};

const listDisputes = async (req, res, next) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { status: 'DISPUTED' },
      orderBy: { disputedAt: 'asc' },
      include: {
        trip: { include: { traveler: { select: { id: true, name: true, phone: true } } } },
        parcelRequest: { select: { description: true, weightKg: true, estimatedValue: true, valueCurrency: true, sender: { select: { id: true, name: true, phone: true } } } },
        payment: { select: { status: true, grossAmount: true, travelerAmount: true, currency: true } },
        trackingEvents: { orderBy: { createdAt: 'asc' }, select: { status: true, note: true, photoUrl: true, createdAt: true } },
        messages: { orderBy: { createdAt: 'asc' }, take: 30, select: { body: true, createdAt: true, sender: { select: { name: true } } } },
      },
    });
    res.json({ success: true, disputes: bookings });
  } catch (err) { next(err); }
};

// PATCH /api/admin/disputes/:id  body: { resolution: 'REFUND' | 'RELEASE' }
const resolveDispute = async (req, res, next) => {
  try {
    const { resolution } = req.body;
    if (!['REFUND', 'RELEASE'].includes(resolution)) throw new AppError('resolution must be REFUND or RELEASE', 400);
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { payment: true, trip: true },
    });
    if (!booking) throw new AppError('Booking not found', 404);
    if (booking.status !== 'DISPUTED') throw new AppError('This booking is not under dispute', 400);

    if (resolution === 'REFUND') {
      if (booking.payment?.status === 'HELD') await refundPayment(booking.payment);
      await prisma.booking.update({ where: { id: booking.id }, data: { status: 'CANCELLED', disputeOutcome: 'REFUNDED' } });
    } else {
      if (booking.payment?.status === 'HELD') await releasePayment(booking.payment);
      await prisma.booking.update({ where: { id: booking.id }, data: { status: 'COMPLETED', disputeOutcome: 'RELEASED' } });
    }
    await audit(req.user.id, resolution === 'REFUND' ? 'DISPUTE_REFUND' : 'DISPUTE_RELEASE', 'Booking', booking.id);
    const route = `${booking.trip.originCity} → ${booking.trip.destinationCity}`;
    await notifyUsers(
      [booking.senderId, booking.payerId, booking.trip.travelerId],
      'Dispute resolved',
      resolution === 'REFUND' ? `${route}: the sender was refunded in full.` : `${route}: the payment was released to the traveler.`,
      { bookingId: booking.id, type: 'DISPUTE_RESOLVED' }
    );
    res.json({ success: true });
  } catch (err) { next(err); }
};

// ── Team management (admin only) ─────────────────────────────────────────────
const listStaff = async (_req, res, next) => {
  try {
    const staff = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'MODERATOR'] } },
      select: { id: true, name: true, phone: true, role: true },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
    });
    res.json({ success: true, staff });
  } catch (err) { next(err); }
};

// POST /api/admin/staff  body: { phone } — gives an existing user moderator access.
const addStaff = async (req, res, next) => {
  try {
    const phone = String(req.body.phone || '').trim();
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) throw new AppError('No Amana user with that phone — ask them to sign up first', 404);
    if (user.role === 'ADMIN') throw new AppError('That user is already an admin', 400);
    if (user.role === 'MODERATOR') throw new AppError('That user is already a moderator', 400);
    await prisma.user.update({ where: { id: user.id }, data: { role: 'MODERATOR' } });
    await audit(req.user.id, 'STAFF_ADDED', 'User', user.id, user.phone);
    await notifyUsers([user.id], 'You were given moderator access', 'You can now review ID verifications and disputes from the Admin panel.', { type: 'STAFF' });
    res.status(201).json({ success: true });
  } catch (err) { next(err); }
};

// DELETE /api/admin/staff/:userId — takes moderator access away.
const removeStaff = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.userId } });
    if (!user) throw new AppError('User not found', 404);
    if (user.role !== 'MODERATOR') throw new AppError('Only moderators can be removed here', 400);
    await prisma.user.update({ where: { id: user.id }, data: { role: 'SENDER' } });
    await audit(req.user.id, 'STAFF_REMOVED', 'User', user.id, user.phone);
    await notifyUsers([user.id], 'Your moderator access was removed', 'You can still use Amana as usual.', { type: 'STAFF' });
    res.json({ success: true });
  } catch (err) { next(err); }
};

const listActivity = async (_req, res, next) => {
  try {
    const rows = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
    const actors = await prisma.user.findMany({ where: { id: { in: [...new Set(rows.map((r) => r.actorId))] } }, select: { id: true, name: true } });
    const names = Object.fromEntries(actors.map((a) => [a.id, a.name]));
    res.json({ success: true, activity: rows.map((r) => ({ ...r, actorName: names[r.actorId] || '—' })) });
  } catch (err) { next(err); }
};

// ── User management (admin only) ─────────────────────────────────────────────
const ACTIVE_STATUSES = ['PAYMENT_PENDING', 'PENDING', 'ACCEPTED', 'DISPUTED'];
const guardTarget = async (req) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw new AppError('User not found', 404);
  if (user.id === req.user.id) throw new AppError('You cannot do this to your own account', 400);
  if (['ADMIN', 'MODERATOR'].includes(user.role)) throw new AppError('Remove their staff access in the Team tab first', 400);
  return user;
};
const involvedBookings = (id) => ({ OR: [{ senderId: id }, { payerId: id }, { trip: { travelerId: id } }] });

// PATCH /api/admin/users/:id/active  body: { active: boolean } — reversible: a disabled account can't sign in.
const setUserActive = async (req, res, next) => {
  try {
    const user = await guardTarget(req);
    const active = req.body.active === true;
    await prisma.user.update({ where: { id: user.id }, data: { isActive: active } });
    await audit(req.user.id, active ? 'USER_REACTIVATED' : 'USER_DEACTIVATED', 'User', user.id, user.phone);
    res.json({ success: true });
  } catch (err) { next(err); }
};

// DELETE /api/admin/users/:id  body: { confirmPhone } — permanent. For test/seed cleanup and erasure requests.
const deleteUser = async (req, res, next) => {
  try {
    const user = await guardTarget(req);
    if (String(req.body.confirmPhone || '').trim() !== user.phone) throw new AppError('Type the exact phone number to confirm', 400);

    const active = await prisma.booking.count({ where: { ...involvedBookings(user.id), status: { in: ACTIVE_STATUSES } } });
    if (active > 0) throw new AppError(`This user has ${active} active booking(s) — resolve or cancel them first`, 409);
    const bookings = await prisma.booking.findMany({ where: involvedBookings(user.id), select: { id: true } });
    const ids = bookings.map((b) => b.id);
    if (!STUBBED) {
      const real = await prisma.payment.count({ where: { bookingId: { in: ids } } });
      if (real > 0) throw new AppError('This user has real payment records that must be kept — disable the account instead', 409);
    }

    // Ratings of the people they reviewed / were reviewed by must be recomputed afterwards.
    const reviews = await prisma.review.findMany({ where: { OR: [{ reviewerId: user.id }, { revieweeId: user.id }, { bookingId: { in: ids } }] }, select: { id: true, revieweeId: true } });
    const affected = [...new Set(reviews.map((r) => r.revieweeId))].filter((x) => x !== user.id);

    await prisma.$transaction([
      prisma.review.deleteMany({ where: { id: { in: reviews.map((r) => r.id) } } }),
      prisma.message.deleteMany({ where: { OR: [{ bookingId: { in: ids } }, { senderId: user.id }] } }),
      prisma.trackingEvent.deleteMany({ where: { bookingId: { in: ids } } }),
      prisma.payment.deleteMany({ where: { bookingId: { in: ids } } }),
      prisma.booking.deleteMany({ where: { id: { in: ids } } }),
      prisma.notification.deleteMany({ where: { userId: user.id } }),
      prisma.trip.deleteMany({ where: { travelerId: user.id } }),
      prisma.parcelRequest.deleteMany({ where: { senderId: user.id } }),
      prisma.idVerification.deleteMany({ where: { userId: user.id } }),
      prisma.outboundMessage.deleteMany({ where: { toPhone: user.phone } }),
      prisma.user.delete({ where: { id: user.id } }),
    ]);

    for (const uid of affected) {
      const agg = await prisma.review.aggregate({ where: { revieweeId: uid }, _avg: { rating: true }, _count: { _all: true } });
      await prisma.user.update({ where: { id: uid }, data: { rating: agg._avg.rating || 0, reviewCount: agg._count._all } }).catch(() => {});
    }
    await audit(req.user.id, 'USER_DELETED', 'User', user.id, `${user.name} ${user.phone}`);
    res.json({ success: true });
  } catch (err) { next(err); }
};

module.exports = { setUserActive, deleteUser, listStaff, addStaff, removeStaff, listActivity, listDisputes, resolveDispute, listUsers, listPendingVerifications, reviewVerification };
