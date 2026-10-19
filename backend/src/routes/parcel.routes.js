const express = require('express');
const { body } = require('express-validator');
const multer = require('multer');
const { createParcel, listMyParcels, getParcel } = require('../controllers/parcel.controller');
const { authenticate, requireVerified } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();
router.use(authenticate);

router.post('/',
  requireVerified,
  upload.array('photos', 5),
  [
    body('pickupAddress').isString().trim(),
    body('deliveryAddress').isString().trim(),
    body('weightKg').isFloat({ min: 0.1, max: 2000 }),
    body('estimatedValue').optional({ checkFalsy: true }).isFloat({ min: 0 }),
    body('description').isString().trim(),
  ],
  validate,
  createParcel
);

router.get('/my', listMyParcels);
router.get('/:id', getParcel);

module.exports = router;
