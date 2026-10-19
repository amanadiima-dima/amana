const express = require('express');
const { body } = require('express-validator');
const {
  createBooking, respondToBooking, cancelBooking, getBooking, listMyBookings, openDispute,
} = require('../controllers/booking.controller');
const { listMessages, sendMessage } = require('../controllers/message.controller');
const { authenticate, requireVerified } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');

const router = express.Router();
router.use(authenticate);

// Sender creates a booking request
router.post('/',
  requireVerified,
  [body('tripId').isString(), body('parcelRequestId').isString(), body('priorityTip').optional({ checkFalsy: true }).isFloat({ min: 0, max: 100000 }), body('locale').optional().isIn(['en', 'fr', 'es', 'ar']), body('payerPhone').optional({ checkFalsy: true }).matches(/^\+[1-9]\d{7,14}$/).withMessage('Recipient phone must be in international format, e.g. +33612345678')],
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
router.post('/:id/dispute', [body('reason').isString()], validate, openDispute);

// Chat between the sender and traveler on a booking
router.get('/:id/messages', listMessages);
router.post('/:id/messages',
  [body('body').isString().trim().notEmpty()],
  validate,
  sendMessage
);

router.get('/:id', getBooking);
router.get('/', listMyBookings);

module.exports = router;
