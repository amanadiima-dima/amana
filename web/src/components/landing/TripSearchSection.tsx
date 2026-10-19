'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { formatMoney } from '@/lib/money';
import { Link } from '@/i18n/navigation';
import { Search, MapPin, Calendar, ChevronRight, Shield, Package, Loader2, SlidersHorizontal, X, Clock } from 'lucide-react';
import { modeMeta, formatDuration } from '@/lib/trip';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// ── Nominatim city autocomplete ───────────────────────────────────────────────
function CityInput({
  value, onChange, placeholder, required = false,
}: { value: string; onChange: (v: string) => void; placeholder: string; required?: boolean }) {
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
    const city = item.address?.city || item.address?.town || item.address?.village || item.name;
    onChange(city);
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
      <input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        className="w-full bg-transparent text-gray-900 placeholder-gray-400 text-sm font-medium focus:outline-none py-1"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute top-full start-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-[100] overflow-hidden">
          {suggestions.map((s) => {
            const city = s.address?.city || s.address?.town || s.address?.village || s.name;
            const country = s.address?.country || '';
            return (
              <li key={s.place_id} onMouseDown={() => pick(s)}
                className="px-4 py-2.5 hover:bg-brand-50 cursor-pointer text-sm flex items-center gap-2">
                <MapPin className="w-3 h-3 text-brand-400 shrink-0" />
                <span className="font-medium text-gray-800">{city}</span>
                <span className="text-gray-400 text-xs">{country}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ── Trip card (anonymous — no traveler info shown before login) ───────────────
function TripCard({ trip }: { trip: any }) {
  const t = useTranslations('landing.search');
  const locale = useLocale();
  const depDate = new Date(trip.departureAt);
  const dateStr = depDate.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <Link
      href={`/trips/${trip.id}`}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-brand-200 hover:-translate-y-0.5 transition-all p-5 flex flex-col sm:flex-row sm:items-center gap-4 cursor-pointer block"
    >
      {/* Route */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-gray-900 text-lg">{trip.originCity}</span>
          <ChevronRight className="w-5 h-5 text-brand-400 shrink-0 rtl:rotate-180" />
          <span className="font-bold text-brand-700 text-lg">{trip.destinationCity}</span>
        </div>
        <div className="flex items-center gap-4 mt-2 flex-wrap text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />{dateStr}
          </span>
          <span className="flex items-center gap-1.5">
            {modeMeta(trip.mode).emoji} {modeMeta(trip.mode).label}
          </span>
          {formatDuration(trip.estimatedDurationMinutes) && (
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />≈ {formatDuration(trip.estimatedDurationMinutes)}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5" />{t('kgAvailable', { weight: trip.maxWeightKg })}
          </span>
          {trip.traveler?.isVerified && (
            <span className="flex items-center gap-1 text-green-600 font-medium text-xs">
              <Shield className="w-3.5 h-3.5" /> {t('verifiedCarrier')}
            </span>
          )}
        </div>
        {trip.notes && (
          <p className="text-xs text-gray-400 mt-1.5 truncate max-w-sm italic">&ldquo;{trip.notes}&rdquo;</p>
        )}
      </div>

      {/* Price + CTA */}
      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0">
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

// ── Main section ──────────────────────────────────────────────────────────────
export default function TripSearchSection() {
  const t = useTranslations('landing.search');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searched, setSearched] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Load all upcoming trips on mount
  useEffect(() => {
    fetch(`${BASE_URL}/trips/public`)
      .then((r) => r.json())
      .then((d) => { setTrips(d.trips || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams();
      if (origin) params.set('origin', origin);
      if (destination) params.set('destination', destination);
      if (date) params.set('date', date);
      const r = await fetch(`${BASE_URL}/trips/public?${params}`);
      const d = await r.json();
      setTrips(d.trips || []);
    } catch {
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setOrigin('');
    setDestination('');
    setDate('');
    setSearched(false);
    setLoading(true);
    fetch(`${BASE_URL}/trips/public`)
      .then((r) => r.json())
      .then((d) => setTrips(d.trips || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const displayed = verifiedOnly ? trips.filter((t) => t.traveler?.isVerified) : trips;

  return (
    <section className="bg-gray-50 py-20 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
            {t('heading')}
          </h2>
          <p className="text-gray-500 text-lg">{t('subheading')}</p>
        </div>

        {/* ── Search bar (BlaBlaCar style) ─────────────────────────────── */}
        <form onSubmit={handleSearch}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col md:flex-row items-stretch md:items-center gap-0 mb-4">

          {/* From */}
          <div className="flex items-center gap-2 px-5 py-4 flex-1 border-b md:border-b-0 md:border-e border-gray-100 relative">
            <MapPin className="w-4 h-4 text-brand-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{t('from')}</p>
              <CityInput value={origin} onChange={setOrigin} placeholder={t('fromPlaceholder')} />
            </div>
          </div>

          {/* To */}
          <div className="flex items-center gap-2 px-5 py-4 flex-1 border-b md:border-b-0 md:border-e border-gray-100 relative">
            <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{t('to')}</p>
              <CityInput value={destination} onChange={setDestination} placeholder={t('toPlaceholder')} />
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center gap-2 px-5 py-4 flex-1 border-b md:border-b-0 md:border-e border-gray-100">
            <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{t('date')}</p>
              <input
                type="date"
                value={date}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-transparent text-gray-900 placeholder-gray-400 text-sm font-medium focus:outline-none py-1"
              />
            </div>
          </div>

          {/* Search button */}
          <button type="submit"
            className="flex items-center justify-center gap-2 bg-brand-600 text-white font-bold px-8 py-5 hover:bg-brand-700 transition-colors text-sm rounded-b-2xl md:rounded-b-none md:rounded-e-2xl">
            <Search className="w-4 h-4" />
            {t('search')}
          </button>
        </form>

        {/* ── Filter pills ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <SlidersHorizontal className="w-4 h-4 text-gray-400" />
          <button
            onClick={() => setVerifiedOnly((v) => !v)}
            className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full border transition-colors ${
              verifiedOnly
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
            }`}>
            <Shield className="w-3.5 h-3.5" /> {t('verifiedOnly')}
          </button>

          {searched && (
            <button onClick={clearSearch}
              className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full border bg-white text-gray-500 border-gray-200 hover:bg-gray-50 transition-colors ms-auto">
              <X className="w-3.5 h-3.5" /> {t('clearFilters')}
            </button>
          )}

          {!loading && (
            <span className="text-sm text-gray-400 ms-auto">
              {t('tripsFound', { count: displayed.length })}
            </span>
          )}
        </div>

        {/* ── Results ──────────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">✈️</p>
            <p className="font-semibold text-gray-600">{t('noTripsTitle')}</p>
            <p className="text-sm mt-1">{t('noTripsSubtitle')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.map((trip) => <TripCard key={trip.id} trip={trip} />)}
          </div>
        )}

        {/* Sign-up nudge */}
        <div className="text-center mt-10">
          <p className="text-gray-500 text-sm">
            {t('areYouTraveler')}{' '}
            <Link href="/trips/new" className="text-brand-600 font-semibold hover:underline">
              {t('postYourTrip')}
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
