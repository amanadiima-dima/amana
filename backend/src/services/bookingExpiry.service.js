const prisma = require('../utils/prisma');
const logger = require('../utils/logger');
const { refundPayment } = require('./payment.service');
const { notifyUsers } = require('./notify.service');

// Cancel a booking that can no longer happen, refunding any money Amana is holding for it.
const cancelStale = async (b, reasonForUsers) => {
  if (b.payment?.status === 'HELD') await refundPayment(b.payment);
  await prisma.booking.update({ where: { id: b.id }, data: { status: 'CANCELLED' } });
  const route = `${b.trip.originCity} → ${b.trip.destinationCity}`;
  const refund = b.payment?.status === 'HELD' ? ' Any payment was refunded in full.' : '';
  await notifyUsers(
    [b.senderId, b.payerId, b.trip.travelerId],
    'Booking cancelled',
    `${route}: ${reasonForUsers}.${refund}`,
    { bookingId: b.id, type: 'BOOKING_EXPIRED' }
  );
};

const INCLUDE = { payment: true, trip: { select: { travelerId: true, originCity: true, destinationCity: true } } };

// Rules (all automatic):
//  1. trip already departed: PENDING / PAYMENT_PENDING, or ACCEPTED that is unpaid and untracked
//  2. recipient didn't pay in time (PAYMENT_PENDING past payDeadline)
//  3. traveler didn't answer a paid request in time (PENDING past respondDeadline)
const expireStaleBookings = async () => {
  const now = new Date();
  const groups = [
    [
      await prisma.booking.findMany({
        where: {
          trip: { departureAt: { lt: now } },
          OR: [
            { status: { in: ['PENDING', 'PAYMENT_PENDING'] } },
            { status: 'ACCEPTED', trackingEvents: { none: {} }, OR: [{ payment: { is: null } }, { payment: { status: 'PENDING' } }] },
          ],
        },
        include: INCLUDE,
      }),
      'the trip left before this booking was completed',
    ],
    [
      await prisma.booking.findMany({ where: { status: 'PAYMENT_PENDING', payDeadline: { lt: now } }, include: INCLUDE }),
      'the recipient did not pay in time',
    ],
    [
      await prisma.booking.findMany({ where: { status: 'PENDING', respondDeadline: { lt: now } }, include: INCLUDE }),
      'the traveler did not answer in time',
    ],
  ];

  const seen = new Set();
  let count = 0;
  for (const [list, reason] of groups) {
    for (const b of list) {
      if (seen.has(b.id)) continue;
      seen.add(b.id);
      try { await cancelStale(b, reason); count++; } catch (e) { logger.warn('expire failed', { id: b.id, error: e.message }); }
    }
  }
  if (count) logger.info(`Expired ${count} stale booking(s)`);
  return count;
};

const expireStaleBookingsSafe = () => expireStaleBookings().catch((e) => logger.warn('expireStaleBookings failed', { error: e.message }));

module.exports = { expireStaleBookings, expireStaleBookingsSafe };
