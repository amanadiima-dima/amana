const express = require('express');
const { body, query } = require('express-validator');
const {
  popularRoutes, createTrip, listMyTrips, searchTrips, publicSearchTrips, getTrip, updateTrip, cancelTrip, getTripBookings,
} = require('../controllers/trip.controller');
const { authenticate, requireVerified } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');

const router = express.Router();

// ── Public (no auth) ─────────────────────────────────────────────────────────
router.get('/public', publicSearchTrips);
router.get('/popular-routes', popularRoutes);

// ── Protected ────────────────────────────────────────────────────────────────
router.use(authenticate);

router.get('/search',
  [
    query('origin').optional().isString(),
    query('destination').optional().isString(),
    query('date').optional({ checkFalsy: true }).isISO8601(),
  ],
  validate,
  searchTrips
);

router.post('/',
  requireVerified,
  [
    body('originCity').isString().trim(),
    body('destinationCity').isString().trim(),
    body('departureAt').isISO8601(),
    body('maxWeightKg').isFloat({ min: 0.1 }),
    body('pricePerKg').isFloat({ min: 0 }),
    body('notes').optional().isString(),
    body('originAddress').optional({ nullable: true }).isString(),
    body('originLat').optional({ nullable: true }).isFloat({ min: -90, max: 90 }),
    body('originLng').optional({ nullable: true }).isFloat({ min: -180, max: 180 }),
    body('currency').optional({ checkFalsy: true }).isIn(['EUR', 'CHF', 'MAD', 'DZD', 'TND', 'GBP', 'USD']),
    body('mode').optional().isIn(['PLANE', 'TRAIN', 'BUS', 'CAR', 'BOAT']),
    body('estimatedDurationMinutes').optional({ nullable: true }).isInt({ min: 0, max: 20160 }),
  ],
  validate,
  createTrip
);

router.get('/my', listMyTrips);
router.get('/:id/bookings', getTripBookings);
router.get('/:id', getTrip);
router.patch('/:id', requireVerified, updateTrip);
router.delete('/:id', requireVerified, cancelTrip);

module.exports = router;
