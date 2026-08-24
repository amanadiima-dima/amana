const express = require('express');
const { body, query } = require('express-validator');
const {
  createTrip, listMyTrips, searchTrips, publicSearchTrips, getTrip, updateTrip, cancelTrip, getTripBookings,
} = require('../controllers/trip.controller');
const { authenticate, requireVerified } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');

const router = express.Router();

// ── Public (no auth) ─────────────────────────────────────────────────────────
router.get('/public', publicSearchTrips);

// ── Protected ────────────────────────────────────────────────────────────────
router.use(authenticate);

router.get('/search',
  [
    query('destination').optional().isString(),
    query('date').optional().isISO8601(),
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
    body('originAddress').optional().isString(),
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
