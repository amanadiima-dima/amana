// E2E script — run against the LOCAL dev stack (./dev-local.sh, OTP_BYPASS=true, seeded users). See CLAUDE.md > Testing.
const { io } = require('../../../web/node_modules/socket.io-client');
const API = 'http://localhost:3000/api';
const results = [];
const check = (name, ok, extra='') => { results.push(ok); console.log(`${ok?'PASS':'FAIL'}  ${name} ${extra}`); };

async function call(method, path, token, body, form) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) payload = form; else if (body) { headers['Content-Type']='application/json'; payload = JSON.stringify(body); }
  const r = await fetch(API + path, { method, headers, body: payload });
  let j = {}; try { j = await r.json(); } catch {}
  return { status: r.status, data: j };
}
async function login(phone) {
  await call('POST', '/auth/send-otp', null, { phone });
  const r = await call('POST', '/auth/verify-otp', null, { phone, code: '123456' });
  return { token: r.data.accessToken || r.data.data?.accessToken, user: r.data.user || r.data.data?.user };
}
const wait = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const sender = await login('+10000000002');
  const traveler = await login('+10000000012');
  const outsider = await login('+10000000003');
  check('logins', sender.token && traveler.token && outsider.token);

  const trip = await call('POST', '/trips', traveler.token, {
    originCity: 'Paris', destinationCity: 'Casablanca', departureAt: new Date(Date.now()+864e5*5).toISOString(),
    maxWeightKg: 10, pricePerKg: 4, mode: 'PLANE' });
  const tripId = trip.data.trip?.id; check('trip created', !!tripId, JSON.stringify(trip.data).slice(0,120));

  const fd = new FormData();
  fd.append('pickupAddress','1 rue de Rivoli, Paris'); fd.append('deliveryAddress','Casablanca'); fd.append('weightKg','2'); fd.append('description','chat test parcel'); fd.append('fragile','false');
  const parcel = await call('POST', '/parcels', sender.token, null, fd);
  const parcelId = parcel.data.parcel?.id; check('parcel created', !!parcelId, JSON.stringify(parcel.data).slice(0,120));

  const bk = await call('POST', '/bookings', sender.token, { tripId, parcelRequestId: parcelId });
  const bookingId = bk.data.booking?.id; check('booking created', !!bookingId, JSON.stringify(bk.data).slice(0,120));
  if (!bookingId) process.exit(1);

  // sockets
  const mk = (tok) => io('http://localhost:3000', { transports:['websocket'], auth:{ token: tok } });
  const sSock = mk(sender.token), tSock = mk(traveler.token), oSock = mk(outsider.token);
  const got = { s:[], t:[], o:[] };
  sSock.on('message:new', m => got.s.push(m)); tSock.on('message:new', m => got.t.push(m)); oSock.on('message:new', m => got.o.push(m));
  await wait(800);
  [sSock,tSock,oSock].forEach(s => s.emit('join:booking', bookingId));
  await wait(800);

  // 1 sender -> traveler while PENDING
  let r = await call('POST', `/bookings/${bookingId}/messages`, sender.token, { body: 'Hello traveler 👋 مرحبا' });
  check('sender can send (PENDING booking)', r.status === 201);
  await wait(600);
  check('traveler got realtime msg', got.t.length === 1 && got.t[0].body.includes('مرحبا'));
  check('sender got own echo', got.s.length === 1);
  check('outsider got NOTHING realtime', got.o.length === 0);

  // 2 reply
  r = await call('POST', `/bookings/${bookingId}/messages`, traveler.token, { body: 'Hi! Happy to help.' });
  check('traveler reply', r.status === 201);
  await wait(500);
  check('sender got reply realtime', got.s.length === 2);

  // 3 history + read receipts
  r = await call('GET', `/bookings/${bookingId}/messages`, sender.token);
  check('history has 2 msgs in order', r.data.messages?.length === 2 && r.data.messages[0].body.startsWith('Hello'));
  const db = require('@prisma/client');
  const prisma = new db.PrismaClient();
  const msgs = await prisma.message.findMany({ where: { bookingId }, orderBy: { createdAt: 'asc' } });
  check('traveler msg marked read after sender fetched', msgs[1].readAt !== null);
  check('sender msg NOT read yet', msgs[0].readAt === null);

  // 4 authorization
  r = await call('GET', `/bookings/${bookingId}/messages`, outsider.token);
  check('outsider GET history -> 403', r.status === 403, `got ${r.status}`);
  r = await call('POST', `/bookings/${bookingId}/messages`, outsider.token, { body: 'spy' });
  check('outsider POST -> 403', r.status === 403, `got ${r.status}`);
  r = await call('GET', `/bookings/${bookingId}/messages`, null);
  check('no token -> 401', r.status === 401, `got ${r.status}`);

  // 5 validation
  r = await call('POST', `/bookings/${bookingId}/messages`, sender.token, { body: '   ' });
  check('blank message rejected (400)', r.status === 400, `got ${r.status}`);
  r = await call('POST', `/bookings/${bookingId}/messages`, sender.token, { body: 'x'.repeat(2001) });
  check('2001 chars rejected (400)', r.status === 400, `got ${r.status}`);
  r = await call('POST', `/bookings/${bookingId}/messages`, sender.token, { body: '<script>alert(1)</script>' });
  check('HTML stored as plain text (React escapes on render)', r.status === 201);

  // 6 notification created for recipient
  const notes = await prisma.notification.findMany({ where: { userId: traveler.user.id, data: { path: ['bookingId'], equals: bookingId } } });
  check('traveler got in-app notifications for msgs', notes.length >= 2, `count=${notes.length}`);

  // 7 messaging after rejection/cancel
  r = await call('PATCH', `/bookings/${bookingId}/respond`, traveler.token, { action: 'reject' });
  check('traveler rejects booking', r.status === 200, `got ${r.status}`);
  r = await call('POST', `/bookings/${bookingId}/messages`, sender.token, { body: 'message after rejection' });
  console.log(`INFO  send on REJECTED booking -> HTTP ${r.status} (web UI hides chat; API ${r.status===201?'ALLOWS it':'blocks it'})`);

  console.log(`\n${results.filter(Boolean).length}/${results.length} passed`);
  sSock.close(); tSock.close(); oSock.close(); await prisma.$disconnect(); process.exit(0);
})().catch(e => { console.error('ERR', e); process.exit(1); });
