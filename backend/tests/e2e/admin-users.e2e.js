// E2E script — run against the LOCAL dev stack (./dev-local.sh, OTP_BYPASS=true, seeded users). See CLAUDE.md > Testing.
const API = process.env.API || 'http://localhost:3000/api';
const prisma = new (require('@prisma/client').PrismaClient)();
const call = async (m, p, t, b, f) => { const h = {}; if (t) h.Authorization = 'Bearer ' + t; let body; if (f) body = f; else if (b) { h['Content-Type'] = 'application/json'; body = JSON.stringify(b); } const r = await fetch(API + p, { method: m, headers: h, body }); return { status: r.status, data: await r.json().catch(() => ({})) }; };
const { signIn } = require('./_auth');
const login = async (phone, name) => { const r = await signIn(phone, name); return { token: r.data.accessToken, refresh: r.data.refreshToken, user: r.data.user, raw: r }; };
let pass = 0, fail = 0; const T = (n, c, x = '') => { c ? pass++ : fail++; console.log(c ? 'PASS' : 'FAIL', n, x); };
const rnd = () => String(Date.now()).slice(-7) + Math.floor(Math.random() * 90 + 10);
const day = (n) => new Date(Date.now() + 864e5 * n).toISOString();
const parcel = (t) => { const f = new FormData(); f.append('pickupAddress', 'a'); f.append('deliveryAddress', 'b'); f.append('weightKg', '1'); f.append('description', 'delete test'); return call('POST', '/parcels', t, null, f); };

(async () => {
  const AD = await login('+10000000099');
  const A = await login('+3370' + rnd(), 'Cleanup Sender'), B = await login('+3371' + rnd(), 'Cleanup Traveler');
  await prisma.user.updateMany({ where: { id: { in: [A.user.id, B.user.id] } }, data: { isVerified: true } });

  // A traveler (B) with a trip, a sender (A) with a parcel + booking + chat + review → full history
  const tr = await call('POST', '/trips', B.token, { originCity: 'Paris', destinationCity: 'Rabat', departureAt: day(5), maxWeightKg: 5, pricePerKg: 3, mode: 'PLANE' });
  const pc = await parcel(A.token);
  const bk = await call('POST', '/bookings', A.token, { tripId: tr.data.trip.id, parcelRequestId: pc.data.parcel.id });
  const id = bk.data.booking.id;
  await call('POST', `/bookings/${id}/messages`, A.token, { body: 'hello' });

  let r = await call('GET', '/admin/users', A.token); T('normal user cannot list users', r.status === 403);
  r = await call('DELETE', `/admin/users/${A.user.id}`, A.token, { confirmPhone: A.user.phone }); T('normal user cannot delete anyone', r.status === 403);
  r = await call('DELETE', `/admin/users/${AD.user.id}`, AD.token, { confirmPhone: AD.user.phone }); T('admin cannot delete themselves', r.status === 400);

  r = await call('DELETE', `/admin/users/${A.user.id}`, AD.token, { confirmPhone: A.user.phone }); T('a user with an ACTIVE booking cannot be deleted', r.status === 409, r.data.message);
  r = await call('PATCH', `/admin/users/${A.user.id}/active`, AD.token, { active: false }); T('admin can disable an account', r.status === 200);
  const again = await login(A.user.phone); T('a disabled user cannot sign in (403)', again.raw.status === 403, again.raw.data.message);
  r = await call('GET', '/users/me', A.token); T('an existing session of a disabled user stops working', r.status === 401);
  r = await call('PATCH', `/admin/users/${A.user.id}/active`, AD.token, { active: true }); T('admin can re-enable it', r.status === 200);
  const ok = await login(A.user.phone); T('…and they can sign in again', ok.raw.status === 200 && !!ok.token);

  await call('DELETE', `/bookings/${id}`, ok.token); // sender cancels → booking CANCELLED (no longer active)
  r = await call('DELETE', `/admin/users/${A.user.id}`, AD.token, { confirmPhone: '+000' }); T('wrong confirmation phone is rejected', r.status === 400);
  r = await call('DELETE', `/admin/users/${A.user.id}`, AD.token, { confirmPhone: A.user.phone }); T('admin deletes the sender (typed phone) once nothing is active', r.status === 200, r.data.message);
  T('user row is gone', (await prisma.user.findUnique({ where: { id: A.user.id } })) === null);
  T('their parcels, bookings and messages are gone', (await prisma.parcelRequest.count({ where: { senderId: A.user.id } })) === 0 && (await prisma.booking.count({ where: { id } })) === 0 && (await prisma.message.count({ where: { bookingId: id } })) === 0);
  T('the traveler and their trip are untouched', !!(await prisma.user.findUnique({ where: { id: B.user.id } })) && !!(await prisma.trip.findUnique({ where: { id: tr.data.trip.id } })));

  const me = await call('GET', '/users/me', ok.token); T('deleted user\'s old session is rejected', me.status === 401);
  r = await call('DELETE', `/admin/users/${B.user.id}`, AD.token, { confirmPhone: B.user.phone }); T('deleting the traveler also removes their trips', r.status === 200 && (await prisma.trip.count({ where: { travelerId: B.user.id } })) === 0);
  const log = await call('GET', '/admin/activity', AD.token); T('audit log records disable / enable / delete', ['USER_DEACTIVATED', 'USER_REACTIVATED', 'USER_DELETED'].every((a) => log.data.activity.some((x) => x.action === a)));
  const M = await login('+3372' + rnd(), 'Staff Person'); await call('POST', '/admin/staff', AD.token, { phone: M.user.phone });
  r = await call('DELETE', `/admin/users/${M.user.id}`, AD.token, { confirmPhone: M.user.phone }); T('staff cannot be deleted until their access is removed', r.status === 400, r.data.message);
  await call('DELETE', `/admin/staff/${M.user.id}`, AD.token); await call('DELETE', `/admin/users/${M.user.id}`, AD.token, { confirmPhone: M.user.phone });
  console.log(`\n${pass} passed, ${fail} failed`); await prisma.$disconnect();
})().catch((e) => { console.error('ERR', e); process.exit(1); });
