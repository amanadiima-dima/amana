const prisma = require('../utils/prisma');
const { AppError } = require('../middlewares/error.middleware');

const listUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const users = await prisma.user.findMany({
      skip: (page - 1) * limit,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      select: { id: true, phone: true, name: true, isVerified: true, isActive: true, rating: true, createdAt: true },
    });
    res.json({ success: true, users });
  } catch (err) { next(err); }
};

const listPendingVerifications = async (req, res, next) => {
  try {
    const verifications = await prisma.idVerification.findMany({
      where: { status: 'PENDING' },
      include: { user: { select: { id: true, name: true, phone: true } } },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, verifications });
  } catch (err) { next(err); }
};

const reviewVerification = async (req, res, next) => {
  try {
    const { status, reviewNote } = req.body;
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      throw new AppError('Status must be APPROVED or REJECTED', 400);
    }

    const verification = await prisma.idVerification.update({
      where: { id: req.params.id },
      data: { status, reviewNote },
    });

    if (status === 'APPROVED') {
      await prisma.user.update({ where: { id: verification.userId }, data: { isVerified: true } });
    }

    res.json({ success: true, verification });
  } catch (err) { next(err); }
};

module.exports = { listUsers, listPendingVerifications, reviewVerification };
