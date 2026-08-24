const express = require('express');
const { listNotifications, markRead } = require('../controllers/notification.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();
router.use(authenticate);

router.get('/', listNotifications);
router.patch('/:id/read', markRead);

module.exports = router;
