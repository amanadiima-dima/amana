const { uploadPrivate } = require('../utils/cloudinary');
const prisma = require('../utils/prisma');
const { AppError } = require('../middlewares/error.middleware');

// Private upload: responses carry a signed link, never a public URL (photos can show faces/addresses).
const uploadPhoto = (buffer) => uploadPrivate(buffer, 'amana/parcels', 'image');

const createParcel = async (req, res, next) => {
  try {
    const { pickupAddress, deliveryAddress, weightKg, description, estimatedValue, valueCurrency, fragile } = req.body;
    const currency = ['EUR', 'CHF', 'MAD', 'DZD', 'TND', 'GBP', 'USD'].includes(valueCurrency) ? valueCurrency : 'EUR';

    const photoUrls = req.files?.length
      ? await Promise.all(req.files.map((f) => uploadPhoto(f.buffer)))
      : [];

    const parcel = await prisma.parcelRequest.create({
      data: {
        senderId: req.user.id,
        pickupAddress,
        deliveryAddress,
        weightKg: parseFloat(weightKg),
        description,
        estimatedValue: estimatedValue ? parseFloat(estimatedValue) : null,
        valueCurrency: currency,
        fragile: fragile === 'true' || fragile === true,
        photoUrls,
      },
    });
    res.status(201).json({ success: true, parcel });
  } catch (err) { next(err); }
};

// A parcel can carry several booking attempts over its life (e.g. rejected by
// one traveler, retried on another trip); only one is ever active at a time.
// `booking` on the response is that active one (or null), for a UI that only
// needs to know "can this parcel be booked right now?".
const ACTIVE_BOOKING_STATUSES = ['PAYMENT_PENDING', 'PENDING', 'ACCEPTED', 'DISPUTED', 'COMPLETED'];
const withActiveBooking = ({ bookings, ...parcel }) => ({
  ...parcel,
  booking: bookings.find((b) => ACTIVE_BOOKING_STATUSES.includes(b.status)) || null,
});

const listMyParcels = async (req, res, next) => {
  try {
    const parcels = await prisma.parcelRequest.findMany({
      where: { senderId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        bookings: {
          orderBy: { createdAt: 'desc' },
          select: { status: true, trip: { select: { destinationCity: true, departureAt: true } } },
        },
      },
    });
    res.json({ success: true, parcels: parcels.map(withActiveBooking) });
  } catch (err) { next(err); }
};

const getParcel = async (req, res, next) => {
  try {
    const parcel = await prisma.parcelRequest.findUnique({
      where: { id: req.params.id },
      include: {
        sender: { select: { id: true, name: true, photoUrl: true, rating: true } },
        bookings: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!parcel) throw new AppError('Parcel not found', 404);
    if (parcel.senderId !== req.user.id) throw new AppError('Forbidden', 403);
    res.json({ success: true, parcel: withActiveBooking(parcel) });
  } catch (err) { next(err); }
};

module.exports = { createParcel, listMyParcels, getParcel };
