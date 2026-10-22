// E2E script — landing page search (GET /trips/public): optional origin/date; with a date, that day's trips
// plus the same route on other upcoming dates. Run against the LOCAL dev stack (see CLAUDE.md > Testing).
const API = 'http://localhost:3000/api';
const { signIn } = require('./_auth');
const call = async (m, p, t, b) => { const h = { 'Content-Type': 'application/json' }; if (t) h.Authorization = 'Bearer ' + t; const r = await fetch(API + p, { method: m, headers: h, body: b ? JSON.stringify(b) : undefined }); return { status: r.status, data: await r.json().catch(() => ({})) }; };
let pass = 0, fail = 0; const T = (n, c, x = '') => { c ? pass++ : fail++; console.log(c ? 'PASS' : 'FAIL', n, x); };
// UTC date `days` from today at `hour`:00
const at = (days, hour) => { const d = new Date(); d.setUTCHours(hour, 0, 0, 0); d.setUTCDate(d.getUTCDate() + days); return d; };
const ymd = (d) => d.toISOString().slice(0, 10);

(async () => {
  const tok = (await signIn('+10000000014')).data.accessToken;
  const dest = 'Searchtown' + String(Date.now()).slice(-6);
  const mk = (origin, when) => call('POST', '/trips', tok, { originCity: origin, destinationCity: dest, departureAt: when.toISOString(), maxWeightKg: 10, pricePerKg: 3, mode: 'PLANE' });
  const D = 10;
  await mk('Lyon', at(D, 9)); await mk('Lyon', at(D, 18));
  await mk('Lyon', at(D - 3, 12)); await mk('Lyon', at(D + 2, 12)); await mk('Lyon', at(D + 20, 12));
  await mk('Bern', at(D + 1, 12));
  const c = await mk('Lyon', at(D, 12)); await call('DELETE', `/trips/${c.data.trip?.id}`, tok);
  const q = (params) => call('GET', '/trips/public?' + new URLSearchParams(params));

  let r = await q({ destination: dest, origin: 'lyon', date: ymd(at(D, 0)) });
  T('date given: that day\'s trips only (cancelled one excluded)', r.status === 200 && r.data.trips.length === 2 && r.data.trips.every((t) => ymd(new Date(t.departureAt)) === ymd(at(D, 0))), JSON.stringify(r.data.trips?.map((t) => t.departureAt)));
  const sim = r.data.similar || [];
  T('similar = same route on other upcoming dates', sim.length === 3 && sim.every((t) => t.originCity === 'Lyon' && ymd(new Date(t.departureAt)) !== ymd(at(D, 0))));
  T('similar listed in date order', sim.map((t) => t.departureAt).join() === [...sim.map((t) => t.departureAt)].sort().join());
  T('similar respects the origin filter (Bern trip left out)', !sim.some((t) => t.originCity === 'Bern'));

  r = await q({ destination: dest, date: ymd(at(D, 0)) });
  T('origin is optional: any departure city', r.data.trips.length === 2 && r.data.similar.some((t) => t.originCity === 'Bern'));

  r = await q({ destination: dest });
  T('no date: every upcoming trip on the route, no "similar" list', r.data.trips.length === 6 && r.data.similar.length === 0);

  r = await q({ destination: dest, date: 'not-a-date' });
  T('an invalid date is ignored', r.status === 200 && r.data.trips.length === 6);

  r = await q({ destination: dest, date: ymd(at(D + 5, 0)) });
  T('no trip that day: empty list but similar trips offered', r.data.trips.length === 0 && r.data.similar.length === 6);
  T('public results expose no traveller identity', !JSON.stringify(r.data).match(/"name"|"phone"/));

  console.log(`\n${pass} passed, ${fail} failed`);
})();
