// E2E script — GDPR: data export, account closure (delete vs anonymise), legal hold, identity file, retention purge.
// Run against the LOCAL dev stack (./dev-local.sh, OTP_BYPASS=true, seeded users). See CLAUDE.md > Testing.
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const API = process.env.API || 'http://localhost:3000/api';
const prisma = new (require('@prisma/client').PrismaClient)();
const { runRetention } = require('../../src/services/account.service');
const call = async (m, p, t, b, f) => { const h = {}; if (t) h.Authorization = 'Bearer ' + t; let body; if (f) body = f; else if (b) { h['Content-Type'] = 'application/json'; body = JSON.stringify(b); } const r = await fetch(API + p, { method: m, headers: h, body }); return { status: r.status, headers: r.headers, data: await r.json().catch(() => ({})) }; };
const login = async (phone, name) => { await call('POST', '/auth/send-otp', null, { phone }); let r = await call('POST', '/auth/verify-otp', null, { phone, code: '123456' }); if (r.data.needsProfile) r = await call('POST', '/auth/complete-registration', null, { registrationToken: r.data.registrationToken, name: name || 'Test User', acceptTerms: true }); return { token: r.data.accessToken, refresh: r.data.refreshToken, user: r.data.user, raw: r }; };
let pass = 0, fail = 0; const T = (n, c, x = '') => { c ? pass++ : fail++; console.log(c ? 'PASS' : 'FAIL', n, x); };
const rnd = () => String(Date.now()).slice(-7) + Math.floor(Math.random() * 90 + 10);
const day = (n) => new Date(Date.now() + 864e5 * n);
const parcel = (t) => { const f = new FormData(); f.append('pickupAddress', 'Rue A 1'); f.append('deliveryAddress', 'Rue B 2'); f.append('weightKg', '1'); f.append('description', 'privacy test'); return call('POST', '/parcels', t, null, f); };
const fakeIdv = (userId, data) => prisma.idVerification.create({ data: { userId, frontPhoto: 'cld:image:x/front.jpg', backPhoto: 'cld:image:x/back', selfieVideo: 'cld:video:x/video', consentAt: new Date(), ...data } });

(async () => {
  const AD = await login('+10000000099');
  const A = await login('+3380' + rnd(), 'Privacy Sender'), B = await login('+3381' + rnd(), 'Privacy Traveler');
  await prisma.user.updateMany({ where: { id: { in: [A.user.id, B.user.id] } }, data: { isVerified: true } });
  await fakeIdv(A.user.id, { status: 'APPROVED', reviewedAt: new Date() });
  const tr = await call('POST', '/trips', B.token, { originCity: 'Paris', destinationCity: 'Rabat', departureAt: day(5).toISOString(), maxWeightKg: 5, pricePerKg: 3, mode: 'PLANE' });
  const pc = await parcel(A.token);
  const bk = await call('POST', '/bookings', A.token, { tripId: tr.data.trip.id, parcelRequestId: pc.data.parcel.id });
  const id = bk.data.booking.id;
  await call('POST', `/bookings/${id}/messages`, A.token, { body: 'hola' });

  // ── Export (access / portability)
  let r = await call('GET', '/users/me/export', A.token);
  T('export returns my data as a downloadable JSON', r.status === 200 && /attachment/.test(r.headers.get('content-disposition') || '') && r.data.profile?.phone === A.user.phone);
  T('export contains my bookings with the chat', r.data.bookings?.length === 1 && r.data.bookings[0].messages?.[0]?.body === 'hola');
  T('export never leaks the delivery code or invite token', r.data.bookings?.[0] && !('deliveryCode' in r.data.bookings[0]) && !('inviteToken' in r.data.bookings[0]));
  T('export includes ID verification metadata + my files', r.data.idVerification?.status === 'APPROVED' && !!r.data.idVerification.files.front && !r.data.idVerification.files.front.startsWith('cld:'));
  r = await call('GET', '/users/me/export'); T('export requires a session', r.status === 401);

  // ── Closing the account
  r = await call('DELETE', '/users/me', A.token, {}); T('closing without confirmation is refused', r.status === 400);
  r = await call('DELETE', '/users/me', A.token, { confirm: 'DELETE' }); T('cannot close with a booking in progress', r.status === 409, r.data.message);
  await call('DELETE', `/bookings/${id}`, A.token);
  r = await call('DELETE', '/users/me', A.token, { confirm: 'DELETE' }); T('user with history closes the account → anonymised', r.status === 200 && r.data.mode === 'anonymised', JSON.stringify(r.data));
  const a = await prisma.user.findUnique({ where: { id: A.user.id }, include: { idVerification: true } });
  T('profile is anonymised (name, phone) and disabled', a.name === 'Deleted user' && a.phone.startsWith('deleted:') && !a.isActive && !!a.deletedAt);
  T('real identity kept in the staff-only archive', a.archivedName === 'Privacy Sender' && a.archivedPhone === A.user.phone);
  const yrs = (a.retainUntil - Date.now()) / (365 * 864e5); T('kept for ~5 years for legal claims', yrs > 4.9 && yrs < 5.1, yrs.toFixed(2));
  T('ID documents kept, selfie video deleted', !!a.idVerification?.frontPhoto && a.idVerification.selfieVideo === null);
  T('booking history (other side) is kept', (await prisma.booking.count({ where: { id } })) === 1 && (await prisma.message.count({ where: { bookingId: id } })) === 1);
  r = await call('GET', '/users/me', A.token); T('old session stops working', r.status === 401);
  r = await call('POST', '/auth/refresh', null, { refreshToken: A.refresh }); T('refresh token of a closed account is refused', r.status === 401);
  r = await call('GET', `/users/${A.user.id}`, B.token); T('public profile of a closed account is gone', r.status === 404);
  const A2 = await login(A.user.phone, 'Fresh Start'); T('the same phone can sign up again as a new account', !!A2.token && A2.user.id !== A.user.id);

  const C = await login('+3382' + rnd(), 'No History');
  await fakeIdv(C.user.id, { status: 'PENDING' });
  r = await call('DELETE', '/users/me', C.token, { confirm: 'DELETE' }); T('user without history → everything deleted', r.status === 200 && r.data.mode === 'deleted');
  T('row and ID verification are gone', (await prisma.user.findUnique({ where: { id: C.user.id } })) === null && (await prisma.idVerification.count({ where: { userId: C.user.id } })) === 0);
  r = await call('DELETE', '/users/me', AD.token, { confirm: 'DELETE' }); T('staff cannot close their account themselves', r.status === 400);

  // ── Legal hold + identity file (admin)
  r = await call('PATCH', `/admin/users/${B.user.id}/legal-hold`, B.token, { hold: true, note: 'x' }); T('only admins set a legal hold', r.status === 403);
  r = await call('PATCH', `/admin/users/${B.user.id}/legal-hold`, AD.token, { hold: true }); T('legal hold needs a reason', r.status === 400);
  r = await call('PATCH', `/admin/users/${B.user.id}/legal-hold`, AD.token, { hold: true, note: 'Parcel never delivered — police report' }); T('admin sets a legal hold', r.status === 200);
  r = await call('DELETE', `/admin/users/${B.user.id}`, AD.token, { confirmPhone: B.user.phone }); T('a user on legal hold cannot be deleted', r.status === 409);
  r = await call('GET', `/admin/users/${A.user.id}/identity?reason=test`, AD.token);
  T('admin sees the archived identity + signed document links', r.status === 200 && r.data.identity.phone === A.user.phone && !!r.data.identity.verification?.frontPhoto && !r.data.identity.verification.frontPhoto.startsWith('cld:'));
  { const u = new URL(r.data.identity.verification.frontPhoto); const exp = Number(u.searchParams.get('expires_at')) * 1000;
    T('signed document links expire within the hour', exp > Date.now() && exp <= Date.now() + 3600e3 + 5e3 && u.searchParams.get('public_id') === 'x/front' && u.searchParams.get('format') === 'jpg'); }
  r = await call('GET', `/admin/users/${A.user.id}/identity`, B.token); T('non-admins cannot open the identity file', r.status === 403);
  const log = await call('GET', '/admin/activity', AD.token); T('identity access and the hold are audit-logged', ['IDENTITY_VIEWED', 'LEGAL_HOLD_SET'].every((x) => log.data.activity.some((l) => l.action === x)));
  r = await call('GET', '/admin/users', AD.token); const row = r.data.users?.find((u) => u.id === A.user.id); T('admin user list shows closed accounts with their archived name', row?.archivedName === 'Privacy Sender' && !!row.deletedAt);

  // ── Retention purge
  const old = day(-40);
  const D = await login('+3383' + rnd(), 'Old Video'); await fakeIdv(D.user.id, { status: 'APPROVED', reviewedAt: old });
  const E = await login('+3384' + rnd(), 'Rejected Long Ago'); await fakeIdv(E.user.id, { status: 'REJECTED', reviewedAt: old });
  const F = await login('+3385' + rnd(), 'Rejected On Hold'); await fakeIdv(F.user.id, { status: 'REJECTED', reviewedAt: old });
  await prisma.user.update({ where: { id: F.user.id }, data: { legalHoldAt: new Date(), legalHoldNote: 'test' } });
  const G = await login('+3386' + rnd(), 'Blocked'); await fakeIdv(G.user.id, { status: 'REJECTED', reviewedAt: old });
  await call('PATCH', `/admin/users/${G.user.id}/active`, AD.token, { active: false });
  await prisma.user.update({ where: { id: A.user.id }, data: { retainUntil: day(-1) } });
  await prisma.notification.create({ data: { userId: B.user.id, title: 'old', body: 'old', createdAt: day(-400) } });

  const stats = await runRetention();
  T('selfie video deleted 30 days after approval', (await prisma.idVerification.findUnique({ where: { userId: D.user.id } })).selfieVideo === null, JSON.stringify(stats));
  T('…but the ID photos stay while the account is open', !!(await prisma.idVerification.findUnique({ where: { userId: D.user.id } })).frontPhoto);
  T('rejected verification deleted after 30 days', (await prisma.idVerification.count({ where: { userId: E.user.id } })) === 0);
  T('legal hold keeps everything', (await prisma.idVerification.findUnique({ where: { userId: F.user.id } }))?.selfieVideo != null);
  T('an account blocked by staff is kept too', (await prisma.idVerification.count({ where: { userId: G.user.id } })) === 1);
  const a2 = await prisma.user.findUnique({ where: { id: A.user.id }, include: { idVerification: true } });
  T('closed account past its period: documents + archived identity purged', !a2.idVerification && a2.archivedPhone === null && a2.archivedName === null);
  T('notifications older than a year are deleted', (await prisma.notification.count({ where: { userId: B.user.id, title: 'old' } })) === 0);

  // cleanup
  await call('PATCH', `/admin/users/${B.user.id}/legal-hold`, AD.token, { hold: false });
  await prisma.user.update({ where: { id: F.user.id }, data: { legalHoldAt: null } });
  console.log(`\n${pass} passed, ${fail} failed`); await prisma.$disconnect(); process.exit(0);
})().catch((e) => { console.error('ERR', e); process.exit(1); });
