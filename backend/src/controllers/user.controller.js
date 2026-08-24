const cloudinary = require('../utils/cloudinary');
const prisma = require('../utils/prisma');
const { AppError } = require('../middlewares/error.middleware');

const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { idVerification: { select: { status: true } } },
    });
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, bio } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { ...(name && { name }), ...(bio !== undefined && { bio }) },
    });
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

const uploadIdVerification = async (req, res, next) => {
  try {
    if (!req.files?.front || !req.files?.back) {
      throw new AppError('Both front and back ID photos are required', 400);
    }

    const upload = (buffer, folder) =>
      new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ folder }, (err, result) => {
          if (err) reject(err);
          else resolve(result.secure_url);
        }).end(buffer);
      });

    const [frontUrl, backUrl] = await Promise.all([
      upload(req.files.front[0].buffer, 'amana/id-verifications'),
      upload(req.files.back[0].buffer, 'amana/id-verifications'),
    ]);

    const verification = await prisma.idVerification.upsert({
      where: { userId: req.user.id },
      update: { frontPhoto: frontUrl, backPhoto: backUrl, status: 'PENDING' },
      create: { userId: req.user.id, frontPhoto: frontUrl, backPhoto: backUrl },
    });

    res.json({ success: true, verification });
  } catch (err) { next(err); }
};

// Public profile — visible to any logged-in user (used on trip search to view traveler)
const getPublicProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.userId },
      select: {
        id: true, name: true, photoUrl: true, bio: true,
        rating: true, reviewCount: true, isVerified: true, createdAt: true,
        reviewsReceived: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            reviewer: { select: { id: true, name: true, photoUrl: true } },
            booking: {
              select: {
                trip: { select: { originCity: true, destinationCity: true, departureAt: true } },
              },
            },
          },
        },
      },
    });
    if (!user) throw new AppError('User not found', 404);
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

module.exports = { getProfile, updateProfile, uploadIdVerification, getPublicProfile };
