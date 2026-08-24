const express = require('express');
const { body } = require('express-validator');
const {
  createBooking, respondToBooking, cancelBooking, getBooking, listMyBookings,
} = require('../controllers/booking.controller');
const { authenticate, requireVerified } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');

const router = express.Router();
router.use(authenticate);

// Sender creates a booking request
router.post('/',
  requireVerified,
  [body('tripId').isString(), body('parcelRequestId').isString()],
  validate,
  createBooking
);

// Traveler accepts or rejects
router.patch('/:id/respond',
  [body('action').isIn(['accept', 'reject'])],
  validate,
  respondToBooking
);

router.delete('/:id', cancelBooking);
router.get('/:id', getBooking);
router.get('/', listMyBookings);

module.exports = router;
