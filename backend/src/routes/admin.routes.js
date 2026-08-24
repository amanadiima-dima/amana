const express = require('express');
const { listPendingVerifications, reviewVerification, listUsers } = require('../controllers/admin.controller');
const { authenticate, requireAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();
router.use(authenticate, requireAdmin);

router.get('/users', listUsers);
router.get('/verifications', listPendingVerifications);
router.patch('/verifications/:id', reviewVerification);

module.exports = router;
