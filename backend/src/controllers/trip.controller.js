const prisma = require('../utils/prisma');
const { AppError } = require('../middlewares/error.middleware');

const createTrip = async (req, res, next) => {
  try {
    const { originCity, destinationCity, originAddress, departureAt, maxWeightKg, pricePerKg, notes } = req.body;
    const trip = await prisma.trip.create({
      data: {
        travelerId: req.user.id,
        originCity,
        destinationCity,
        originAddress,
        departureAt: new Date(departureAt),
        maxWeightKg,
        pricePerKg,
        notes,
      },
    });
    res.status(201).json({ success: true, trip });
  } catch (err) { next(err); }
};

const listMyTrips = async (req, res, next) => {
  try {
    const trips = await prisma.trip.findMany({
      where: { travelerId: req.user.id },
      orderBy: { departureAt: 'desc' },
      include: { _count: { select: { bookings: true } } },
    });
    res.json({ success: true, trips });
  } catch (err) { next(err); }
};

const searchTrips = async (req, res, next) => {
  try {
    const { destination, date, minWeight } = req.query;

    const where = {
      destinationCity: { contains: destination, mode: 'insensitive' },
      status: 'OPEN',
      travelerId: { not: req.user.id }, // exclude own trips
      ...(minWeight && { maxWeightKg: { gte: parseFloat(minWeight) } }),
    };

    // filter by date only if provided
    if (date) {
      const from = new Date(date);
      const to = new Date(date);
      to.setDate(to.getDate() + 1);
      where.departureAt = { gte: from, lt: to };
    }

    const trips = await prisma.trip.findMany({
      where,
      include: {
        traveler: { select: { id: true, name: true, photoUrl: true, rating: true, reviewCount: true, isVerified: true } },
      },
      orderBy: { pricePerKg: 'asc' },
    });
    res.json({ success: true, trips });
  } catch (err) { next(err); }
};

const getTrip = async (req, res, next) => {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: req.params.id },
      include: {
        traveler: { select: { id: true, name: true, photoUrl: true, rating: true, reviewCount: true, isVerified: true } },
        bookings: {
          where: { status: { in: ['ACCEPTED', 'COMPLETED'] } },
          select: { parcelRequest: { select: { weightKg: true } } },
        },
      },
    });
    if (!trip) throw new AppError('Trip not found', 404);

    const usedWeight = trip.bookings.reduce((sum, b) => sum + b.parcelRequest.weightKg, 0);
    res.json({ success: true, trip: { ...trip, availableWeightKg: trip.maxWeightKg - usedWeight } });
  } catch (err) { next(err); }
};

const getTripBookings = async (req, res, next) => {
  try {
    const trip = await prisma.trip.findUnique({ where: { id: req.params.id } });
    if (!trip) throw new AppError('Trip not found', 404);
    if (trip.travelerId !== req.user.id) throw new AppError('Forbidden', 403);

    const bookings = await prisma.booking.findMany({
      where: { tripId: req.params.id },
      orderBy: { createdAt: 'desc' },
      include: {
        parcelRequest: {
          include: { sender: { select: { id: true, name: true, phone: true, photoUrl: true, rating: true, isVerified: true } } },
        },
        payment: { select: { status: true, grossAmount: true } },
      },
    });
    res.json({ success: true, bookings });
  } catch (err) { next(err); }
};


  try {
    const trip = await prisma.trip.findUnique({ where: { id: req.params.id } });
    if (!trip) throw new AppError('Trip not found', 404);
    if (trip.travelerId !== req.user.id) throw new AppError('Forbidden', 403);
    if (trip.status !== 'OPEN') throw new AppError('Only open trips can be updated', 400);

    const { notes, maxWeightKg, pricePerKg, departureAt } = req.body;
    const updated = await prisma.trip.update({
      where: { id: req.params.id },
      data: {
        ...(notes !== undefined && { notes }),
        ...(maxWeightKg && { maxWeightKg }),
        ...(pricePerKg && { pricePerKg }),
        ...(departureAt && { departureAt: new Date(departureAt) }),
      },
    });
    res.json({ success: true, trip: updated });
  } catch (err) { next(err); }
};

const cancelTrip = async (req, res, next) => {
  try {
    const trip = await prisma.trip.findUnique({ where: { id: req.params.id } });
    if (!trip) throw new AppError('Trip not found', 404);
    if (trip.travelerId !== req.user.id) throw new AppError('Forbidden', 403);
    if (!['OPEN', 'FULL'].includes(trip.status)) throw new AppError('Cannot cancel this trip', 400);

    await prisma.trip.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' } });
    // TODO: refund any accepted bookings
    res.json({ success: true, message: 'Trip cancelled' });
  } catch (err) { next(err); }
};

const publicSearchTrips = async (req, res, next) => {
  try {
    const { destination, origin, date } = req.query;

    const where = {
      status: 'OPEN',
      departureAt: { gte: new Date() },
    };

    if (destination) where.destinationCity = { contains: destination, mode: 'insensitive' };
    if (origin) where.originCity = { contains: origin, mode: 'insensitive' };

    if (date) {
      const from = new Date(date);
      const to = new Date(date);
      to.setDate(to.getDate() + 1);
      where.departureAt = { gte: from, lt: to };
    } else {
      where.departureAt = { gte: new Date() };
    }

    const trips = await prisma.trip.findMany({
      where,
      include: {
        traveler: { select: { isVerified: true } }, // no name/rating/photo on public endpoint
        _count: { select: { bookings: true } },
      },
      orderBy: { departureAt: 'asc' },
      take: 20,
    });

    res.json({ success: true, trips });
  } catch (err) { next(err); }
};

module.exports = { createTrip, listMyTrips, searchTrips, publicSearchTrips, getTrip, updateTrip, cancelTrip, getTripBookings };
