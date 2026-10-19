/**
 * Amana seed script — creates 10 test users + trips
 * Run: node prisma/seed.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ROUTES = [
  { origin: 'Paris', destination: 'Algiers' },
  { origin: 'Lyon', destination: 'Oran' },
  { origin: 'Marseille', destination: 'Constantine' },
  { origin: 'Brussels', destination: 'Algiers' },
  { origin: 'Amsterdam', destination: 'Casablanca' },
  { origin: 'Madrid', destination: 'Tunis' },
  { origin: 'Milan', destination: 'Algiers' },
  { origin: 'Frankfurt', destination: 'Oran' },
  { origin: 'London', destination: 'Casablanca' },
  { origin: 'Geneva', destination: 'Algiers' },
];

const NOTES = [
  'No liquids please. Fragile items accepted.',
  'Small boxes only. Max 40x30x20 cm.',
  'Happy to carry clothes, books, accessories.',
  'No food items. Documents and electronics ok.',
  'Up to 10 kg total. Well-packed items only.',
];

function futureDate(daysFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(10 + Math.floor(Math.random() * 8), 0, 0, 0);
  return d;
}

async function main() {
  console.log('🌱 Seeding Amana database...\n');

  // ── Admin ────────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { phone: '+10000000099' },
    update: { role: 'ADMIN', isVerified: true },
    create: { phone: '+10000000099', name: 'admin', role: 'ADMIN', isVerified: true },
  });
  console.log(`✅ Admin created: ${admin.name} (${admin.phone})`);

  // ── Senders ──────────────────────────────────────────────────────────────
  const senders = [];
  for (let i = 1; i <= 5; i++) {
    const user = await prisma.user.upsert({
      where: { phone: `+1000000000${i}` },
      update: {},
      create: {
        phone: `+1000000000${i}`,
        name: `sender_${i}`,
        role: 'SENDER',
        isVerified: true,
        rating: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
        reviewCount: Math.floor(Math.random() * 20),
      },
    });
    senders.push(user);
    console.log(`✅ Sender created: ${user.name} (${user.phone})`);
  }

  // ── Travelers ─────────────────────────────────────────────────────────────
  const travelers = [];
  for (let i = 1; i <= 5; i++) {
    const user = await prisma.user.upsert({
      where: { phone: `+1000000001${i}` },
      update: {},
      create: {
        phone: `+1000000001${i}`,
        name: `traveler_${i}`,
        role: 'TRAVELER',
        isVerified: true,
        rating: parseFloat((3.8 + Math.random() * 1.2).toFixed(1)),
        reviewCount: Math.floor(Math.random() * 30 + 5),
      },
    });
    travelers.push(user);
    console.log(`✅ Traveler created: ${user.name} (${user.phone})`);
  }

  // ── Trips (2 per traveler = 10 trips) ────────────────────────────────────
  const existingTrips = await prisma.trip.count();
  if (existingTrips > 0) {
    console.log(`\n🗺  Skipping trip creation — ${existingTrips} trip(s) already exist.`);
  } else {
  console.log('\n🗺  Creating trips...');
  for (let t = 0; t < travelers.length; t++) {
    const traveler = travelers[t];
    for (let j = 0; j < 2; j++) {
      const route = ROUTES[t * 2 + j];
      const trip = await prisma.trip.create({
        data: {
          travelerId: traveler.id,
          originCity: route.origin,
          destinationCity: route.destination,
          departureAt: futureDate(7 + t * 4 + j * 3),
          maxWeightKg: parseFloat((5 + Math.random() * 15).toFixed(1)),
          pricePerKg: parseFloat((2 + Math.random() * 4).toFixed(2)),
          notes: NOTES[(t + j) % NOTES.length],
          status: 'OPEN',
        },
      });
      console.log(`  ✈  ${traveler.name}: ${trip.originCity} → ${trip.destinationCity} on ${trip.departureAt.toDateString()} (${trip.maxWeightKg}kg @ €${trip.pricePerKg}/kg)`);
    }
  }
  }

  console.log('\n✨ Seed complete!');
  console.log('   Admin    : admin                | phone  +10000000099');
  console.log('   Senders  : sender_1 … sender_5  | phones +10000000001–+10000000005');
  console.log('   Travelers: traveler_1 … traveler_5 | phones +10000000011–+10000000015');
  console.log('   All users have OTP bypass enabled — use code 123456 to log in.\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
