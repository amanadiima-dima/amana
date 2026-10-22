// E2E script — public popular routes for the landing page (real open trips, cheapest price per kg).
// Run against the LOCAL dev stack (./dev-local.sh, OTP_BYPASS=true, seeded users). See CLAUDE.md > Testing.
const API = 'http://localhost:3000/api';
const { signIn } = require('./_auth');
const call = async (m, p, t, b) => { const h = { 'Content-Type': 'application/json' }; if (t) h.Authorization = 'Bearer ' + t; const r = await fetch(API + p, { method: m, headers: h, body: b ? JSON.stringify(b) : undefined }); return { status: r.status, data: await r.json().catch(() => ({})) }; };
let pass = 0, fail = 0; const T = (n, c, x = '') => { c ? pass++ : fail++; console.log(c ? 'PASS' : 'FAIL', n, x); };
const day = (n) => new Date(Date.now() + 864e5 * n).toISOString();

(async () => {
  const tok = (await signIn('+10000000015')).data.accessToken;
  const dest = 'Routeville' + String(Date.now()).slice(-6);
  const mk = (price, days, currency = 'EUR') => call('POST', '/trips', tok, { originCity: 'Lyon', destinationCity: dest, departureAt: day(days), maxWeightKg: 10, pricePerKg: price, mode: 'PLANE', currency });
  await mk(7, 9); await mk(5, 4); const c = await mk(1, 2);
  await mk(50, 5, 'MAD');
  await call('DELETE', `/trips/${c.data.trip?.id}`, tok); // cancelled: must not count

  let r = await call('GET', '/trips/popular-routes');
  T('public endpoint, no sign-in needed', r.status === 200 && Array.isArray(r.data.routes) && r.data.routes.length <= 12);
  r = await call('GET', `/trips/popular-routes?destination=${dest.toLowerCase()}`);
  T('?destination= keeps only routes to that city (any case)', r.data.routes.length === 2 && r.data.routes.every((x) => x.destinationCity === dest));
  const eur = r.data.routes.find((x) => x.destinationCity === dest && x.currency === 'EUR');
  T('route listed with its open trips only', eur?.trips === 2, JSON.stringify(eur));
  T('cheapest price per kg shown (cancelled trip ignored)', eur?.minPricePerKg === 5);
  T('next departure = the soonest open trip', eur && Math.abs(new Date(eur.nextDepartureAt) - new Date(day(4))) < 60e3);
  const mad = r.data.routes.find((x) => x.destinationCity === dest && x.currency === 'MAD');
  T('prices in another currency are a separate entry (never mixed)', mad?.minPricePerKg === 50 && mad.trips === 1);
  T('no traveller details exposed', !JSON.stringify(r.data).includes('traveler'));
  console.log(`\n${pass} passed, ${fail} failed`);
})();
