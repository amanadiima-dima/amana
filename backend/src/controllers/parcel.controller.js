const cloudinary = require('../utils/cloudinary');
const prisma = require('../utils/prisma');
const { AppError } = require('../middlewares/error.middleware');

const uploadPhoto = (buffer) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream({ folder: 'amana/parcels' }, (err, result) => {
      if (err) reject(err);
      else resolve(result.secure_url);
    }).end(buffer);
  });

const createParcel = async (req, res, next) => {
  try {
    const { pickupAddress, deliveryAddress, weightKg, description, estimatedValue, fragile } = req.body;

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
        fragile: fragile === 'true' || fragile === true,
        photoUrls,
      },
    });
    res.status(201).json({ success: true, parcel });
  } catch (err) { next(err); }
};

const listMyParcels = async (req, res, next) => {
  try {
    const parcels = await prisma.parcelRequest.findMany({
      where: { senderId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: { booking: { select: { status: true, trip: { select: { destinationCity: true, departureAt: true } } } } },
    });
    res.json({ success: true, parcels });
  } catch (err) { next(err); }
};

const getParcel = async (req, res, next) => {
  try {
    const parcel = await prisma.parcelRequest.findUnique({
      where: { id: req.params.id },
      include: {
        sender: { select: { id: true, name: true, photoUrl: true, rating: true } },
        booking: true,
      },
    });
    if (!parcel) throw new AppError('Parcel not found', 404);
    if (parcel.senderId !== req.user.id) throw new AppError('Forbidden', 403);
    res.json({ success: true, parcel });
  } catch (err) { next(err); }
};

module.exports = { createParcel, listMyParcels, getParcel };
