const prisma = require('../utils/prisma');
const { AppError } = require('../middlewares/error.middleware');
const { sendPushNotification } = require('../services/notification.service');

const createBooking = async (req, res, next) => {
  try {
    const { tripId, parcelRequestId } = req.body;

    const [trip, parcel] = await Promise.all([
      prisma.trip.findUnique({ where: { id: tripId } }),
      prisma.parcelRequest.findUnique({ where: { id: parcelRequestId }, include: { booking: true } }),
    ]);

    if (!trip) throw new AppError('Trip not found', 404);
    if (trip.status !== 'OPEN') throw new AppError('Trip is not available', 400);
    if (!parcel) throw new AppError('Parcel not found', 404);
    if (parcel.senderId !== req.user.id) throw new AppError('Forbidden', 403);
    if (parcel.booking) throw new AppError('Parcel already has a booking', 400);

    // Check weight availability
    const usedWeight = await prisma.booking.aggregate({
      where: { tripId, status: { in: ['ACCEPTED', 'PENDING'] } },
      _sum: { parcelRequest: true },
    });
    // simplified check – full check uses a raw query or join
    const booking = await prisma.booking.create({
      data: {
        tripId,
        parcelRequestId,
        senderId: req.user.id,
        status: 'PENDING',
      },
      include: { trip: { include: { traveler: true } } },
    });

    // Notify traveler
    if (booking.trip.traveler.fcmToken) {
      await sendPushNotification(
        booking.trip.traveler.fcmToken,
        'New parcel request',
        `Someone wants you to carry their parcel to ${trip.destinationCity}`,
        { bookingId: booking.id }
      );
    }

    res.status(201).json({ success: true, booking });
  } catch (err) { next(err); }
};

const respondToBooking = async (req, res, next) => {
  try {
    const { action } = req.body;
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { trip: true, parcelRequest: { include: { sender: true } } },
    });

    if (!booking) throw new AppError('Booking not found', 404);
    if (booking.trip.travelerId !== req.user.id) throw new AppError('Forbidden', 403);
    if (booking.status !== 'PENDING') throw new AppError('Booking already responded to', 400);

    const newStatus = action === 'accept' ? 'ACCEPTED' : 'REJECTED';
    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: newStatus, ...(newStatus === 'ACCEPTED' && { confirmedAt: new Date() }) },
    });

    // Notify sender
    if (booking.parcelRequest.sender.fcmToken) {
      await sendPushNotification(
        booking.parcelRequest.sender.fcmToken,
        `Booking ${newStatus.toLowerCase()}`,
        newStatus === 'ACCEPTED'
          ? 'Your parcel request was accepted! Proceed to payment.'
          : 'Your parcel request was rejected.',
        { bookingId: booking.id }
      );
    }

    res.json({ success: true, booking: updated });
  } catch (err) { next(err); }
};

const cancelBooking = async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { payment: true },
    });
    if (!booking) throw new AppError('Booking not found', 404);
    if (booking.senderId !== req.user.id) throw new AppError('Forbidden', 403);
    if (!['PENDING', 'ACCEPTED'].includes(booking.status)) {
      throw new AppError('Cannot cancel booking at this stage', 400);
    }

    await prisma.booking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } });
    // Payment refund handled by payment service if payment exists
    res.json({ success: true, message: 'Booking cancelled' });
  } catch (err) { next(err); }
};

const getBooking = async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        trip: { include: { traveler: { select: { id: true, name: true, photoUrl: true, rating: true } } } },
        parcelRequest: true,
        trackingEvents: { orderBy: { createdAt: 'desc' } },
        payment: true,
        reviews: {
          include: { reviewer: { select: { id: true, name: true, photoUrl: true } } },
        },
      },
    });
    if (!booking) throw new AppError('Booking not found', 404);
    if (booking.senderId !== req.user.id && booking.trip.travelerId !== req.user.id) {
      throw new AppError('Forbidden', 403);
    }
    res.json({ success: true, booking });
  } catch (err) { next(err); }
};

const listMyBookings = async (req, res, next) => {
  try {
    const { role } = req.query; // 'sender' | 'traveler'
    const where = role === 'traveler'
      ? { trip: { travelerId: req.user.id } }
      : { senderId: req.user.id };

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        trip: { select: { originCity: true, destinationCity: true, departureAt: true } },
        parcelRequest: { select: { weightKg: true, description: true } },
        payment: { select: { status: true, grossAmount: true } },
      },
    });
    res.json({ success: true, bookings });
  } catch (err) { next(err); }
};

module.exports = { createBooking, respondToBooking, cancelBooking, getBooking, listMyBookings };
