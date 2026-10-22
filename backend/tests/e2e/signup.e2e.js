// E2E script — sign-up, password sign-in with SMS code, forgotten password. Run against the LOCAL dev stack
// (./dev-local.sh, OTP_BYPASS=true, seeded users). See CLAUDE.md > Testing.
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const API = 'http://localhost:3000/api';
const prisma = new (require('@prisma/client').PrismaClient)();
const call = async (m, p, t, b) => { const h = { 'Content-Type': 'application/json' }; if (t) h.Authorization = 'Bearer ' + t; const r = await fetch(API + p, { method: m, headers: h, body: b ? JSON.stringify(b) : undefined }); return { status: r.status, data: await r.json().catch(() => ({})) }; };
const post = (p, b) => call('POST', p, null, b);
let pass = 0, fail = 0; const T = (n, c, x = '') => { c ? pass++ : fail++; console.log(c ? 'PASS' : 'FAIL', n, x); };
const rnd = () => String(Date.now()).slice(-7);

(async () => {
  const phone = '+4179' + rnd();
  const email = `maria.${rnd()}@example.com`;
  const base = { name: 'Maria Lopez', phone, email: email.toUpperCase(), password: 'secret-pass-1', acceptTerms: true };

  // ── Sign-up ──
  let r = await post('/auth/register', { ...base, acceptTerms: false }); T('sign-up without the 18+/Terms box is refused', r.status === 400);
  r = await post('/auth/register', { ...base, password: 'short' }); T('password under 8 characters refused', r.status === 400);
  r = await post('/auth/register', { ...base, email: 'not-an-email' }); T('invalid email refused', r.status === 400);
  r = await post('/auth/register', { ...base, name: 'A' }); T('1-letter name refused', r.status === 400);
  r = await post('/auth/register', { ...base, phone: '+10000000001' }); T('a phone that already has an account is refused (409)', r.status === 409);
  r = await post('/auth/register', base); T('valid details: code sent, no session yet', r.status === 200 && !r.data.accessToken);
  r = await post('/auth/register/verify', { ...base, code: '000000' }); T('wrong code refused', r.status === 400);
  T('…and no account was created', !(await prisma.user.findUnique({ where: { phone } })));
  r = await post('/auth/register/verify', { ...base, acceptTerms: false, code: '123456' }); T('verify step also requires the Terms box', r.status === 400);
  r = await post('/auth/register/verify', { ...base, code: '123456' });
  T('right code creates the account and signs in', r.status === 200 && !!r.data.accessToken && r.data.user.name === 'Maria Lopez' && r.data.user.phone === phone);
  T('email stored lower-case', r.data.user?.email === email);
  const userId = r.data.user?.id;
  const stored = await prisma.user.findUnique({ where: { phone } });
  T('password is stored hashed, terms acceptance recorded', !!stored.passwordHash && stored.passwordHash !== base.password && !!stored.termsAcceptedAt);
  r = await post('/auth/register/verify', { ...base, code: '123456' }); T('registering the same phone twice is refused', r.status === 409);
  r = await post('/auth/register', { ...base, phone: '+4178' + rnd() }); T('an email already used is refused', r.status === 409);

  // ── Sign-in: password, then SMS code ──
  r = await post('/auth/login', { identifier: phone, password: 'wrong-pass' }); T('wrong password refused, nothing sent', r.status === 401 && !r.data.loginToken);
  r = await post('/auth/login', { identifier: '+4170' + rnd(), password: 'whatever1' }); T('unknown phone gets the same answer as a wrong password', r.status === 401 && r.data.message === 'Wrong email/phone or password');
  r = await post('/auth/login', { identifier: phone, password: base.password });
  T('right password: code sent to the phone, no session yet', r.status === 200 && !!r.data.loginToken && !r.data.accessToken && r.data.phoneHint.endsWith(phone.slice(-4)));
  const loginToken = r.data.loginToken;
  r = await post('/auth/login/verify', { loginToken, code: '000000' }); T('wrong SMS code refused', r.status === 400 && !r.data.accessToken);
  r = await post('/auth/login/verify', { loginToken: 'garbage', code: '123456' }); T('forged sign-in token refused', r.status === 400);
  r = await post('/auth/login/verify', { loginToken, code: '123456' }); T('password + code signs in', r.status === 200 && r.data.user?.id === userId);
  const access = r.data.accessToken;
  r = await post('/auth/login', { identifier: `  ${email.toUpperCase()} `, password: base.password });
  r = await post('/auth/login/verify', { loginToken: r.data.loginToken, code: '123456' }); T('sign-in with the email (any case) works too', r.status === 200 && r.data.user?.id === userId);
  r = await call('GET', '/users/me', access); T('profile never exposes the password hash', r.status === 200 && r.data.user.email === email && !('passwordHash' in r.data.user));
  r = await post('/auth/verify-otp', { phone, code: '123456' }); T('the old code-only sign-in is gone', r.status === 404);
  r = await post('/auth/complete-registration', { registrationToken: 'x', name: 'Someone' }); T('the old name-only sign-up is gone', r.status === 404);

  // ── Change password / email from the profile ──
  r = await call('POST', '/users/me/password', access, { currentPassword: 'nope-nope', newPassword: 'another-pass-2' }); T('changing the password needs the current one', r.status === 400);
  r = await call('POST', '/users/me/password', access, { currentPassword: base.password, newPassword: 'another-pass-2' }); T('password changed', r.status === 200);
  r = await post('/auth/login', { identifier: phone, password: 'another-pass-2' }); T('new password works', r.status === 200);
  r = await call('PATCH', '/users/me', access, { email: 'admin-taken-' + rnd() + '@example.com' }); T('email can be changed', r.status === 200);
  const other = await prisma.user.update({ where: { phone: '+10000000001' }, data: { email: `seed1.${rnd()}@example.com` } });
  r = await call('PATCH', '/users/me', access, { email: other.email }); T("someone else's email is refused", r.status === 409);
  await prisma.user.update({ where: { id: other.id }, data: { email: null } });

  // ── Forgotten password (also how older accounts without a password get one) ──
  r = await post('/auth/password/forgot', { identifier: '+4170' + rnd() }); T('forgot password on an unknown number looks the same (no account discovery)', r.status === 200);
  r = await post('/auth/password/forgot', { identifier: phone }); T('forgot password sends a code', r.status === 200);
  r = await post('/auth/password/reset', { identifier: phone, code: '000000', password: 'third-pass-3' }); T('reset with a wrong code refused', r.status === 400);
  r = await post('/auth/password/reset', { identifier: phone, code: '123456', password: 'third-pass-3' }); T('reset sets the new password and signs in', r.status === 200 && r.data.user?.id === userId);
  r = await post('/auth/login', { identifier: phone, password: 'another-pass-2' }); T('old password no longer works', r.status === 401);
  const legacy = await prisma.user.create({ data: { phone: '+4177' + rnd(), name: 'Old Account' } });
  r = await post('/auth/login', { identifier: legacy.phone, password: 'anything1' }); T('an account from before passwords cannot sign in with a guess', r.status === 401);
  await post('/auth/password/forgot', { identifier: legacy.phone });
  r = await post('/auth/password/reset', { identifier: legacy.phone, code: '123456', password: 'first-pass-1' }); T('…it sets its first password with an SMS code', r.status === 200 && r.data.user?.id === legacy.id);

  // ── Brute force ──
  const victim = legacy.phone;
  for (let i = 0; i < 5; i++) await post('/auth/login', { identifier: victim, password: 'bad-guess-' + i });
  r = await post('/auth/login', { identifier: victim, password: 'first-pass-1' }); T('5 wrong passwords lock the account for a while (even the right one)', r.status === 429);
  r = await post('/auth/password/reset', { identifier: victim, code: '123456', password: 'fresh-pass-9' }); T('a password reset unlocks it', r.status === 200);
  r = await post('/auth/login', { identifier: victim, password: 'fresh-pass-9' }); T('…and sign-in works again', r.status === 200);

  console.log(`\n${pass} passed, ${fail} failed`);
  await prisma.$disconnect();
})();
