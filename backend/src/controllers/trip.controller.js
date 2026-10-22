const prisma = require('../utils/prisma');
const { AppError } = require('../middlewares/error.middleware');
const { makeMatcher, currencyForCity } = require('../utils/nearbyCities');

const CURRENCIES = ['EUR', 'CHF', 'MAD', 'DZD', 'TND', 'GBP', 'USD'];
const { expireStaleBookings } = require('../services/bookingExpiry.service');
const { refundPayment } = require('../services/payment.service');
const { notifyUsers } = require('../services/notify.service');

// Sanity bounds only (catch typos like an extra zero). Real capacity/price are the traveler's call;
// per-booking capacity is enforced against the trip itself.
const LIMITS = { maxWeightKg: [0.1, 2000], pricePerKg: [0, 100000] };
const checkRange = (name, value) => {
  if (value === undefined || value === null || value === '') return;
  const n = Number(value);
  const [min, max] = LIMITS[name];
  if (!Number.isFinite(n) || n < min || n > max) throw new AppError(`${name} must be between ${min} and ${max}`, 400);
};

const createTrip = async (req, res, next) => {
  try {
    const {
      originCity, destinationCity, originAddress, originLat, originLng,
      mode, estimatedDurationMinutes, departureAt, maxWeightKg, pricePerKg, notes,
    } = req.body;
    // Currency follows the departure country (where the sender is); the traveler may override.
    const currency = CURRENCIES.includes(req.body.currency) ? req.body.currency : (currencyForCity(originCity) || 'EUR');
    checkRange('maxWeightKg', maxWeightKg);
    checkRange('pricePerKg', pricePerKg);
    if (new Date(departureAt) <= new Date()) throw new AppError('Departure must be in the future', 400);
    const trip = await prisma.trip.create({
      data: {
        travelerId: req.user.id,
        currency,
        originCity,
        destinationCity,
        originAddress,
        originLat: originLat != null ? parseFloat(originLat) : null,
        originLng: originLng != null ? parseFloat(originLng) : null,
        mode: mode || 'PLANE',
        estimatedDurationMinutes: estimatedDurationMinutes != null ? parseInt(estimatedDurationMinutes, 10) : null,
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
      include: {
        _count: { select: { bookings: true } },
        bookings: { select: { status: true } },
      },
    });
    res.json({ success: true, trips });
  } catch (err) { next(err); }
};

const searchTrips = async (req, res, next) => {
  try {
    const { origin, destination, date, minWeight } = req.query;

    // Everything is optional. Date means "on or after"; past trips never show.
    const now = new Date();
    let from = now;
    if (date) {
      const d = new Date(date);
      if (!Number.isNaN(d.getTime()) && d > now) from = d;
    }

    const o = makeMatcher(origin);
    const d = makeMatcher(destination);

    const trips = await prisma.trip.findMany({
      where: {
        AND: [
          ...(o ? [o.where('originCity')] : []),
          ...(d ? [d.where('destinationCity')] : []),
        ],
        status: 'OPEN',
        departureAt: { gte: from },
        travelerId: { not: req.user.id }, // exclude own trips
        ...(minWeight && { maxWeightKg: { gte: parseFloat(minWeight) } }),
      },
      include: {
        traveler: { select: { id: true, name: true, photoUrl: true, rating: true, reviewCount: true, isVerified: true } },
      },
    });

    const results = [];
    for (const t of trips) {
      const originDistanceKm = o ? o.distanceOf(t.originCity) : null;
      const destinationDistanceKm = d ? d.distanceOf(t.destinationCity) : null;
      if (originDistanceKm === null && o) continue;
      if (destinationDistanceKm === null && d) continue;
      const total = (originDistanceKm || 0) + (destinationDistanceKm || 0);
      results.push({
        ...t,
        originDistanceKm,
        destinationDistanceKm,
        matchType: total === 0 ? 'exact' : 'nearby',
        distanceKm: total,
      });
    }

    results.sort((a, b) => a.distanceKm - b.distanceKm || new Date(a.departureAt) - new Date(b.departureAt));

    res.json({ success: true, trips: results });
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
    await expireStaleBookings();
    const trip = await prisma.trip.findUnique({ where: { id: req.params.id } });
    if (!trip) throw new AppError('Trip not found', 404);
    if (trip.travelerId !== req.user.id) throw new AppError('Forbidden', 403);

    const bookings = await prisma.booking.findMany({
      where: { tripId: req.params.id, status: { not: 'PAYMENT_PENDING' } },
      orderBy: { createdAt: 'desc' },
      include: {
        parcelRequest: {
          include: { sender: { select: { id: true, name: true, photoUrl: true, rating: true, isVerified: true } } },
        },
        payment: { select: { status: true, grossAmount: true } },
      },
    });
    res.json({ success: true, bookings });
  } catch (err) { next(err); }
};

const updateTrip = async (req, res, next) => {
  try {
    const trip = await prisma.trip.findUnique({ where: { id: req.params.id } });
    if (!trip) throw new AppError('Trip not found', 404);
    if (trip.travelerId !== req.user.id) throw new AppError('Forbidden', 403);
    if (trip.status !== 'OPEN') throw new AppError('Only open trips can be updated', 400);

    checkRange('maxWeightKg', req.body.maxWeightKg);
    checkRange('pricePerKg', req.body.pricePerKg);
    if (req.body.departureAt && new Date(req.body.departureAt) <= new Date()) throw new AppError('Departure must be in the future', 400);

    // Once senders have requested or booked space, the deal terms are frozen.
    const active = await prisma.booking.count({ where: { tripId: trip.id, status: { in: ['PAYMENT_PENDING', 'PENDING', 'ACCEPTED', 'DISPUTED'] } } });
    const changesTerms = ['maxWeightKg', 'pricePerKg', 'departureAt'].some((k) => req.body[k] !== undefined && String(req.body[k]) !== String(k === 'departureAt' ? trip[k]?.toISOString?.() : trip[k]));
    if (active > 0 && changesTerms) {
      throw new AppError('This trip has active bookings — price, capacity and date can no longer be changed', 409);
    }

    const {
      notes, maxWeightKg, pricePerKg, departureAt,
      mode, estimatedDurationMinutes, originAddress, originLat, originLng,
    } = req.body;
    const updated = await prisma.trip.update({
      where: { id: req.params.id },
      data: {
        ...(notes !== undefined && { notes }),
        ...(maxWeightKg && { maxWeightKg }),
        ...(pricePerKg && { pricePerKg }),
        ...(departureAt && { departureAt: new Date(departureAt) }),
        ...(mode && { mode }),
        ...(estimatedDurationMinutes !== undefined && {
          estimatedDurationMinutes: estimatedDurationMinutes != null ? parseInt(estimatedDurationMinutes, 10) : null,
        }),
        ...(originAddress !== undefined && { originAddress }),
        ...(originLat !== undefined && { originLat: originLat != null ? parseFloat(originLat) : null }),
        ...(originLng !== undefined && { originLng: originLng != null ? parseFloat(originLng) : null }),
      },
    });
    res.json({ success: true, trip: updated });
  } catch (err) { next(err); }
};

const cancelTrip = async (req, res, next) => {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: req.params.id },
      include: {
        bookings: {
          where: { status: { in: ['PAYMENT_PENDING', 'PENDING', 'ACCEPTED', 'DISPUTED'] } },
          include: { payment: true, _count: { select: { trackingEvents: true } } },
        },
      },
    });
    if (!trip) throw new AppError('Trip not found', 404);
    if (trip.travelerId !== req.user.id) throw new AppError('Forbidden', 403);
    if (!['OPEN', 'FULL'].includes(trip.status)) throw new AppError('Cannot cancel this trip', 400);

    // Parcels already collected (or under dispute) can't just be abandoned.
    if (trip.bookings.some((b) => b.status === 'DISPUTED' || b._count.trackingEvents > 0)) {
      throw new AppError('A parcel is already with you or under dispute — deliver it or contact support before cancelling', 409);
    }

    const route = `${trip.originCity} → ${trip.destinationCity}`;
    for (const b of trip.bookings) {
      if (b.payment?.status === 'HELD') await refundPayment(b.payment);
      await prisma.booking.update({ where: { id: b.id }, data: { status: 'CANCELLED' } });
    }
    await prisma.trip.update({ where: { id: trip.id }, data: { status: 'CANCELLED' } });
    await notifyUsers(
      trip.bookings.flatMap((b) => [b.senderId, b.payerId]),
      'Trip cancelled by the traveler',
      `${route}: the traveler cancelled this trip. Any payment has been refunded in full.`,
      { type: 'TRIP_CANCELLED' }
    );
    res.json({ success: true, message: 'Trip cancelled', cancelledBookings: trip.bookings.length });
  } catch (err) { next(err); }
};

// GET /api/trips/public?origin=&destination=&date=YYYY-MM-DD — public search for the landing page.
// Everything is optional. With a date, `trips` holds that day's trips and `similar` the same route on
// other upcoming dates, closest to the requested day first (shown in date order).
const PUBLIC_TRIP_INCLUDE = {
  traveler: { select: { isVerified: true } }, // no name/rating/photo on public endpoint
  _count: { select: { bookings: true } },
};
const publicSearchTrips = async (req, res, next) => {
  try {
    const { destination, origin, date } = req.query;
    const now = new Date();
    const route = { status: 'OPEN' };
    if (destination) route.destinationCity = { contains: String(destination).trim(), mode: 'insensitive' };
    if (origin) route.originCity = { contains: String(origin).trim(), mode: 'insensitive' };

    const day = /^\d{4}-\d{2}-\d{2}$/.test(String(date || '')) ? new Date(`${date}T00:00:00Z`) : null;
    if (!day || Number.isNaN(day.getTime())) {
      const trips = await prisma.trip.findMany({ where: { ...route, departureAt: { gte: now } }, include: PUBLIC_TRIP_INCLUDE, orderBy: { departureAt: 'asc' }, take: 20 });
      return res.json({ success: true, trips, similar: [] });
    }

    const dayEnd = new Date(day.getTime() + 24 * 60 * 60 * 1000);
    const from = day > now ? day : now; // today: only trips that haven't left yet
    const [trips, others] = await Promise.all([
      prisma.trip.findMany({ where: { ...route, departureAt: { gte: from, lt: dayEnd } }, include: PUBLIC_TRIP_INCLUDE, orderBy: { departureAt: 'asc' }, take: 20 }),
      prisma.trip.findMany({
        where: { ...route, departureAt: { gte: now }, NOT: { departureAt: { gte: day, lt: dayEnd } } },
        include: PUBLIC_TRIP_INCLUDE, orderBy: { departureAt: 'asc' }, take: 100,
      }),
    ]);
    const mid = day.getTime() + 12 * 60 * 60 * 1000;
    const similar = others
      .sort((a, b) => Math.abs(a.departureAt - mid) - Math.abs(b.departureAt - mid))
      .slice(0, 10)
      .sort((a, b) => a.departureAt - b.departureAt);
    res.json({ success: true, trips, similar });
  } catch (err) { next(err); }
};

// GET /api/trips/popular-routes — public: routes with upcoming open trips, the cheapest price per kg
// in each currency and the next departure. Feeds the landing page cards and footer links.
// Optional ?destination= keeps only routes to that city.
const popularRoutes = async (req, res, next) => {
  try {
    const destination = String(req.query.destination || '').trim();
    const groups = await prisma.trip.groupBy({
      by: ['originCity', 'destinationCity', 'currency'],
      where: {
        status: 'OPEN', departureAt: { gte: new Date() },
        ...(destination && { destinationCity: { equals: destination, mode: 'insensitive' } }),
      },
      _count: { _all: true },
      _min: { pricePerKg: true, departureAt: true },
    });
    const routes = groups
      .map((g) => ({
        originCity: g.originCity, destinationCity: g.destinationCity, currency: g.currency,
        trips: g._count._all, minPricePerKg: g._min.pricePerKg, nextDepartureAt: g._min.departureAt,
      }))
      .sort((a, b) => b.trips - a.trips || a.nextDepartureAt - b.nextDepartureAt)
      .slice(0, 12);
    res.json({ success: true, routes });
  } catch (err) { next(err); }
};

module.exports = { popularRoutes, createTrip, listMyTrips, searchTrips, publicSearchTrips, getTrip, updateTrip, cancelTrip, getTripBookings };
