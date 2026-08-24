const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const { AppError } = require('./error.middleware');

const authenticate = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 401);
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new AppError('Invalid or expired token', 401));
    }
    next(err);
  }
};

const requireAdmin = (req, _res, next) => {
  if (req.user?.role !== 'ADMIN') {
    return next(new AppError('Admin access required', 403));
  }
  next();
};

const requireVerified = (req, _res, next) => {
  if (!req.user?.isVerified) {
    return next(new AppError('ID verification required to perform this action', 403));
  }
  next();
};

module.exports = { authenticate, requireAdmin, requireVerified };
