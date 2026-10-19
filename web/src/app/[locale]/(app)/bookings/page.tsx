'use client';
import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { bookingApi } from '@/lib/api';
import { Package } from 'lucide-react';

export default function BookingsPage() {
  const t = useTranslations('bookingsPage');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const [asSender, setAsSender] = useState<any[]>([]);
  const [asTraveler, setAsTraveler] = useState<any[]>([]);
  const [asPayer, setAsPayer] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      bookingApi.getAll('sender').then(({ data }) => setAsSender(data.bookings || [])).catch(() => {}),
      bookingApi.getAll('traveler').then(({ data }) => setAsTraveler(data.bookings || [])).catch(() => {}),
      bookingApi.getAll('payer').then(({ data }) => setAsPayer((data.bookings || []).filter((b: any) => b.senderId !== b.payerId))).catch(() => {}),
    ]).finally(() => setLoaded(true));
  }, []);

  const statusColor: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700', PAYMENT_PENDING: 'bg-amber-100 text-amber-700', ACCEPTED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-600', CANCELLED: 'bg-gray-100 text-gray-500',
    COMPLETED: 'bg-blue-100 text-blue-700',
  };

  const renderBooking = (booking: any, showSender: boolean) => (
    <Link key={booking.id} href={`/bookings/${booking.id}`}
      className="block bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-gray-900">
            {booking.trip?.originCity} → {booking.trip?.destinationCity}
          </h3>
          {showSender && booking.parcelRequest?.sender?.name && (
            <p className="text-sm font-medium text-brand-600 mt-0.5">{t('fromSender', { name: booking.parcelRequest.sender.name })}</p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            📦 {booking.parcelRequest?.description} · ⚖️ {booking.parcelRequest?.weightKg}kg
          </p>
          <p className="text-sm text-gray-400 mt-1">
            🗓 {booking.trip?.departureAt ? new Date(booking.trip.departureAt).toLocaleDateString(locale) : '—'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor[booking.status] || 'bg-gray-100 text-gray-600'}`}>
            {tCommon(`status.${booking.status}`)}
          </span>
          {booking.unreadMessages > 0 && (
            <span className="text-xs font-semibold bg-brand-600 text-white px-2.5 py-1 rounded-full">
              💬 {t('unreadBadge', { count: booking.unreadMessages })}
            </span>
          )}
        </div>
      </div>
    </Link>
  );

  const empty = loaded && asSender.length === 0 && asTraveler.length === 0 && asPayer.length === 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('title')}</h1>

      {empty && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">🤝</p>
          <p className="font-semibold text-gray-600">{t('emptyTitle')}</p>
          <p className="text-sm mt-1 mb-6">{t('emptySubtitle')}</p>
          <Link href="/parcels/search" className="inline-flex items-center gap-2 bg-brand-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-700 transition-colors">
            <Package className="w-4 h-4" /> {t('findTraveler')}
          </Link>
        </div>
      )}

      {asPayer.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">{t('asPayerHeading')}</h2>
          <div className="space-y-4">{asPayer.map((b) => renderBooking(b, true))}</div>
        </section>
      )}

      {asTraveler.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">{t('asTravelerHeading')}</h2>
          <div className="space-y-4">{asTraveler.map((b) => renderBooking(b, true))}</div>
        </section>
      )}

      {asSender.length > 0 && (
        <section>
          {(asTraveler.length > 0 || asPayer.length > 0) && (
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">{t('asSenderHeading')}</h2>
          )}
          <div className="space-y-4">{asSender.map((b) => renderBooking(b, false))}</div>
        </section>
      )}
    </div>
  );
}
