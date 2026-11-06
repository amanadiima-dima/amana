const prisma = require('../utils/prisma');
const { emailUsers } = require('./email.service');

const notifyUsers = async (userIds, title, body, data = {}) => {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (ids.length === 0) return;
  await prisma.notification.createMany({ data: ids.map((userId) => ({ userId, title, body, data })) });
  emailUsers(ids, title, body, data); // background: never delays or breaks the action
};

const notifyAdmins = async (title, body, data = {}) => {
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
  await notifyUsers(admins.map((a) => a.id), title, body, data);
};

module.exports = { notifyUsers, notifyAdmins };
