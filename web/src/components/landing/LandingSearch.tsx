'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { formatMoney } from '@/lib/money';
import { Link } from '@/i18n/navigation';
import { Search, MapPin, Calendar, ChevronRight, ChevronLeft, Shield, Package, Loader2, X, Clock, Plane, ShieldCheck, ArrowRight } from 'lucide-react';
import { modeMeta, formatDuration } from '@/lib/trip';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

type Query = { origin: string; destination: string; date: string };
type Route = { originCity: string; destinationCity: string; currency: string; trips: number; minPricePerKg: number; nextDepartureAt: string };

// ── Nominatim city autocomplete ───────────────────────────────────────────────
function CityInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback((q: string) => {
    if (q.length < 2) { setSuggestions([]); return; }
    fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&featuretype=city&q=${encodeURIComponent(q)}`, {
      headers: { 'Accept-Language': 'en' },
    })
      .then((r) => r.json())
      .then((data) => { setSuggestions(data); setOpen(true); })
      .catch(() => {});
  }, []);

  const handleChange = (v: string) => {
    onChange(v);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fetchSuggestions(v), 300);
  };

  const pick = (item: any) => {
    onChange(item.address?.city || item.address?.town || item.address?.village || item.name);
    setSuggestions([]);
    setOpen(false);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={wrapRef} className="relative flex-1">
      <input value={value} onChange={(e) => handleChange(e.target.value)} placeholder={placeholder} autoComplete="off"
        className="w-full bg-transparent text-gray-900 placeholder-gray-400 text-sm font-medium focus:outline-none py-1" />
      {open && suggestions.length > 0 && (
        <ul className="absolute top-full start-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-[100] overflow-hidden">
          {suggestions.map((s) => (
            <li key={s.place_id} onMouseDown={() => pick(s)} className="px-4 py-2.5 hover:bg-brand-50 cursor-pointer text-sm flex items-center gap-2">
              <MapPin className="w-3 h-3 text-brand-400 shrink-0" />
              <span className="font-medium text-gray-800">{s.address?.city || s.address?.town || s.address?.village || s.name}</span>
              <span className="text-gray-400 text-xs">{s.address?.country || ''}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Search bar (hero and sticky versions) ─────────────────────────────────────
function SearchBar({ q, setQ, onSubmit, compact = false }: { q: Query; setQ: (q: Query) => void; onSubmit: () => void; compact?: boolean }) {
  const t = useTranslations('landing.search');
  const cell = compact ? 'px-4 py-2' : 'px-5 py-4';
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
      className={`bg-white rounded-2xl border flex flex-col md:flex-row items-stretch md:items-center ${compact ? 'border-gray-200' : 'shadow-xl border-gray-100'}`}>
      <div className={`flex items-center gap-2 ${cell} flex-1 border-b md:border-b-0 md:border-e border-gray-100`}>
        <MapPin className="w-4 h-4 text-brand-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('from')}</p>
          <CityInput value={q.origin} onChange={(origin) => setQ({ ...q, origin })} placeholder={t('fromPlaceholder')} />
        </div>
      </div>
      <div className={`flex items-center gap-2 ${cell} flex-1 border-b md:border-b-0 md:border-e border-gray-100`}>
        <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('to')}</p>
          <CityInput value={q.destination} onChange={(destination) => setQ({ ...q, destination })} placeholder={t('toPlaceholder')} />
        </div>
      </div>
      <div className={`flex items-center gap-2 ${cell} md:w-44 border-b md:border-b-0 md:border-e border-gray-100`}>
        <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('date')}</p>
          <input type="date" value={q.date} min={new Date().toISOString().split('T')[0]} onChange={(e) => setQ({ ...q, date: e.target.value })}
            className="w-full bg-transparent text-gray-900 text-sm font-medium focus:outline-none py-1" />
        </div>
      </div>
      <button type="submit"
        className={`flex items-center justify-center gap-2 bg-brand-600 text-white font-bold hover:bg-brand-700 transition-colors text-sm rounded-b-2xl md:rounded-b-none md:rounded-e-2xl ${compact ? 'px-6 py-3 md:self-stretch' : 'px-8 py-5 md:self-stretch'}`}>
        <Search className="w-4 h-4" /> {t('search')}
      </button>
    </form>
  );
}

// ── Hero illustration (no photos yet): a route from Europe to North Africa ────
function HeroIllustration() {
  const t = useTranslations('landing.hero');
  return (
    <div aria-hidden className="relative h-64 md:h-80 rounded-[2rem] bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 overflow-hidden">
      <div className="absolute -top-16 -end-16 w-64 h-64 rounded-full bg-white/10" />
      <div className="absolute -bottom-20 -start-10 w-72 h-72 rounded-full bg-white/5" />
      <svg viewBox="0 0 400 260" className="absolute inset-0 w-full h-full rtl:-scale-x-100" preserveAspectRatio="xMidYMid meet">
        <path d="M60 70 C 160 20, 250 220, 340 190" fill="none" stroke="white" strokeOpacity="0.7" strokeWidth="3" strokeDasharray="2 10" strokeLinecap="round" />
        <circle cx="60" cy="70" r="9" fill="white" />
        <circle cx="340" cy="190" r="9" fill="#fbbf24" />
      </svg>
      <div className="absolute top-[38%] start-[46%] bg-white rounded-2xl p-3 shadow-lg rotate-12 rtl:-rotate-12">
        <Plane className="w-7 h-7 text-brand-600 rtl:-scale-x-100" />
      </div>
      <div className="absolute bottom-6 end-6 bg-amber-400 rounded-2xl p-3 shadow-lg">
        <Package className="w-7 h-7 text-gray-900" />
      </div>
      <div className="absolute top-6 start-6 flex flex-col gap-2">
        <span className="inline-flex items-center gap-1.5 bg-white/95 text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-full shadow"><ShieldCheck className="w-3.5 h-3.5 text-green-600" /> {t('chipPayment')}</span>
        <span className="inline-flex items-center gap-1.5 bg-white/95 text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-full shadow"><Shield className="w-3.5 h-3.5 text-brand-600" /> {t('chipVerified')}</span>
      </div>
    </div>
  );
}

// ── Trip card (anonymous — no traveler info shown before login) ───────────────
function TripCard({ trip }: { trip: any }) {
  const t = useTranslations('landing.search');
  const locale = useLocale();
  const dateStr = new Date(trip.departureAt).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });
  return (
    <Link href={`/trips/${trip.id}`}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-brand-200 transition-all p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-gray-900 text-lg">{trip.originCity}</span>
          <ChevronRight className="w-5 h-5 text-brand-400 shrink-0 rtl:rotate-180" />
          <span className="font-bold text-brand-700 text-lg">{trip.destinationCity}</span>
        </div>
        <div className="flex items-center gap-4 mt-2 flex-wrap text-sm text-gray-500">
          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{dateStr}</span>
          <span className="flex items-center gap-1.5">{modeMeta(trip.mode).emoji} {modeMeta(trip.mode).label}</span>
          {formatDuration(trip.estimatedDurationMinutes) && (
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />≈ {formatDuration(trip.estimatedDurationMinutes)}</span>
          )}
          <span className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5" />{t('kgAvailable', { weight: trip.maxWeightKg })}</span>
          {trip.traveler?.isVerified && (
            <span className="flex items-center gap-1 text-green-600 font-medium text-xs"><Shield className="w-3.5 h-3.5" /> {t('verifiedCarrier')}</span>
          )}
        </div>
      </div>
      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
        <div className="text-end">
          <p className="text-2xl font-extrabold text-gray-900">{formatMoney(trip.pricePerKg, trip.currency, locale)}</p>
          <p className="text-xs text-gray-400">{t('perKg')}</p>
        </div>
        <span className="flex items-center gap-1.5 bg-brand-600 group-hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors whitespace-nowrap">
          {t('viewTrip')} <ChevronRight className="w-4 h-4 rtl:rotate-180" />
        </span>
      </div>
    </Link>
  );
}

// ── Popular routes (real open trips, cheapest price per kg) ───────────────────
const CARD_COLORS = ['from-brand-500 to-brand-700', 'from-amber-400 to-orange-500', 'from-emerald-500 to-teal-600', 'from-violet-500 to-purple-700', 'from-rose-400 to-pink-600', 'from-sky-400 to-blue-600'];

function PopularRoutes({ routes, onPick }: { routes: Route[]; onPick: (r: Route) => void }) {
  const t = useTranslations('landing.routes');
  const locale = useLocale();
  const rowRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => {
    const el = rowRef.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === 'rtl' ? -1 : 1;
    el.scrollBy({ left: dir * rtl * el.clientWidth * 0.8, behavior: 'smooth' });
  };
  if (!routes.length) return null;
  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900">{t('heading')}</h2>
            <p className="text-gray-500 mt-2">{t('subheading')}</p>
          </div>
          <div className="hidden md:flex gap-2">
            <button onClick={() => scroll(-1)} aria-label={t('previous')} className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"><ChevronLeft className="w-5 h-5 rtl:rotate-180" /></button>
            <button onClick={() => scroll(1)} aria-label={t('next')} className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"><ChevronRight className="w-5 h-5 rtl:rotate-180" /></button>
          </div>
        </div>
        <div ref={rowRef} className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 [scrollbar-width:none]">
          {routes.map((r, i) => (
            <button key={`${r.originCity}-${r.destinationCity}-${r.currency}`} onClick={() => onPick(r)}
              className="snap-start shrink-0 w-64 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow overflow-hidden text-start group">
              <div className={`h-28 bg-gradient-to-br ${CARD_COLORS[i % CARD_COLORS.length]} relative overflow-hidden`}>
                <div className="absolute -bottom-6 -end-6 w-24 h-24 rounded-full bg-white/15" />
                <span className="absolute bottom-3 start-4 text-4xl font-black text-white/90 tracking-tight">
                  {r.originCity.slice(0, 3).toUpperCase()}<span className="text-white/60 mx-1">→</span>{r.destinationCity.slice(0, 3).toUpperCase()}
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center pt-1.5">
                    <span className="w-2 h-2 rounded-full border-2 border-gray-700" />
                    <span className="w-0.5 h-5 bg-gray-300" />
                    <span className="w-2 h-2 rounded-full border-2 border-gray-700" />
                  </div>
                  <div className="text-sm font-semibold text-gray-900 leading-7 min-w-0">
                    <p className="truncate">{r.originCity}</p>
                    <p className="truncate">{r.destinationCity}</p>
                  </div>
                </div>
                <div className="flex items-end justify-between mt-3">
                  <div>
                    <p className="text-xs text-gray-400">{t('from')}</p>
                    <p className="text-xl font-extrabold text-gray-900">{formatMoney(r.minPricePerKg, r.currency, locale)}<span className="text-sm font-medium text-gray-400">{t('perKg')}</span></p>
                    <p className="text-xs text-gray-400">{t('trips', { count: r.trips })}</p>
                  </div>
                  <span className="w-10 h-10 rounded-full bg-brand-600 group-hover:bg-brand-700 text-white flex items-center justify-center transition-colors">
                    <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Main: hero + sticky search + popular routes + results ─────────────────────
export default function LandingSearch() {
  const t = useTranslations('landing');
  const params = useSearchParams();
  const [q, setQ] = useState<Query>({ origin: params.get('from') || '', destination: params.get('to') || '', date: '' });
  const [active, setActive] = useState<Query | null>(null); // the search shown in the results
  const [trips, setTrips] = useState<any[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [sticky, setSticky] = useState(false);
  const heroSearchRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLElement>(null);

  const load = useCallback((query: Query | null, scroll: boolean) => {
    setLoading(true);
    setActive(query);
    setShowAll(false);
    const p = new URLSearchParams();
    if (query?.origin.trim()) p.set('origin', query.origin.trim());
    if (query?.destination.trim()) p.set('destination', query.destination.trim());
    if (query?.date) p.set('date', query.date);
    fetch(`${BASE_URL}/trips/public?${p}`)
      .then((r) => r.json())
      .then((d) => setTrips(d.trips || []))
      .catch(() => setTrips([]))
      .finally(() => setLoading(false));
    if (scroll) resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  useEffect(() => {
    const from = params.get('from'), to = params.get('to');
    load(from || to ? { origin: from || '', destination: to || '', date: '' } : null, !!(from || to));
    fetch(`${BASE_URL}/trips/popular-routes`).then((r) => r.json()).then((d) => setRoutes(d.routes || [])).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // The compact bar appears once the hero search has scrolled out of view.
  useEffect(() => {
    const el = heroSearchRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setSticky(!e.isIntersecting && e.boundingClientRect.top < 0), { rootMargin: '-64px 0px 0px 0px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const submit = () => load({ ...q }, true);
  const pickRoute = (r: Route) => {
    const next = { origin: r.originCity, destination: r.destinationCity, date: '' };
    setQ(next);
    load(next, true);
  };
  const clear = () => { setQ({ origin: '', destination: '', date: '' }); load(null, false); };

  const displayed = verifiedOnly ? trips.filter((x) => x.traveler?.isVerified) : trips;
  const searched = !!(active && (active.origin || active.destination || active.date));

  return (
    <>
      {/* Sticky compact search */}
      <div className={`fixed top-16 inset-x-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm transition-all duration-200 ${sticky ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`}>
        <div className="max-w-6xl mx-auto px-4 py-2">
          <div className="hidden md:block"><SearchBar q={q} setQ={setQ} onSubmit={submit} compact /></div>
          <button onClick={() => heroSearchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
            className="md:hidden w-full flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2.5 text-sm text-gray-600">
            <Search className="w-4 h-4" /> {q.origin || q.destination ? `${q.origin || '…'} → ${q.destination || '…'}` : t('search.mobileSticky')}
          </button>
        </div>
      </div>

      {/* Hero */}
      <section className="pt-24 pb-12 px-4 bg-gradient-to-b from-brand-50/60 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 items-center mb-10">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-gray-900">
                {t('hero.titleLine1')} <span className="text-brand-600">{t('hero.titleHighlight')}</span> {t('hero.titleLine2')}
              </h1>
              <p className="text-lg text-gray-500 mt-5 leading-relaxed">{t('hero.description')}</p>
            </div>
            <HeroIllustration />
          </div>
          <div ref={heroSearchRef}><SearchBar q={q} setQ={setQ} onSubmit={submit} /></div>
        </div>
      </section>

      <PopularRoutes routes={routes} onPick={pickRoute} />

      {/* Results */}
      <section id="trips" ref={resultsRef} className="bg-gray-50 py-16 px-4 scroll-mt-32">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-6">
            {searched && active?.origin && active?.destination
              ? t('search.resultsFor', { from: active.origin, to: active.destination })
              : searched ? t('search.resultsHeading') : t('search.upcomingHeading')}
          </h2>
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <button onClick={() => setVerifiedOnly((v) => !v)}
              className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full border transition-colors ${verifiedOnly ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'}`}>
              <Shield className="w-3.5 h-3.5" /> {t('search.verifiedOnly')}
            </button>
            {searched && (
              <button onClick={clear} className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full border bg-white text-gray-500 border-gray-200 hover:bg-gray-50">
                <X className="w-3.5 h-3.5" /> {t('search.clearFilters')}
              </button>
            )}
            {!loading && <span className="text-sm text-gray-400 ms-auto">{t('search.tripsFound', { count: displayed.length })}</span>}
          </div>
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>
          ) : displayed.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <p className="text-4xl mb-3">✈️</p>
              <p className="font-semibold text-gray-700">{t('search.noTripsTitle')}</p>
              <p className="text-sm text-gray-400 mt-1">{t('search.noTripsSubtitle')}</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">{(showAll ? displayed : displayed.slice(0, 6)).map((trip) => <TripCard key={trip.id} trip={trip} />)}</div>
              {!showAll && displayed.length > 6 && (
                <div className="text-center mt-6">
                  <button onClick={() => setShowAll(true)} className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 font-semibold text-sm px-6 py-2.5 rounded-full hover:bg-gray-50">
                    {t('search.showMore', { count: displayed.length - 6 })}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
