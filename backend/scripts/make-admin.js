// Usage: node scripts/make-admin.js +41791234567
// Gives an EXISTING account (the person must have signed in once) the ADMIN role.
// Run it against the hosted database, e.g. from Railway's shell for the backend service.
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

(async () => {
  const phone = (process.argv[2] || '').trim();
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
    console.error('Usage: node scripts/make-admin.js +<country code and number>');
    process.exit(1);
  }
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      console.error(`No account with ${phone} yet — sign in to Amana with that number once, then run this again.`);
      process.exit(1);
    }
    await prisma.user.update({ where: { id: user.id }, data: { role: 'ADMIN', isVerified: true } });
    console.log(`✔ ${user.name} (${phone}) is now an admin.`);
  } finally {
    await prisma.$disconnect();
  }
})();
