'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMoney } from '@/lib/money';
import { Link } from '@/i18n/navigation';
import { tripApi } from '@/lib/api';
import { Plus, Bell } from 'lucide-react';
import { modeMeta, formatDuration } from '@/lib/trip';

export default function TripsPage() {
  const t = useTranslations('tripsPage');
  const tCommon = useTranslations('common');
  const money = useMoney();
  const [trips, setTrips] = useState<any[]>([]);

  useEffect(() => { tripApi.getMyTrips().then(({ data }) => setTrips(data.trips)); }, []);

  const statusColor: Record<string, string> = {
    OPEN: 'bg-green-100 text-green-700', FULL: 'bg-amber-100 text-amber-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700', COMPLETED: 'bg-gray-100 text-gray-600',
    CANCELLED: 'bg-red-100 text-red-600',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <Link href="/trips/new" className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-brand-700 transition-colors">
          <Plus className="w-4 h-4" /> {t('newTrip')}
        </Link>
      </div>

      {trips.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">✈️</p>
          <p className="font-semibold text-gray-600">{t('emptyTitle')}</p>
          <p className="text-sm mt-1">{t('emptySubtitle')}</p>
        </div>
      )}

      <div className="space-y-4">
        {trips.map((trip) => {
          const pending = trip.bookings?.filter((b: any) => b.status === 'PENDING').length || 0;
          return (
            <Link
              key={trip.id}
              href={`/trips/${trip.id}`}
              className="block bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:border-brand-200 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-1">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{trip.originCity} → {trip.destinationCity}</h3>
                  <p className="text-sm text-gray-500">
                    🗓 {new Date(trip.departureAt).toLocaleString()} · {modeMeta(trip.mode).emoji} {tCommon(`modes.${modeMeta(trip.mode).value}`)}
                    {formatDuration(trip.estimatedDurationMinutes) && ` · ≈ ${formatDuration(trip.estimatedDurationMinutes)}`}
                    {' · '}⚖️ {trip.maxWeightKg}kg · {money(trip.pricePerKg, trip.currency)}/kg
                  </p>
                  {trip.originAddress && (
                    <p className="text-xs text-gray-400 mt-0.5">📍 {t('pickupPrefix')}{trip.originAddress}</p>
                  )}
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${statusColor[trip.status] || 'bg-gray-100 text-gray-600'}`}>{tCommon(`status.${trip.status}`)}</span>
              </div>
              {pending > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5 mt-3 w-fit">
                  <Bell className="w-3.5 h-3.5" /> {t('pendingRequest', { count: pending })}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
