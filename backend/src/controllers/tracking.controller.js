const cloudinary = require('../utils/cloudinary');
const prisma = require('../utils/prisma');
const { AppError } = require('../middlewares/error.middleware');
const { getIo } = require('../utils/socket');
const { sendPushNotification } = require('../services/notification.service');
const { releasePayment } = require('../services/payment.service');

const uploadPhoto = (buffer) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream({ folder: 'amana/tracking' }, (err, result) => {
      if (err) reject(err);
      else resolve(result.secure_url);
    }).end(buffer);
  });

const addTrackingEvent = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { status, note } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        trip: { include: { traveler: true } },
        parcelRequest: { include: { sender: true } },
        payment: true,
      },
    });

    if (!booking) throw new AppError('Booking not found', 404);
    if (booking.trip.travelerId !== req.user.id) throw new AppError('Only the traveler can update tracking', 403);
    if (booking.status !== 'ACCEPTED') throw new AppError('Booking must be accepted to track', 400);

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

    // Real-time push to booking room
    getIo().to(`booking:${bookingId}`).emit('tracking:update', event);

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
    if (booking.senderId !== req.user.id && booking.trip.travelerId !== req.user.id) {
      throw new AppError('Forbidden', 403);
    }
    res.json({ success: true, events: booking.trackingEvents });
  } catch (err) { next(err); }
};

module.exports = { addTrackingEvent, getTrackingHistory };
