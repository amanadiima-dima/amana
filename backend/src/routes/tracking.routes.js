const express = require('express');
const { body } = require('express-validator');
const multer = require('multer');
const { addTrackingEvent, getTrackingHistory } = require('../controllers/tracking.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();
router.use(authenticate);

router.post('/:bookingId',
  upload.single('photo'),
  [body('status').isIn(['PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED']), body('note').optional().isString(), body('code').optional().isString()],
  validate,
  addTrackingEvent
);

router.get('/:bookingId', getTrackingHistory);

module.exports = router;
