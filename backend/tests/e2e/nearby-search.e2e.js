// E2E script — run against the LOCAL dev stack (./dev-local.sh, OTP_BYPASS=true, seeded users). See CLAUDE.md > Testing.
const API = process.env.API || 'http://localhost:3000/api';
const call = async (m, p, t, b) => { const h = {}; if (t) h.Authorization = 'Bearer ' + t; let body; if (b) { h['Content-Type'] = 'application/json'; body = JSON.stringify(b); } const r = await fetch(API + p, { method: m, headers: h, body }); return { status: r.status, data: await r.json().catch(() => ({})) }; };
const { signIn } = require('./_auth');
const login = async (phone) => (await signIn(phone)).data.accessToken;
let pass = 0, fail = 0; const T = (n, c, x = '') => { c ? pass++ : fail++; console.log(c ? 'PASS' : 'FAIL', n, x); };
const day = (n) => new Date(Date.now() + 864e5 * n).toISOString();

(async () => {
  const tag = String(Date.now()).slice(-5);
  const sender = await login('+10000000004');
  const trav = [await login('+10000000011'), await login('+10000000012'), await login('+10000000013')];
  const mk = (t, origin, dest, days) => call('POST', '/trips', t, { originCity: origin, destinationCity: dest, departureAt: day(days), maxWeightKg: 10, pricePerKg: 3, mode: 'PLANE' });
  await mk(trav[0], 'Paris', 'Rabat', 3); await mk(trav[1], 'Paris', 'Salé', 9); await mk(trav[2], 'Versailles', 'Kénitra', 12);
  await mk(trav[0], 'Paris', 'Nice', 6); await mk(trav[1], 'Paris', 'Venice', 6);
  const search = async (q) => (await call('GET', '/trips/search?' + q, sender));
  const row = (r, dest) => (r.data.trips || []).find((t) => t.destinationCity === dest);

  let r = await search('destination=Kenitra&date=');
  T('empty date param is accepted (was a 400 bug)', r.status === 200);
  T('Kenitra search finds the exact Kénitra trip (accent-insensitive)', row(r, 'Kénitra')?.matchType === 'exact');
  const rabat = row(r, 'Rabat');
  T('…and nearby Rabat with a sensible distance (20–60 km)', rabat?.matchType === 'nearby' && rabat.destinationDistanceKm >= 20 && rabat.destinationDistanceKm <= 60, String(rabat?.destinationDistanceKm));
  T('…and nearby Salé', row(r, 'Salé')?.matchType === 'nearby');
  T('exact matches are listed before nearby ones', (r.data.trips || []).findIndex((t) => t.matchType === 'nearby') > (r.data.trips || []).findIndex((t) => t.matchType === 'exact'));
  r = await search('origin=Paris&destination=Kenitra');
  const v = (r.data.trips || []).find((t) => t.originCity === 'Versailles' && t.destinationCity === 'Kénitra');
  T('origin filter: Versailles counts as nearby Paris', v?.matchType === 'nearby' && v.originDistanceKm > 0 && v.originDistanceKm < 40, String(v?.originDistanceKm));
  r = await search('destination=Nice');
  T('"Nice" does not match "Venice" (whole-name matching)', !!row(r, 'Nice') && !row(r, 'Venice'));
  r = await search('destination=Zzzzqq');
  T('unknown place returns no trips', r.status === 200 && (r.data.trips || []).length === 0);
  r = await search('');
  T('no filters at all lists upcoming trips', r.status === 200 && (r.data.trips || []).length > 0);
  r = await search('destination=Rabat&date=' + day(10).slice(0, 10));
  T('a date means "on or after": earlier trips are excluded', (r.data.trips || []).every((t) => new Date(t.departureAt) >= new Date(day(10).slice(0, 10))));
  console.log(`\n${pass} passed, ${fail} failed`);
})().catch((e) => { console.error('ERR', e); process.exit(1); });
