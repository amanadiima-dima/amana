// E2E script — run against the LOCAL dev stack (./dev-local.sh, OTP_BYPASS=true, seeded users). See CLAUDE.md > Testing.
const API = process.env.API || 'http://localhost:3000/api';
const prisma = new (require('@prisma/client').PrismaClient)();
const call = async (m, p, t, b, f) => { const h = {}; if (t) h.Authorization = 'Bearer ' + t; let body; if (f) body = f; else if (b) { h['Content-Type'] = 'application/json'; body = JSON.stringify(b); } const r = await fetch(API + p, { method: m, headers: h, body }); return { status: r.status, data: await r.json().catch(() => ({})) }; };
const { signIn } = require('./_auth');
const login = async (phone) => (await signIn(phone)).data.accessToken;
let pass = 0, fail = 0; const T = (n, c, x = '') => { c ? pass++ : fail++; console.log(c ? 'PASS' : 'FAIL', n, x); };
const day = (n) => new Date(Date.now() + 864e5 * n).toISOString();
const parcel = (t, w = 1) => { const f = new FormData(); f.append('pickupAddress', 'a'); f.append('deliveryAddress', 'b'); f.append('weightKg', String(w)); f.append('description', 'expiry test'); return call('POST', '/parcels', t, null, f); };
const hours = (h) => new Date(Date.now() + h * 3600e3);

(async () => {
  const S = await login('+10000000002'), TR = await login('+10000000012');
  const newTrip = (dest) => call('POST', '/trips', TR, { originCity: 'Paris', destinationCity: dest + Date.now() % 1000, departureAt: day(3), maxWeightKg: 10, pricePerKg: 3, mode: 'PLANE' });

  // Past trips can't be created or booked at all
  let r = await call('POST', '/trips', TR, { originCity: 'Paris', destinationCity: 'Past', departureAt: day(-1), maxWeightKg: 5, pricePerKg: 3, mode: 'PLANE' });
  T('a trip cannot be created in the past', r.status === 400, r.data.message);

  // Pending booking whose trip departs → cancelled automatically (on listing)
  const tr1 = await newTrip('Exp'); const p1 = await parcel(S);
  const b1 = await call('POST', '/bookings', S, { tripId: tr1.data.trip.id, parcelRequestId: p1.data.parcel.id });
  await prisma.trip.update({ where: { id: tr1.data.trip.id }, data: { departureAt: hours(-2) } });
  await call('GET', '/bookings', S);
  T('PENDING booking on a departed trip is auto-cancelled', (await prisma.booking.findUnique({ where: { id: b1.data.booking.id } })).status === 'CANCELLED');

  // Traveler cannot accept after departure (and it gets cancelled)
  const tr2 = await newTrip('Late'); const p2 = await parcel(S);
  const b2 = await call('POST', '/bookings', S, { tripId: tr2.data.trip.id, parcelRequestId: p2.data.parcel.id });
  await prisma.trip.update({ where: { id: tr2.data.trip.id }, data: { departureAt: hours(-1) } });
  r = await call('PATCH', `/bookings/${b2.data.booking.id}/respond`, TR, { action: 'accept' });
  T('accepting after departure is refused', r.status === 400, r.data.message);

  // ACCEPTED but unpaid + untracked on a departed trip → cancelled; paid one is kept
  const tr3 = await newTrip('Unpaid'); const p3 = await parcel(S); const p4 = await parcel(S);
  const b3 = await call('POST', '/bookings', S, { tripId: tr3.data.trip.id, parcelRequestId: p3.data.parcel.id });
  const b4 = await call('POST', '/bookings', S, { tripId: tr3.data.trip.id, parcelRequestId: p4.data.parcel.id });
  for (const b of [b3, b4]) await call('PATCH', `/bookings/${b.data.booking.id}/respond`, TR, { action: 'accept' });
  await call('POST', '/payments/intent', S, { bookingId: b4.data.booking.id });
  await call('POST', `/payments/${b4.data.booking.id}/confirm-stub`, S);
  await prisma.trip.update({ where: { id: tr3.data.trip.id }, data: { departureAt: hours(-1) } });
  await call('GET', '/bookings', S);
  T('ACCEPTED but unpaid booking on a departed trip is cancelled', (await prisma.booking.findUnique({ where: { id: b3.data.booking.id } })).status === 'CANCELLED');
  T('ACCEPTED and PAID (money held) booking is kept', (await prisma.booking.findUnique({ where: { id: b4.data.booking.id } })).status === 'ACCEPTED');

  // Both parties are notified
  const n = await prisma.notification.count({ where: { data: { path: ['bookingId'], equals: b1.data.booking.id } } });
  T('both parties get an "expired" notification', n >= 2, String(n));
  console.log(`\n${pass} passed, ${fail} failed`); await prisma.$disconnect();
})().catch((e) => { console.error('ERR', e); process.exit(1); });
