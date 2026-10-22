const cloudinary = require('../utils/cloudinary');
const prisma = require('../utils/prisma');
const { AppError } = require('../middlewares/error.middleware');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { uploadPrivate, destroyMedia } = require('../utils/cloudinary');
const { closeAccount, exportUserData } = require('../services/account.service');

const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { idVerification: { select: { status: true, reviewNote: true, documentType: true } } },
    });
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, bio } = req.body;
    const lastName = req.body.lastName === undefined ? undefined : String(req.body.lastName).trim().slice(0, 60);
    if (lastName === '') throw new AppError('Enter your last name', 400);
    // Email is an optional sign-in identifier: "" removes it.
    const email = req.body.email === undefined ? undefined : String(req.body.email).trim().toLowerCase() || null;
    if (email) {
      const other = await prisma.user.findUnique({ where: { email } });
      if (other && other.id !== req.user.id) throw new AppError('This email is already used by another account', 409);
    }
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { ...(name && { name }), ...(lastName !== undefined && { lastName }), ...(bio !== undefined && { bio }), ...(email !== undefined && { email }) },
    });
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

// POST /api/users/me/password  body: { currentPassword, newPassword }
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (req.user.passwordHash && !(await bcrypt.compare(String(currentPassword || ''), req.user.passwordHash))) {
      throw new AppError('Your current password is wrong', 400);
    }
    await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash: await bcrypt.hash(newPassword, 10) } });
    res.json({ success: true });
  } catch (err) { next(err); }
};

// GET /api/users/me/id-verification/challenge — a random code the user must say aloud in the selfie video.
// Signed (stateless) so it can't be forged or reused later; valid for 20 minutes.
const getIdChallenge = (req, res) => {
  const code = String(crypto.randomInt(1000, 10000));
  const token = jwt.sign({ typ: 'idv-challenge', userId: req.user.id, code }, process.env.JWT_SECRET, { expiresIn: '20m' });
  res.json({ success: true, code, token });
};

const DOC_TYPES = ['ID_CARD', 'PASSPORT'];

// POST /api/users/me/id-verification  (multipart: front, back?, video; fields: documentType, challengeToken, consent)
const uploadIdVerification = async (req, res, next) => {
  try {
    const { documentType = 'ID_CARD', challengeToken, consent } = req.body;
    if (!DOC_TYPES.includes(documentType)) throw new AppError('Unknown document type', 400);
    if (consent !== 'true') throw new AppError('You must consent to the identity check to continue', 400);

    const front = req.files?.front?.[0];
    const back = req.files?.back?.[0];
    const video = req.files?.video?.[0];
    if (!front) throw new AppError(documentType === 'PASSPORT' ? 'A photo of the passport photo page is required' : 'A photo of the front of the ID is required', 400);
    if (documentType === 'ID_CARD' && !back) throw new AppError('A photo of the back of the ID is required', 400);
    if (!video) throw new AppError('The selfie video is required', 400);

    let challenge;
    try {
      challenge = jwt.verify(String(challengeToken || ''), process.env.JWT_SECRET);
    } catch {
      throw new AppError('The verification code expired — reload and record the video again', 400);
    }
    if (challenge.typ !== 'idv-challenge' || challenge.userId !== req.user.id) throw new AppError('Invalid verification code', 400);

    const [frontRef, backRef, videoRef] = await Promise.all([
      uploadPrivate(front.buffer, 'amana/id-verifications', 'image'),
      documentType === 'ID_CARD' ? uploadPrivate(back.buffer, 'amana/id-verifications', 'image') : Promise.resolve(null),
      uploadPrivate(video.buffer, 'amana/id-verifications', 'video'),
    ]);

    const data = {
      documentType, frontPhoto: frontRef, backPhoto: backRef, selfieVideo: videoRef,
      challengeCode: challenge.code, consentAt: new Date(), status: 'PENDING', reviewNote: null, reviewedAt: null,
    };
    // A new attempt replaces the previous one: its files are no longer needed.
    const previous = await prisma.idVerification.findUnique({ where: { userId: req.user.id } });
    if (previous && !req.user.legalHoldAt) await Promise.all([previous.frontPhoto, previous.backPhoto, previous.selfieVideo].map(destroyMedia));
    const verification = await prisma.idVerification.upsert({
      where: { userId: req.user.id },
      update: data,
      create: { userId: req.user.id, ...data },
    });

    res.json({ success: true, verification: { id: verification.id, status: verification.status, documentType } });
  } catch (err) { next(err); }
};

// Public profile — visible to any logged-in user (used on trip search to view traveler)
const getPublicProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.userId },
      select: {
        id: true, name: true, photoUrl: true, bio: true,
        rating: true, reviewCount: true, isVerified: true, createdAt: true, deletedAt: true,
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
    if (!user || user.deletedAt) throw new AppError('User not found', 404);
    const { deletedAt, ...profile } = user;
    res.json({ success: true, user: profile });
  } catch (err) { next(err); }
};

// GET /api/users/me/export — a copy of all personal data we hold (GDPR access / portability).
const exportMyData = async (req, res, next) => {
  try {
    const data = await exportUserData(req.user.id);
    res.set('Content-Disposition', `attachment; filename="amana-data-${new Date().toISOString().slice(0, 10)}.json"`);
    res.json(data);
  } catch (err) { next(err); }
};

// DELETE /api/users/me  body: { confirm: "DELETE" } — the user closes their own account (GDPR erasure).
const deleteMyAccount = async (req, res, next) => {
  try {
    if (req.body.confirm !== 'DELETE') throw new AppError('Confirmation missing', 400);
    const result = await closeAccount(req.user.id);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

module.exports = { changePassword, exportMyData, deleteMyAccount, getProfile, updateProfile, getIdChallenge, uploadIdVerification, getPublicProfile };
