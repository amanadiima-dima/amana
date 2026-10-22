// Shared sign-in for the e2e scripts: email/phone + password, then the SMS code (dev bypass: 123456).
// Creates the account, or sets the test password on an older one, when needed. Returns { status, data }
// where data is the session ({ accessToken, refreshToken, user }) or the error body.
const API = process.env.API || 'http://localhost:3000/api';
const PASSWORD = 'amana1234';
const post = async (p, b) => {
  const r = await fetch(API + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) });
  return { status: r.status, data: await r.json().catch(() => ({})) };
};
// `name` is the full name: first word = first name, the rest = last name.
const signIn = async (phone, name = 'Test User') => {
  let r = await post('/auth/login', { identifier: phone, password: PASSWORD });
  if (r.status === 200) return post('/auth/login/verify', { loginToken: r.data.loginToken, code: '123456' });
  if (r.status !== 401) return r; // e.g. 403 disabled account
  const [first, ...rest] = name.split(' ');
  const details = { name: first, lastName: rest.join(' ') || 'Tester', phone, birthDate: '1990-05-15', password: PASSWORD, acceptTerms: true };
  r = await post('/auth/register', details);
  if (r.status === 200) return post('/auth/register/verify', { ...details, code: '123456' });
  await post('/auth/password/forgot', { identifier: phone }); // existing account without this password
  return post('/auth/password/reset', { identifier: phone, code: '123456', password: PASSWORD });
};
module.exports = { signIn, post, PASSWORD };
