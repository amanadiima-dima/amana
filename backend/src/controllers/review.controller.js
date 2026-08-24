const prisma = require('../utils/prisma');
const { AppError } = require('../middlewares/error.middleware');

const createReview = async (req, res, next) => {
  try {
    const { bookingId, rating, comment } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        trip: true,
        reviews: { select: { reviewerId: true } },
      },
    });

    if (!booking) throw new AppError('Booking not found', 404);
    if (booking.status !== 'COMPLETED') throw new AppError('Can only review completed bookings', 400);

    const isSender = booking.senderId === req.user.id;
    const isTraveler = booking.trip.travelerId === req.user.id;
    if (!isSender && !isTraveler) throw new AppError('Forbidden', 403);

    // Each party can leave exactly one review per booking
    const alreadyReviewed = booking.reviews.some((r) => r.reviewerId === req.user.id);
    if (alreadyReviewed) throw new AppError('You have already reviewed this booking', 400);

    const revieweeId = isSender ? booking.trip.travelerId : booking.senderId;

    const review = await prisma.review.create({
      data: { bookingId, reviewerId: req.user.id, revieweeId, rating, comment },
      include: {
        reviewer: { select: { id: true, name: true, photoUrl: true } },
        reviewee: { select: { id: true, name: true } },
      },
    });

    // Update reviewee's aggregate rating on their profile
    const stats = await prisma.review.aggregate({
      where: { revieweeId },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await prisma.user.update({
      where: { id: revieweeId },
      data: { rating: stats._avg.rating || 0, reviewCount: stats._count.rating },
    });

    res.status(201).json({ success: true, review });
  } catch (err) { next(err); }
};

// Reviews left FOR a specific user (shown on their public profile)
const getUserReviews = async (req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { revieweeId: req.params.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        reviewer: { select: { id: true, name: true, photoUrl: true } },
        booking: {
          select: {
            trip: { select: { originCity: true, destinationCity: true, departureAt: true } },
          },
        },
      },
    });
    res.json({ success: true, reviews });
  } catch (err) { next(err); }
};

module.exports = { createReview, getUserReviews };

