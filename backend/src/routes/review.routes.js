const express = require('express');
const { body } = require('express-validator');
const { createReview, getUserReviews } = require('../controllers/review.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');

const router = express.Router();
router.use(authenticate);

router.post('/',
  [
    body('bookingId').isString(),
    body('rating').isInt({ min: 1, max: 5 }),
    body('comment').optional().isString().trim(),
  ],
  validate,
  createReview
);

router.get('/user/:userId', getUserReviews);

module.exports = router;
