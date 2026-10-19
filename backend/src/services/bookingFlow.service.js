const prisma = require('../utils/prisma');
const { notifyUsers } = require('./notify.service');

const HOUR = 3600 * 1000;
const MIN = 60 * 1000;

// Recipient-pays needs time for: payer pays -> traveler answers -> pickup. So the windows shrink
// with the time left before departure: half of it, capped at 24h, never below the floor.
const windowMs = (departureAt, now = new Date(), floorMs = 30 * MIN) => {
  const left = new Date(departureAt).getTime() - now.getTime();
  return Math.max(floorMs, Math.min(24 * HOUR, left * 0.5));
};

// Need at least this much time before departure to start a recipient-pays request.
const MIN_LEAD_FOR_PAYER = 3 * HOUR;

// Called when a payment becomes HELD. In the payment-first (recipient pays) flow this is what
// releases the request to the traveler, with a deadline to answer.
const onPaymentHeld = async (bookingId) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { trip: true },
  });
  if (!booking || booking.status !== 'PAYMENT_PENDING') return;

  const respondDeadline = new Date(Date.now() + windowMs(booking.trip.departureAt));
  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'PENDING', respondDeadline },
  });
  const route = `${booking.trip.originCity} → ${booking.trip.destinationCity}`;
  await notifyUsers([booking.trip.travelerId], 'New booking request — payment secured 💰', `${route}: the payment is already held by Amana. Please answer before the trip leaves.`, { bookingId, type: 'BOOKING_REQUEST' });
  await notifyUsers([booking.senderId], 'The recipient paid', `${route}: payment secured. Waiting for the traveler to accept.`, { bookingId, type: 'PAYER_PAID' });
};

// Never show a phone number as a person's name (accounts default their name to their phone).
const publicName = (name) => (!name || /^\+?[\d\s-]{6,}$/.test(name) ? 'Someone' : String(name).split(' ')[0]);

// When someone registers/logs in with a phone that was invited to pay, link them to those requests.
const claimInvitedBookings = (user) =>
  prisma.booking.updateMany({
    where: { payerPhone: user.phone, payerId: null, status: 'PAYMENT_PENDING' },
    data: { payerId: user.id },
  });

module.exports = { publicName, claimInvitedBookings, windowMs, MIN_LEAD_FOR_PAYER, onPaymentHeld, HOUR, MIN };
