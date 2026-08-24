'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { bookingApi } from '@/lib/api';
import { Package } from 'lucide-react';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => { bookingApi.getAll().then(({ data }) => setBookings(data.bookings || [])).catch(() => {}); }, []);

  const statusColor: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700', ACCEPTED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-600', CANCELLED: 'bg-gray-100 text-gray-500',
    COMPLETED: 'bg-blue-100 text-blue-700',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Bookings</h1>

      {bookings.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">🤝</p>
          <p className="font-semibold text-gray-600">No bookings yet</p>
          <p className="text-sm mt-1 mb-6">Search for a traveler to send your first parcel.</p>
          <Link href="/parcels/search" className="inline-flex items-center gap-2 bg-brand-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-700 transition-colors">
            <Package className="w-4 h-4" /> Find a Traveler
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {bookings.map((booking) => (
          <Link key={booking.id} href={`/bookings/${booking.id}`}
            className="block bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-gray-900">
                  {booking.trip?.originCity} → {booking.trip?.destinationCity}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  📦 {booking.parcelRequest?.description} · ⚖️ {booking.parcelRequest?.weightKg}kg
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  🗓 {booking.trip?.departureAt ? new Date(booking.trip.departureAt).toLocaleDateString() : '—'}
                </p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor[booking.status] || 'bg-gray-100 text-gray-600'}`}>
                {booking.status}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
