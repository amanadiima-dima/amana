const prisma = require('../utils/prisma');
const { AppError } = require('../middlewares/error.middleware');

const listNotifications = async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ success: true, notifications });
  } catch (err) { next(err); }
};

const unreadCount = async (req, res, next) => {
  try {
    const count = await prisma.notification.count({ where: { userId: req.user.id, read: false } });
    res.json({ success: true, count });
  } catch (err) { next(err); }
};

const markRead = async (req, res, next) => {
  try {
    const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!notification) throw new AppError('Notification not found', 404);
    if (notification.userId !== req.user.id) throw new AppError('Forbidden', 403);
    await prisma.notification.update({ where: { id: req.params.id }, data: { read: true } });
    res.json({ success: true });
  } catch (err) { next(err); }
};

module.exports = { listNotifications, unreadCount, markRead };
