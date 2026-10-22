const express = require('express');
const { listPendingVerifications, reviewVerification, listUsers, listDisputes, resolveDispute, listStaff, addStaff, removeStaff, listActivity, setUserActive, deleteUser, setLegalHold, getUserIdentity } = require('../controllers/admin.controller');
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
router.patch('/users/:id/active', requireAdmin, setUserActive);
router.delete('/users/:id', requireAdmin, deleteUser);
router.patch('/users/:id/legal-hold', requireAdmin, setLegalHold);
router.get('/users/:id/identity', requireAdmin, getUserIdentity);
router.get('/staff', requireAdmin, listStaff);
router.post('/staff', requireAdmin, addStaff);
router.delete('/staff/:userId', requireAdmin, removeStaff);
router.get('/activity', requireAdmin, listActivity);

module.exports = router;
