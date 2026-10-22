const { uploadPrivate, signMediaRefs } = require('../utils/cloudinary');
const prisma = require('../utils/prisma');
const { AppError } = require('../middlewares/error.middleware');
const { getIo } = require('../utils/socket');
const { sendPushNotification } = require('../services/notification.service');
const { releasePayment } = require('../services/payment.service');
const { notifyUsers, notifyAdmins } = require('../services/notify.service');

// Brute-force guard for the 6-digit delivery code: 5 wrong tries, then 15 min lock.
const codeAttempts = new Map();
const MAX_CODE_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;

// Private upload: responses carry a signed link, never a public URL (photos can show faces/addresses).
const uploadPhoto = (buffer) => uploadPrivate(buffer, 'amana/tracking', 'image');

const addTrackingEvent = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { status, note, code } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        trip: { include: { traveler: true } },
        parcelRequest: { include: { sender: true } },
        payment: true,
        trackingEvents: { select: { status: true } },
      },
    });

    if (!booking) throw new AppError('Booking not found', 404);
    if (booking.trip.travelerId !== req.user.id) throw new AppError('Only the traveler can update tracking', 403);
    if (booking.status !== 'ACCEPTED') throw new AppError('Booking must be accepted to track', 400);

    // Steps must happen in order, and the parcel only moves once the sender has paid (escrow HELD).
    const seen = new Set(booking.trackingEvents.map((e) => e.status));
    if (status === 'PICKED_UP') {
      if (seen.has('PICKED_UP')) throw new AppError('Already marked as picked up', 400);
      if (booking.payment?.status !== 'HELD') throw new AppError('The sender has not paid yet — do not collect the parcel until payment is secured', 400);
    } else if (!seen.has('PICKED_UP')) {
      throw new AppError('Mark the parcel as picked up first', 400);
    }
    if (status === 'IN_TRANSIT' && seen.has('IN_TRANSIT')) throw new AppError('Already marked as in transit', 400);

    if (status === 'DELIVERED') {
      if (!req.file) throw new AppError('A photo of the delivered parcel is required to confirm delivery and get paid', 400);
      if (!booking.deliveryCode) {
        // Legacy booking created before delivery codes existed: issue one for the sender to read.
        await prisma.booking.update({ where: { id: bookingId }, data: { deliveryCode: String(Math.floor(100000 + Math.random() * 900000)) } });
        throw new AppError('A delivery code was just created — ask the sender to open the booking and read it to the recipient', 409);
      }
      const rec = codeAttempts.get(bookingId);
      if (rec && rec.until && rec.until > Date.now()) throw new AppError('Too many wrong codes — try again in 15 minutes', 429);
      if (String(code || '').trim() !== booking.deliveryCode) {
        const count = (rec && !(rec.until && rec.until <= Date.now()) ? rec.count : 0) + 1;
        codeAttempts.set(bookingId, { count, until: count >= MAX_CODE_ATTEMPTS ? Date.now() + LOCK_MS : 0 });
        throw new AppError('Wrong delivery code — ask the recipient for the 6-digit code from the sender', 400);
      }
      codeAttempts.delete(bookingId);
    }

    const photoUrl = req.file ? await uploadPhoto(req.file.buffer) : undefined;

    const event = await prisma.trackingEvent.create({
      data: { bookingId, status, note, photoUrl },
    });

    // If delivered, release payment and mark booking complete
    if (status === 'DELIVERED') {
      await prisma.booking.update({ where: { id: bookingId }, data: { status: 'COMPLETED' } });
      if (booking.payment?.status === 'HELD') {
        await releasePayment(booking.payment);
      }
    }

    // A failed delivery freezes the money and goes to the Amana team to resolve.
    if (status === 'FAILED') {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'DISPUTED', disputeReason: note || 'Delivery failed', disputedAt: new Date() },
      });
      const route = `${booking.trip.originCity} → ${booking.trip.destinationCity}`;
      await notifyUsers([booking.senderId], 'Delivery problem', `${route}: the traveler reported a delivery problem. Our team will review it.`, { bookingId, type: 'DISPUTE' });
      await notifyAdmins('Dispute opened', `${route}: delivery failed${note ? ` — ${note.slice(0, 80)}` : ''}`, { bookingId, type: 'DISPUTE' });
    }

    // Real-time push to booking room
    getIo().to(`booking:${bookingId}`).emit('tracking:update', signMediaRefs(event));

    // Push notification to sender
    if (booking.parcelRequest.sender.fcmToken) {
      const messages = {
        PICKED_UP: 'Your parcel has been picked up!',
        IN_TRANSIT: 'Your parcel is on the way!',
        DELIVERED: 'Your parcel has been delivered! 🎉',
        FAILED: 'There was an issue with your delivery.',
      };
      await sendPushNotification(
        booking.parcelRequest.sender.fcmToken,
        'Parcel update',
        messages[status],
        { bookingId }
      );
    }

    res.status(201).json({ success: true, event });
  } catch (err) { next(err); }
};

const getTrackingHistory = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        trip: { select: { travelerId: true } },
        trackingEvents: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!booking) throw new AppError('Booking not found', 404);
    if (booking.senderId !== req.user.id && booking.payerId !== req.user.id && booking.trip.travelerId !== req.user.id) {
      throw new AppError('Forbidden', 403);
    }
    res.json({ success: true, events: booking.trackingEvents });
  } catch (err) { next(err); }
};

module.exports = { addTrackingEvent, getTrackingHistory };
