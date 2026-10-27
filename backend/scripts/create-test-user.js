// Usage: node scripts/create-test-user.js +447700900101 "Samia" "Test"
// Creates (or resets) a beta TEST account: ID marked verified, Terms accepted, a new random password printed here.
// The phone must also be listed in TEST_PHONES so it signs in with code 123456 (no SMS).
// Run it against the hosted database, e.g. from Railway's shell for the backend service.
require('dotenv').config();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

(async () => {
  const [phone = '', name = 'Tester', lastName = 'Beta'] = process.argv.slice(2).map((a) => a.trim());
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
    console.error('Usage: node scripts/create-test-user.js +<country code and number> "<first name>" "<last name>"');
    process.exit(1);
  }
  // Easy to read out and type on a phone: lower-case, no look-alikes (0/o, 1/l/i), e.g. "amana-k7m4-x9p2".
  const abc = 'abcdefghjkmnpqrstuvwxyz23456789';
  const chunk = () => Array.from({ length: 4 }, () => abc[crypto.randomInt(abc.length)]).join('');
  const password = `amana-${chunk()}-${chunk()}`;
  const data = { name, lastName, passwordHash: await bcrypt.hash(password, 10), isVerified: true, isActive: true, termsAcceptedAt: new Date() };
  const prisma = new PrismaClient();
  try {
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing && !(process.env.TEST_PHONES || '').split(',').map((p) => p.trim()).includes(phone)) {
      console.error(`${phone} already belongs to a real account and is not in TEST_PHONES — refusing to reset it.`);
      process.exit(1);
    }
    await prisma.user.upsert({ where: { phone }, update: data, create: { ...data, phone, birthDate: new Date('1990-01-01') } });
    console.log(`✔ Test account ${existing ? 'reset' : 'created'}: ${name} ${lastName}`);
    console.log(`  Phone:    ${phone}`);
    console.log(`  Password: ${password}`);
    console.log('  SMS code: 123456');
    if (!(process.env.TEST_PHONES || '').split(',').map((p) => p.trim()).includes(phone)) {
      console.log(`⚠ Add ${phone} to the TEST_PHONES variable, otherwise sign-in will wait for a real SMS.`);
    }
  } finally {
    await prisma.$disconnect();
  }
})();
