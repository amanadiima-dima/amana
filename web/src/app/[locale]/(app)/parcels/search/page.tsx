'use client';
import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useMoney } from '@/lib/money';
import { Link } from '@/i18n/navigation';
import { tripApi } from '@/lib/api';
import { Search, Star } from 'lucide-react';
import CityAutocomplete from '@/components/ui/CityAutocomplete';

export default function SearchTripsPage() {
  const t = useTranslations('parcelSearch');
  const locale = useLocale();
  const money = useMoney();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [trips, setTrips] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [searchedOrigin, setSearchedOrigin] = useState('');
  const [searchedDestination, setSearchedDestination] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await tripApi.search({ origin: origin.trim(), destination: destination.trim(), date });
      setTrips(data.trips || []);
      setSearchedOrigin(origin.trim());
      setSearchedDestination(destination.trim());
      setSearched(true);
    } catch {
      setTrips([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const hasCriteria = !!(searchedOrigin || searchedDestination || date);
  const exactTrips = trips.filter((tr) => tr.matchType !== 'nearby');
  const nearbyTrips = trips.filter((tr) => tr.matchType === 'nearby');

  const renderTrip = (trip: any) => (
    <div key={trip.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-gray-900 text-lg">{trip.originCity} → {trip.destinationCity}</h3>
          {trip.matchType === 'nearby' && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {trip.originDistanceKm > 0 && (
                <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                  {t('nearbyOriginBadge', { km: trip.originDistanceKm, city: searchedOrigin })}
                </span>
              )}
              {trip.destinationDistanceKm > 0 && (
                <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                  {t('nearbyBadge', { km: trip.destinationDistanceKm, city: searchedDestination })}
                </span>
              )}
            </div>
          )}
          <p className="text-sm text-gray-500 mt-1">
            🗓 {new Date(trip.departureAt).toLocaleDateString(locale)} · ⚖️ {trip.maxWeightKg}kg {t('kgAvailable')} · 💶 {money(trip.pricePerKg, trip.currency)}/kg
          </p>
          {trip.traveler && (
            <div className="flex items-center gap-2 mt-2">
              <div className="w-7 h-7 bg-brand-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {trip.traveler.name?.charAt(0)}
              </div>
              <span className="text-sm font-medium text-gray-700">{trip.traveler.name}</span>
              {trip.traveler.rating > 0 && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {Number(trip.traveler.rating).toFixed(1)}
                </span>
              )}
            </div>
          )}
        </div>
        <Link href={`/trips/${trip.id}`}
          className="bg-brand-600 text-white text-sm px-4 py-2 rounded-xl font-semibold hover:bg-brand-700 transition-colors whitespace-nowrap">
          {t('sendWithThem')}
        </Link>
      </div>
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('title')}</h1>

      <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-6">
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t('origin')} <span className="normal-case font-normal text-gray-400">{t('dateOptional')}</span></label>
            <CityAutocomplete value={origin} onChange={setOrigin} placeholder={t('originPlaceholder')} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t('destination')} <span className="normal-case font-normal text-gray-400">{t('dateOptional')}</span></label>
            <CityAutocomplete value={destination} onChange={setDestination} placeholder={t('destinationPlaceholder')} />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="sm:w-56">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t('date')} <span className="normal-case font-normal text-gray-400">{t('dateOptional')}</span></label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="sm:self-end sm:ms-auto">
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-brand-700 transition-colors disabled:opacity-60">
              <Search className="w-4 h-4" /> {loading ? t('searching') : t('search')}
            </button>
          </div>
        </div>
      </form>

      <p className="text-xs text-gray-400 -mt-3 mb-6">{t('dateHint')}</p>

      {searched && trips.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">🔍</p>
          <p className="font-semibold text-gray-600">{t('emptyTitle')}</p>
          <p className="text-sm mt-1">{t('emptySubtitle')}</p>
        </div>
      )}

      {exactTrips.length > 0 && (
        <>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">{hasCriteria ? t('bestMatches') : t('allTrips')}</h2>
          <div className="space-y-4 mb-8">{exactTrips.map(renderTrip)}</div>
        </>
      )}

      {nearbyTrips.length > 0 && (
        <>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-1">{t('nearbyHeading')}</h2>
          {exactTrips.length === 0 && <p className="text-sm text-gray-500 mb-3">{t('nearbyIntro')}</p>}
          <div className="space-y-4 mt-3">{nearbyTrips.map(renderTrip)}</div>
        </>
      )}
    </div>
  );
}
