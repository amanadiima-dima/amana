const prisma = require('../utils/prisma');
const { AppError } = require('../middlewares/error.middleware');
const { sendPushNotification } = require('../services/notification.service');
const { refundPayment } = require('../services/payment.service');
const { expireStaleBookings } = require('../services/bookingExpiry.service');
const { notifyUsers, notifyAdmins } = require('../services/notify.service');
const { windowMs, MIN_LEAD_FOR_PAYER, HOUR, publicName } = require('../services/bookingFlow.service');
const { sendPayerInvite } = require('../services/messaging.service');
const crypto = require('crypto');

const MAX_INVITES_PER_DAY = parseInt(process.env.MAX_INVITES_PER_DAY || '10', 10);
const WEB_URL = (process.env.WEB_URL || (process.env.CORS_ORIGIN || '').split(',')[0] || 'http://localhost:3001').replace(/\/$/, '');

const newDeliveryCode = () => String(crypto.randomInt(100000, 1000000));

// Bookings that still hold a parcel's / trip's space.
const ACTIVE = ['PAYMENT_PENDING', 'PENDING', 'ACCEPTED', 'DISPUTED'];

const isParticipant = (booking, userId) =>
  booking.senderId === userId || booking.payerId === userId || booking.trip.travelerId === userId;

const createBooking = async (req, res, next) => {
  try {
    const { tripId, parcelRequestId } = req.body;
    const priorityTip = req.body.priorityTip ? Number(req.body.priorityTip) : 0;
    if (!Number.isFinite(priorityTip) || priorityTip < 0 || priorityTip > 100000) throw new AppError('Priority bonus must be between 0 and 100000', 400);

    const [trip, parcel] = await Promise.all([
      prisma.trip.findUnique({ where: { id: tripId } }),
      prisma.parcelRequest.findUnique({
        where: { id: parcelRequestId },
        include: { bookings: { where: { status: { in: [...ACTIVE, 'COMPLETED'] } } } },
      }),
    ]);

    if (!trip) throw new AppError('Trip not found', 404);
    if (trip.travelerId === req.user.id) throw new AppError('You cannot book a parcel on your own trip', 400);
    if (trip.status !== 'OPEN') throw new AppError('Trip is not available', 400);
    if (trip.departureAt < new Date()) throw new AppError('This trip has already departed', 400);
    if (!parcel) throw new AppError('Parcel not found', 404);
    if (parcel.senderId !== req.user.id) throw new AppError('Forbidden', 403);
    // A rejected/cancelled attempt doesn't block trying a different trip —
    // only one *active* booking per parcel at a time.
    if (parcel.bookings.length > 0) throw new AppError('Parcel already has an active booking', 400);

    // Optional: ask the recipient to pay instead of the sender. They may not have an Amana account yet:
    // they get an invitation (WhatsApp, SMS fallback) with a link, and sign up / sign in to pay.
    let payer = null;
    let invitePhone = null;
    const payerPhone = String(req.body.payerPhone || '').trim();
    if (payerPhone && payerPhone !== req.user.phone) {
      const traveler = await prisma.user.findUnique({ where: { id: trip.travelerId }, select: { phone: true } });
      if (payerPhone === traveler?.phone) throw new AppError('The traveler cannot be the payer', 400);
      if (trip.departureAt.getTime() - Date.now() < MIN_LEAD_FOR_PAYER) {
        throw new AppError('This trip leaves too soon for the recipient to pay — please pay yourself', 400);
      }
      const sentToday = await prisma.booking.count({
        where: { senderId: req.user.id, payerPhone: { not: null }, createdAt: { gte: new Date(Date.now() - 24 * HOUR) } },
      });
      if (sentToday >= MAX_INVITES_PER_DAY) throw new AppError('Too many payment requests today — please try again tomorrow', 429);
      payer = await prisma.user.findUnique({ where: { phone: payerPhone }, select: { id: true, isActive: true } });
      if (payer && payer.isActive === false) throw new AppError('That account is not available', 400);
      invitePhone = payerPhone;
    }

    // Check weight availability: sum the weight of parcels already on this trip
    const activeBookings = await prisma.booking.findMany({
      where: { tripId, status: { in: ['ACCEPTED', 'PENDING', 'PAYMENT_PENDING'] } },
      select: { parcelRequest: { select: { weightKg: true } } },
    });
    const usedWeight = activeBookings.reduce((sum, b) => sum + (b.parcelRequest?.weightKg || 0), 0);
    if (usedWeight + parcel.weightKg > trip.maxWeightKg) {
      throw new AppError('Not enough remaining capacity on this trip', 400);
    }

    const payDeadline = invitePhone ? new Date(Date.now() + windowMs(trip.departureAt, new Date(), HOUR)) : null;
    const booking = await prisma.booking.create({
      data: {
        tripId,
        parcelRequestId,
        senderId: req.user.id,
        status: invitePhone ? 'PAYMENT_PENDING' : 'PENDING',
        priorityTip,
        ...(invitePhone && { payerId: payer?.id || null, payerPhone: invitePhone, payDeadline, inviteToken: crypto.randomBytes(24).toString('hex') }),
      },
      include: { trip: { include: { traveler: true } } },
    });

    const route = `${trip.originCity} → ${trip.destinationCity}`;
    let invite = null;
    if (invitePhone) {
      const senderName = publicName(req.user.name);
      const locale = ['en', 'fr', 'es', 'ar'].includes(req.body.locale) ? req.body.locale : 'en';
      const total = parcel.weightKg * trip.pricePerKg + priorityTip;
      const link = `${WEB_URL}${locale === 'en' ? '' : `/${locale}`}/invite/${booking.inviteToken}`;
      invite = await sendPayerInvite({
        phone: invitePhone, locale, bookingId: booking.id, sender: senderName, route,
        amount: `${total.toFixed(2)} ${trip.currency}`, link,
      });
      // Existing users also get an in-app notification; the traveler only hears about it once the money is secured.
      if (payer) {
        await notifyUsers([payer.id], `${senderName} asks you to pay for a parcel`, `${route}: please review and pay before the deadline so the traveler can accept.`, { bookingId: booking.id, type: 'PAYMENT_REQUEST' });
      }
    } else {
      await notifyUsers([trip.travelerId], 'New parcel request 📦', `${route}: ${publicName(req.user.name)} wants you to carry a ${parcel.weightKg} kg parcel. Please accept or decline.`, { bookingId: booking.id, type: 'BOOKING_REQUEST' });
      await sendPushNotification(
        booking.trip.traveler.fcmToken,
        'New parcel request',
        `Someone wants you to carry their parcel to ${trip.destinationCity}`,
        { bookingId: booking.id }
      );
    }

    res.status(201).json({ success: true, booking, ...(invite && { invite }) });
  } catch (err) { next(err); }
};

const respondToBooking = async (req, res, next) => {
  try {
    const { action } = req.body;
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { trip: true, payment: true, parcelRequest: { include: { sender: true } } },
    });

    if (!booking) throw new AppError('Booking not found', 404);
    if (booking.trip.travelerId !== req.user.id) throw new AppError('Forbidden', 403);
    if (booking.status === 'PAYMENT_PENDING') throw new AppError('Booking not found', 404); // not released to the traveler yet
    if (booking.status === 'PENDING' && (booking.trip.departureAt < new Date() || (booking.respondDeadline && booking.respondDeadline < new Date()))) {
      await expireStaleBookings();
      throw new AppError('This request expired — the booking was cancelled', 400);
    }
    if (booking.status !== 'PENDING') throw new AppError('Booking already responded to', 400);

    const newStatus = action === 'accept' ? 'ACCEPTED' : 'REJECTED';
    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: newStatus,
        ...(newStatus === 'ACCEPTED' && { confirmedAt: new Date(), deliveryCode: newDeliveryCode() }),
      },
    });

    // Payment-first flow: a rejection returns the held money to whoever paid.
    if (newStatus === 'REJECTED' && booking.payment?.status === 'HELD') await refundPayment(booking.payment);

    const route = `${booking.trip.originCity} → ${booking.trip.destinationCity}`;
    await notifyUsers(
      [booking.senderId, booking.payerId],
      newStatus === 'ACCEPTED' ? 'Booking accepted' : 'Booking rejected',
      newStatus === 'ACCEPTED'
        ? `${route}: the traveler accepted.${booking.payment?.status === 'HELD' ? ' The payment is held by Amana until delivery.' : ' Proceed to payment.'}`
        : `${route}: the traveler declined.${booking.payment?.status === 'HELD' ? ' The payment was refunded in full.' : ''}`,
      { bookingId: booking.id, type: 'BOOKING_RESPONSE' }
    );
    if (booking.parcelRequest.sender.fcmToken) {
      await sendPushNotification(
        booking.parcelRequest.sender.fcmToken,
        `Booking ${newStatus.toLowerCase()}`,
        newStatus === 'ACCEPTED'
          ? 'Your parcel request was accepted!'
          : 'Your parcel request was rejected.',
        { bookingId: booking.id }
      );
    }

    res.json({ success: true, booking: updated });
  } catch (err) { next(err); }
};

// DELETE /api/bookings/:id — the sender cancels, or the payer declines / withdraws.
const cancelBooking = async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { payment: true, trip: true, _count: { select: { trackingEvents: true } } },
    });
    if (!booking) throw new AppError('Booking not found', 404);
    if (booking.senderId !== req.user.id && booking.payerId !== req.user.id) throw new AppError('Forbidden', 403);
    if (!['PAYMENT_PENDING', 'PENDING', 'ACCEPTED'].includes(booking.status)) {
      throw new AppError('Cannot cancel booking at this stage', 400);
    }
    if (booking._count.trackingEvents > 0) {
      throw new AppError('The parcel has already been picked up — report a problem instead of cancelling', 409);
    }

    await prisma.booking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } });
    if (booking.payment?.status === 'HELD') {
      await refundPayment(booking.payment);
    }

    const route = `${booking.trip.originCity} → ${booking.trip.destinationCity}`;
    const byPayer = booking.payerId === req.user.id;
    const others = [byPayer ? booking.senderId : booking.payerId];
    if (booking.status !== 'PAYMENT_PENDING') others.push(booking.trip.travelerId);
    await notifyUsers(others, byPayer ? 'The recipient declined to pay' : 'Booking cancelled', `${route}: the booking was cancelled${booking.payment?.status === 'HELD' ? ' and the payment refunded in full' : ''}.`, { bookingId: booking.id, type: 'BOOKING_CANCELLED' });

    res.json({ success: true, message: 'Booking cancelled' });
  } catch (err) { next(err); }
};

const getBooking = async (req, res, next) => {
  try {
    await expireStaleBookings();
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        trip: { include: { traveler: { select: { id: true, name: true, photoUrl: true, rating: true } } } },
        parcelRequest: true,
        sender: { select: { id: true, name: true } },
        payer: { select: { id: true, name: true } },
        trackingEvents: { orderBy: { createdAt: 'desc' } },
        payment: true,
        reviews: {
          include: { reviewer: { select: { id: true, name: true, photoUrl: true } } },
        },
      },
    });
    if (!booking) throw new AppError('Booking not found', 404);
    if (!isParticipant(booking, req.user.id)) throw new AppError('Forbidden', 403);
    if (booking.status === 'PAYMENT_PENDING' && booking.trip.travelerId === req.user.id) throw new AppError('Booking not found', 404);

    const sees = booking.senderId === req.user.id || booking.payerId === req.user.id;
    if (sees && booking.status === 'ACCEPTED' && !booking.deliveryCode) {
      booking.deliveryCode = newDeliveryCode();
      await prisma.booking.update({ where: { id: booking.id }, data: { deliveryCode: booking.deliveryCode } });
    }
    if (!sees) booking.deliveryCode = undefined; // only the sender / payer (the recipient) may know it
    if (booking.senderId !== req.user.id) booking.inviteToken = undefined; // the invitation link belongs to the sender
    res.json({ success: true, booking });
  } catch (err) { next(err); }
};

// POST /api/bookings/:id/dispute  body: { reason }
const openDispute = async (req, res, next) => {
  try {
    const reason = String(req.body.reason || '').trim();
    if (reason.length < 5) throw new AppError('Please describe the problem (at least 5 characters)', 400);
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { trip: true, _count: { select: { trackingEvents: true } } },
    });
    if (!booking) throw new AppError('Booking not found', 404);
    if (!isParticipant(booking, req.user.id)) throw new AppError('Forbidden', 403);
    if (booking.status !== 'ACCEPTED') throw new AppError('Only an accepted, in-progress booking can be disputed', 400);
    if (booking._count.trackingEvents === 0) throw new AppError('Nothing has happened yet — cancel the booking instead', 400);

    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'DISPUTED', disputeReason: reason, disputedAt: new Date() },
    });
    const others = [booking.senderId, booking.payerId, booking.trip.travelerId].filter((id) => id && id !== req.user.id);
    const route = `${booking.trip.originCity} → ${booking.trip.destinationCity}`;
    await notifyUsers(others, 'A problem was reported on a booking', `${route}: ${reason.slice(0, 100)}. Our team will review it.`, { bookingId: booking.id, type: 'DISPUTE' });
    await notifyAdmins('Dispute opened', `${route}: ${reason.slice(0, 100)}`, { bookingId: booking.id, type: 'DISPUTE' });
    res.json({ success: true });
  } catch (err) { next(err); }
};

const listMyBookings = async (req, res, next) => {
  try {
    await expireStaleBookings();
    const { role } = req.query; // 'sender' | 'traveler' | 'payer'
    const where = role === 'traveler'
      ? { trip: { travelerId: req.user.id }, status: { not: 'PAYMENT_PENDING' } }
      : role === 'payer'
        ? { payerId: req.user.id }
        : { senderId: req.user.id };

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        trip: { select: { originCity: true, destinationCity: true, departureAt: true, currency: true } },
        parcelRequest: { select: { weightKg: true, description: true, sender: { select: { id: true, name: true } } } },
        payer: { select: { id: true, name: true } },
        payment: { select: { status: true, grossAmount: true, currency: true } },
      },
    });

    // Unread chat messages per booking (from the other person)
    const unread = await prisma.message.groupBy({
      by: ['bookingId'],
      where: { bookingId: { in: bookings.map((b) => b.id) }, senderId: { not: req.user.id }, readAt: null },
      _count: { _all: true },
    });
    const unreadMap = Object.fromEntries(unread.map((u) => [u.bookingId, u._count._all]));

    res.json({
      success: true,
      bookings: bookings.map((b) => ({ ...b, unreadMessages: unreadMap[b.id] || 0 })),
    });
  } catch (err) { next(err); }
};

module.exports = { createBooking, respondToBooking, cancelBooking, getBooking, listMyBookings, openDispute };
