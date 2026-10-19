const prisma = require('../utils/prisma');
const { AppError } = require('../middlewares/error.middleware');
const { notifyUsers } = require('../services/notify.service');
const { publicName } = require('../services/bookingFlow.service');

const load = async (token) => {
  const booking = await prisma.booking.findUnique({
    where: { inviteToken: token },
    include: {
      trip: { select: { originCity: true, destinationCity: true, departureAt: true, currency: true, pricePerKg: true, travelerId: true } },
      parcelRequest: { select: { weightKg: true } },
      sender: { select: { id: true, name: true } },
    },
  });
  if (!booking) throw new AppError('This invitation link is not valid', 404);
  return booking;
};

// GET /api/invites/:token — public preview, so someone can see what they're being asked to pay
// before creating an account. Reveals only what the invitation message already says.
const getInvite = async (req, res, next) => {
  try {
    const b = await load(req.params.token);
    res.json({
      success: true,
      invite: {
        senderName: publicName(b.sender.name),
        route: `${b.trip.originCity} → ${b.trip.destinationCity}`,
        departureAt: b.trip.departureAt,
        currency: b.trip.currency,
        amount: b.parcelRequest.weightKg * b.trip.pricePerKg + (b.priorityTip || 0),
        payDeadline: b.payDeadline,
        open: b.status === 'PAYMENT_PENDING' && (!b.payDeadline || b.payDeadline > new Date()),
        status: b.status,
      },
    });
  } catch (err) { next(err); }
};

// POST /api/invites/:token/claim — a signed-in user whose verified phone matches becomes the payer.
const claimInvite = async (req, res, next) => {
  try {
    const b = await load(req.params.token);
    if (b.status !== 'PAYMENT_PENDING') throw new AppError('This payment request is no longer open', 410);
    if (b.payerPhone !== req.user.phone) throw new AppError('This request was sent to a different phone number — sign in with the number that received it', 403);
    if (req.user.id === b.senderId || req.user.id === b.trip.travelerId) throw new AppError('You cannot pay for your own booking', 400);
    if (b.payerId && b.payerId !== req.user.id) throw new AppError('This request was already taken by another account', 409);
    if (!b.payerId) await prisma.booking.update({ where: { id: b.id }, data: { payerId: req.user.id } });
    res.json({ success: true, bookingId: b.id });
  } catch (err) { next(err); }
};

// POST /api/invites/:token/decline — "this isn't for me / I won't pay", no account needed.
const declineInvite = async (req, res, next) => {
  try {
    const b = await load(req.params.token);
    if (b.status !== 'PAYMENT_PENDING') throw new AppError('This payment request is no longer open', 410);
    await prisma.booking.update({ where: { id: b.id }, data: { status: 'CANCELLED' } });
    await notifyUsers([b.senderId], 'The recipient declined to pay', `${b.trip.originCity} → ${b.trip.destinationCity}: the request was declined. You can pay yourself or choose someone else.`, { bookingId: b.id, type: 'BOOKING_CANCELLED' });
    res.json({ success: true });
  } catch (err) { next(err); }
};

module.exports = { getInvite, claimInvite, declineInvite };
