const express = require('express');
const { listPendingVerifications, reviewVerification, listUsers, listDisputes, resolveDispute, listStaff, addStaff, removeStaff, listActivity } = require('../controllers/admin.controller');
const { authenticate, requireAdmin, requireStaff } = require('../middlewares/auth.middleware');

const router = express.Router();
router.use(authenticate);

// Admins and the moderators they appoint: ID reviews + disputes
router.get('/verifications', requireStaff, listPendingVerifications);
router.patch('/verifications/:id', requireStaff, reviewVerification);
router.get('/disputes', requireStaff, listDisputes);
router.patch('/disputes/:id', requireStaff, resolveDispute);

// Admin only: user list, team management, activity log
router.get('/users', requireAdmin, listUsers);
router.get('/staff', requireAdmin, listStaff);
router.post('/staff', requireAdmin, addStaff);
router.delete('/staff/:userId', requireAdmin, removeStaff);
router.get('/activity', requireAdmin, listActivity);

module.exports = router;
