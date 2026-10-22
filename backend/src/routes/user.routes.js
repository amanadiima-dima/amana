const express = require('express');
const { body } = require('express-validator');
const multer = require('multer');
const { changePassword, exportMyData, deleteMyAccount, getProfile, updateProfile, getIdChallenge, uploadIdVerification, getPublicProfile } = require('../controllers/user.controller');
const { AppError } = require('../middlewares/error.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');

const upload = multer({ storage: multer.memoryStorage() });
// ID documents + selfie video: size-capped and type-checked (photos must be images, the selfie a video).
const idUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024, files: 3 },
  fileFilter: (_req, file, cb) => {
    const ok = file.fieldname === 'video' ? file.mimetype.startsWith('video/') : file.mimetype.startsWith('image/');
    cb(ok ? null : new AppError(file.fieldname === 'video' ? 'The selfie must be a video file' : 'ID photos must be image files', 400), ok);
  },
});
const router = express.Router();

router.use(authenticate);

router.get('/me', getProfile);
router.get('/me/export', exportMyData);
router.delete('/me', deleteMyAccount);
router.patch('/me',
  [body('name').optional().isString().trim(), body('bio').optional().isString(),
    body('email').optional({ values: 'null' }).custom((v) => v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v))).withMessage('Enter a valid email address')],
  validate,
  updateProfile
);
router.post('/me/password',
  [body('newPassword').isString().isLength({ min: 8, max: 128 }).withMessage('The password must have at least 8 characters')],
  validate,
  changePassword
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
router.get('/me/id-verification/challenge', getIdChallenge);
router.post('/me/id-verification',
  (req, res, next) => idUpload.fields([{ name: 'front', maxCount: 1 }, { name: 'back', maxCount: 1 }, { name: 'video', maxCount: 1 }])(req, res, (err) => {
    if (err && err.code === 'LIMIT_FILE_SIZE') return next(new AppError('File too large (max 30 MB)', 413));
    next(err);
  }),
  uploadIdVerification
);

// Public profile — any authenticated user can view another user's profile & reviews
router.get('/:userId', getPublicProfile);

module.exports = router;
