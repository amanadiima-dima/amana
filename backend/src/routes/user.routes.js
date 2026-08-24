const express = require('express');
const { body } = require('express-validator');
const multer = require('multer');
const { getProfile, updateProfile, uploadIdVerification, getPublicProfile } = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.use(authenticate);

router.get('/me', getProfile);
router.patch('/me',
  [body('name').optional().isString().trim(), body('bio').optional().isString()],
  validate,
  updateProfile
);
router.post('/me/fcm-token',
  [body('token').isString()],
  validate,
  async (req, res, next) => {
    try {
      const prisma = require('../utils/prisma');
      await prisma.user.update({ where: { id: req.user.id }, data: { fcmToken: req.body.token } });
      res.json({ success: true });
    } catch (err) { next(err); }
  }
);
router.post('/me/id-verification',
  upload.fields([{ name: 'front', maxCount: 1 }, { name: 'back', maxCount: 1 }]),
  uploadIdVerification
);

// Public profile — any authenticated user can view another user's profile & reviews
router.get('/:userId', getPublicProfile);

module.exports = router;
