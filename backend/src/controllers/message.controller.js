const prisma = require('../utils/prisma');
const { AppError } = require('../middlewares/error.middleware');
const { getIo } = require('../utils/socket');
const { sendPushNotification } = require('../services/notification.service');

// Load the booking and make sure req.user is the sender or the traveler on it.
const loadParticipantBooking = async (bookingId, userId) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      trip: { select: { travelerId: true, originCity: true, destinationCity: true } },
      parcelRequest: { select: { sender: { select: { id: true } } } },
    },
  });
  if (!booking) throw new AppError('Booking not found', 404);

  const travelerId = booking.trip.travelerId;
  const senderId = booking.senderId;
  const payerId = booking.payerId;
  if (userId !== travelerId && userId !== senderId && userId !== payerId) {
    throw new AppError('You are not part of this conversation', 403);
  }
  if (booking.status === 'PAYMENT_PENDING' && userId === travelerId) throw new AppError('Booking not found', 404);
  return { booking, travelerId, senderId, payerId };
};

// GET /api/bookings/:id/messages
const listMessages = async (req, res, next) => {
  try {
    const { id } = req.params;
    await loadParticipantBooking(id, req.user.id);

    const messages = await prisma.message.findMany({
      where: { bookingId: id },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { id: true, name: true, photoUrl: true } } },
    });

    // Mark the other person's messages as read
    await prisma.message.updateMany({
      where: { bookingId: id, senderId: { not: req.user.id }, readAt: null },
      data: { readAt: new Date() },
    });

    res.json({ success: true, messages });
  } catch (err) { next(err); }
};

// POST /api/bookings/:id/messages   body: { body }
const sendMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = (req.body.body || '').trim();
    if (!body) throw new AppError('Message body is required', 400);
    if (body.length > 2000) throw new AppError('Message too long (max 2000 chars)', 400);

    const { booking, travelerId, senderId, payerId } = await loadParticipantBooking(id, req.user.id);
    if (['REJECTED', 'CANCELLED'].includes(booking.status)) {
      throw new AppError('This booking is closed — messaging is disabled', 409);
    }

    const message = await prisma.message.create({
      data: { bookingId: id, senderId: req.user.id, body },
      include: { sender: { select: { id: true, name: true, photoUrl: true } } },
    });

    // Real-time push to anyone in the booking room
    try {
      getIo().to(`booking:${id}`).emit('message:new', message);
    } catch (_e) { /* socket not ready — ignore */ }

    // Notify everyone else in the conversation (the traveler isn't told while it's still awaiting the payer)
    const recipients = [travelerId, senderId, payerId].filter((x) => x && x !== req.user.id && !(x === travelerId && booking.status === 'PAYMENT_PENDING'));
    const recipientUsers = await prisma.user.findMany({ where: { id: { in: recipients } }, select: { id: true, fcmToken: true } });
    for (const r of recipientUsers) {
      await prisma.notification.create({
        data: {
          userId: r.id,
          title: `New message from ${message.sender.name}`,
          body: body.slice(0, 120),
          data: { bookingId: id, type: 'MESSAGE' },
        },
      });
      if (r.fcmToken) {
        await sendPushNotification(r.fcmToken, `New message from ${message.sender.name}`, body.slice(0, 120), { bookingId: id, type: 'MESSAGE' });
      }
    }

    res.status(201).json({ success: true, message });
  } catch (err) { next(err); }
};

module.exports = { listMessages, sendMessage };
