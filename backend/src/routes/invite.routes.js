const express = require('express');
const { getInvite, claimInvite, declineInvite } = require('../controllers/invite.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();
router.get('/:token', getInvite);
router.post('/:token/decline', declineInvite);
router.post('/:token/claim', authenticate, claimInvite);

module.exports = router;
