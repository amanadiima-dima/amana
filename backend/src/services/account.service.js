// Personal-data lifecycle (GDPR): account closure, data export and the retention purge.
// The periods here are the ones published in the Privacy Policy (web/src/content/legal) — change both together.
const prisma = require('../utils/prisma');
const logger = require('../utils/logger');
const { AppError } = require('../middlewares/error.middleware');
const { destroyMedia } = require('../utils/cloudinary');

const DAY = 24 * 60 * 60 * 1000;
const RETENTION = {
  selfieVideoDays: 30,          // after the review: the video only proves the person matches the document
  rejectedDocsDays: 30,         // documents of a rejected verification
  legalClaimsYears: 5,          // ID documents + identity of a closed account, chats and photos of finished bookings
  notificationsDays: 365,
  outboundMessagesDays: 365,    // record of invitations sent by WhatsApp/SMS
  auditLogYears: 5,
};
const years = (n) => n * 365 * DAY;

const ACTIVE_STATUSES = ['PAYMENT_PENDING', 'PENDING', 'ACCEPTED', 'DISPUTED'];
const involvedBookings = (id) => ({ OR: [{ senderId: id }, { payerId: id }, { trip: { travelerId: id } }] });

// Nothing about a user is purged while an admin legal hold is set, the account is blocked by staff
// (not closed by the user) or one of their bookings is in dispute.
const isOnHold = async (user) => {
  if (user.legalHoldAt) return true;
  if (!user.isActive && !user.deletedAt) return true;
  return (await prisma.booking.count({ where: { ...involvedBookings(user.id), status: 'DISPUTED' } })) > 0;
};

const idMedia = (v) => (v ? [v.frontPhoto, v.backPhoto, v.selfieVideo] : []);

// Hard delete of a user who has no booking history worth keeping (or an admin cleanup). Removes every
// row tied to them and the uploaded files. Bookings are deleted too, so callers must check that none is active.
const hardDeleteUser = async (user) => {
  const bookings = await prisma.booking.findMany({ where: involvedBookings(user.id), select: { id: true } });
  const ids = bookings.map((b) => b.id);
  const [verification, parcels, events] = await Promise.all([
    prisma.idVerification.findUnique({ where: { userId: user.id } }),
    prisma.parcelRequest.findMany({ where: { senderId: user.id }, select: { photoUrls: true } }),
    prisma.trackingEvent.findMany({ where: { bookingId: { in: ids }, photoUrl: { not: null } }, select: { photoUrl: true } }),
  ]);

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
    prisma.outboundMessage.deleteMany({ where: { toPhone: { in: [user.phone, user.archivedPhone].filter(Boolean) } } }),
    prisma.user.delete({ where: { id: user.id } }),
  ]);

  await Promise.all([...idMedia(verification), ...parcels.flatMap((p) => p.photoUrls), ...events.map((e) => e.photoUrl)].map(destroyMedia));
  for (const uid of affected) {
    const agg = await prisma.review.aggregate({ where: { revieweeId: uid }, _avg: { rating: true }, _count: { _all: true } });
    await prisma.user.update({ where: { id: uid }, data: { rating: agg._avg.rating || 0, reviewCount: agg._count._all } }).catch(() => {});
  }
};

// Account closure requested by the user (right to erasure).
// - Never booked anything → everything is deleted now.
// - Has a booking history → the profile is anonymised now (other members see "Deleted user"); the real
//   name/phone and ID documents move to a staff-only archive kept for legal claims, purged at retainUntil.
const closeAccount = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.deletedAt) throw new AppError('Account not found', 404);
  if (['ADMIN', 'MODERATOR'].includes(user.role)) throw new AppError('Staff accounts must first be removed from the team by an admin', 400);
  const active = await prisma.booking.count({ where: { ...involvedBookings(user.id), status: { in: ACTIVE_STATUSES } } });
  if (active > 0) throw new AppError(`You have ${active} booking(s) in progress — finish or cancel them before closing your account`, 409);

  const history = await prisma.booking.findMany({ where: involvedBookings(user.id), select: { updatedAt: true }, orderBy: { updatedAt: 'desc' }, take: 1 });
  if (!history.length) {
    await hardDeleteUser(user);
    return { mode: 'deleted' };
  }

  const verification = await prisma.idVerification.findUnique({ where: { userId: user.id } });
  const looseParcels = await prisma.parcelRequest.findMany({ where: { senderId: user.id, bookings: { none: {} } }, select: { id: true, photoUrls: true } });
  const last = Math.max(history[0].updatedAt.getTime(), Date.now());

  await prisma.$transaction([
    prisma.trip.updateMany({ where: { travelerId: user.id, status: { in: ['OPEN', 'FULL'] } }, data: { status: 'CANCELLED' } }),
    prisma.parcelRequest.deleteMany({ where: { id: { in: looseParcels.map((p) => p.id) } } }),
    prisma.notification.deleteMany({ where: { userId: user.id } }),
    prisma.outboundMessage.deleteMany({ where: { toPhone: user.phone } }),
    ...(verification ? [prisma.idVerification.update({ where: { id: verification.id }, data: { selfieVideo: null, challengeCode: null } })] : []),
    prisma.user.update({
      where: { id: user.id },
      data: {
        name: 'Deleted user', phone: `deleted:${user.id}`, email: null, passwordHash: null, photoUrl: null, bio: null, fcmToken: null,
        isActive: false, deletedAt: new Date(), archivedName: user.name, archivedPhone: user.phone,
        retainUntil: new Date(last + years(RETENTION.legalClaimsYears)),
      },
    }),
  ]);
  await Promise.all([verification?.selfieVideo, ...looseParcels.flatMap((p) => p.photoUrls)].map(destroyMedia));
  return { mode: 'anonymised' };
};

// Right of access / portability: everything we hold about the user, as JSON.
const exportUserData = async (userId) => {
  const u = await prisma.user.findUnique({ where: { id: userId }, include: { idVerification: true } });
  const bookingInclude = {
    trip: { select: { originCity: true, destinationCity: true, departureAt: true, currency: true, pricePerKg: true } },
    parcelRequest: { select: { description: true, weightKg: true } },
    trackingEvents: { select: { status: true, note: true, photoUrl: true, createdAt: true } },
    payment: { select: { grossAmount: true, platformFee: true, travelerAmount: true, currency: true, status: true, paidAt: true, releasedAt: true, refundedAt: true } },
    messages: { select: { body: true, createdAt: true, sender: { select: { name: true } } }, orderBy: { createdAt: 'asc' } },
  };
  const [trips, parcels, bookings, reviewsGiven, reviewsReceived, notifications] = await Promise.all([
    prisma.trip.findMany({ where: { travelerId: userId } }),
    prisma.parcelRequest.findMany({ where: { senderId: userId } }),
    prisma.booking.findMany({ where: involvedBookings(userId), include: bookingInclude, orderBy: { createdAt: 'asc' } }),
    prisma.review.findMany({ where: { reviewerId: userId }, select: { rating: true, comment: true, createdAt: true, reviewee: { select: { name: true } } } }),
    prisma.review.findMany({ where: { revieweeId: userId }, select: { rating: true, comment: true, createdAt: true, reviewer: { select: { name: true } } } }),
    prisma.notification.findMany({ where: { userId }, select: { title: true, body: true, read: true, createdAt: true } }),
  ]);
  const v = u.idVerification;
  return {
    exportedAt: new Date(),
    profile: {
      id: u.id, phone: u.phone, email: u.email, name: u.name, bio: u.bio, photoUrl: u.photoUrl, role: u.role, isVerified: u.isVerified,
      rating: u.rating, reviewCount: u.reviewCount, createdAt: u.createdAt, termsAcceptedAt: u.termsAcceptedAt,
    },
    idVerification: v && {
      documentType: v.documentType, status: v.status, consentAt: v.consentAt, submittedAt: v.createdAt, reviewedAt: v.reviewedAt,
      reviewNote: v.reviewNote, files: { front: v.frontPhoto, back: v.backPhoto, selfieVideo: v.selfieVideo }, // signed links
    },
    trips, parcels,
    bookings: bookings.map(({ deliveryCode, inviteToken, ...b }) => b),
    reviewsGiven, reviewsReceived, notifications,
  };
};

// Daily retention purge. Idempotent; every step skips users on hold.
const runRetention = async () => {
  const now = Date.now();
  const stats = {};
  const heldCache = new Map();
  const held = async (userId) => {
    if (!heldCache.has(userId)) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      heldCache.set(userId, !user || (await isOnHold(user)));
    }
    return heldCache.get(userId);
  };

  // 1. Selfie videos 30 days after the review.
  const videos = await prisma.idVerification.findMany({ where: { selfieVideo: { not: null }, reviewedAt: { lt: new Date(now - RETENTION.selfieVideoDays * DAY) } } });
  stats.selfieVideos = 0;
  for (const v of videos) {
    if (await held(v.userId)) continue;
    await destroyMedia(v.selfieVideo);
    await prisma.idVerification.update({ where: { id: v.id }, data: { selfieVideo: null, challengeCode: null } });
    stats.selfieVideos++;
  }

  // 2. Rejected verifications: all documents after 30 days.
  const rejected = await prisma.idVerification.findMany({ where: { status: 'REJECTED', reviewedAt: { lt: new Date(now - RETENTION.rejectedDocsDays * DAY) } } });
  stats.rejectedVerifications = 0;
  for (const v of rejected) {
    if (await held(v.userId)) continue;
    await Promise.all(idMedia(v).map(destroyMedia));
    await prisma.idVerification.delete({ where: { id: v.id } });
    stats.rejectedVerifications++;
  }

  // 3. Closed accounts past their legal-claims period: ID documents and the archived identity go.
  const expired = await prisma.user.findMany({ where: { deletedAt: { not: null }, retainUntil: { lt: new Date(now) } } });
  stats.closedAccounts = 0;
  for (const user of expired) {
    if (await isOnHold(user)) continue;
    const v = await prisma.idVerification.findUnique({ where: { userId: user.id } });
    await Promise.all(idMedia(v).map(destroyMedia));
    await prisma.$transaction([
      prisma.idVerification.deleteMany({ where: { userId: user.id } }),
      prisma.user.update({ where: { id: user.id }, data: { archivedName: null, archivedPhone: null, retainUntil: null } }),
    ]);
    stats.closedAccounts++;
  }

  // 4. Finished bookings older than the legal-claims period: chat, delivery photos and parcel details.
  const oldCutoff = new Date(now - years(RETENTION.legalClaimsYears));
  const oldBookings = await prisma.booking.findMany({
    where: {
      status: { in: ['COMPLETED', 'CANCELLED', 'REJECTED'] }, updatedAt: { lt: oldCutoff },
      OR: [{ messages: { some: {} } }, { trackingEvents: { some: { photoUrl: { not: null } } } }, { parcelRequest: { pickupAddress: { not: '—' } } }],
    },
    select: { id: true, senderId: true, payerId: true, parcelRequestId: true, trip: { select: { travelerId: true } } },
  });
  stats.oldBookings = 0;
  for (const b of oldBookings) {
    const people = [b.senderId, b.payerId, b.trip.travelerId].filter(Boolean);
    if ((await Promise.all(people.map(held))).some(Boolean)) continue;
    const events = await prisma.trackingEvent.findMany({ where: { bookingId: b.id, photoUrl: { not: null } } });
    await Promise.all(events.map((e) => destroyMedia(e.photoUrl)));
    await prisma.$transaction([
      prisma.message.deleteMany({ where: { bookingId: b.id } }),
      prisma.trackingEvent.updateMany({ where: { bookingId: b.id }, data: { photoUrl: null, note: null } }),
    ]);
    // The parcel may have later attempts: only scrub it once none of its bookings is recent.
    const recent = await prisma.booking.count({ where: { parcelRequestId: b.parcelRequestId, updatedAt: { gte: oldCutoff } } });
    const parcel = await prisma.parcelRequest.findUnique({ where: { id: b.parcelRequestId } });
    if (!recent && parcel && parcel.pickupAddress !== '—') {
      await Promise.all(parcel.photoUrls.map(destroyMedia));
      await prisma.parcelRequest.update({ where: { id: parcel.id }, data: { pickupAddress: '—', deliveryAddress: '—', photoUrls: [] } });
    }
    stats.oldBookings++;
  }

  // 5. Short-lived records.
  stats.notifications = (await prisma.notification.deleteMany({ where: { createdAt: { lt: new Date(now - RETENTION.notificationsDays * DAY) } } })).count;
  stats.outboundMessages = (await prisma.outboundMessage.deleteMany({ where: { createdAt: { lt: new Date(now - RETENTION.outboundMessagesDays * DAY) } } })).count;
  stats.auditLog = (await prisma.auditLog.deleteMany({ where: { createdAt: { lt: new Date(now - years(RETENTION.auditLogYears)) } } })).count;

  if (Object.values(stats).some(Boolean)) logger.info('Retention purge done', stats);
  return stats;
};
const runRetentionSafe = () => runRetention().catch((e) => logger.warn('Retention purge failed', { error: e.message }));

module.exports = { RETENTION, ACTIVE_STATUSES, involvedBookings, isOnHold, hardDeleteUser, closeAccount, exportUserData, runRetention, runRetentionSafe };
