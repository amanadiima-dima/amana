'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAuthStore } from '@/store/authStore';
import { bookingApi, tripApi, parcelApi } from '@/lib/api';
import { Package, Plane, ArrowRight, Clock } from 'lucide-react';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ trips: 0, parcels: 0, activeBookings: 0 });

  useEffect(() => {
    Promise.all([tripApi.getMyTrips(), parcelApi.getMyParcels(), bookingApi.getAll()])
      .then(([trips, parcels, bookings]) => {
        setStats({
          trips: trips.data.trips.length,
          parcels: parcels.data.parcels.length,
          activeBookings: bookings.data.bookings.filter((b: any) => ['PENDING', 'ACCEPTED'].includes(b.status)).length,
        });
      }).catch(() => {});
  }, []);

  const statCards = [
    { label: t('myTrips'), value: stats.trips, icon: Plane, color: 'bg-blue-50 text-blue-600', href: '/trips' },
    { label: t('myParcels'), value: stats.parcels, icon: Package, color: 'bg-purple-50 text-purple-600', href: '/parcels' },
    { label: t('activeBookings'), value: stats.activeBookings, icon: Clock, color: 'bg-green-50 text-green-600', href: '/bookings' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t('welcome', { name: user?.name?.split(' ')[0] || '' })}</h1>
        <p className="text-gray-500 mt-1">{t('subtitle')}</p>
        {!user?.isVerified && (
          <Link href="/profile#verification" className="inline-flex items-center gap-2 mt-3 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-amber-100 transition-colors">
            {t('verifyBanner')} <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, href }) => (
          <Link key={label} href={href} className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-shadow flex items-center gap-4">
            <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}><Icon className="w-6 h-6" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('quickActions')}</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <Link href="/parcels/search" className="bg-brand-600 text-white rounded-2xl p-6 hover:bg-brand-700 transition-colors">
          <Package className="w-8 h-8 mb-3" />
          <h3 className="font-bold text-lg">{t('sendParcel')}</h3>
          <p className="text-brand-100 text-sm mt-1">{t('sendParcelDesc')}</p>
        </Link>
        <Link href="/trips/new" className="bg-white border border-gray-200 text-gray-900 rounded-2xl p-6 hover:shadow-md transition-shadow">
          <Plane className="w-8 h-8 mb-3 text-brand-600" />
          <h3 className="font-bold text-lg">{t('postTrip')}</h3>
          <p className="text-gray-500 text-sm mt-1">{t('postTripDesc')}</p>
        </Link>
      </div>
    </div>
  );
}
