'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { tripApi, bookingApi } from '@/lib/api';
import { Plus, CheckCircle, XCircle } from 'lucide-react';

export default function TripsPage() {
  const [trips, setTrips] = useState<any[]>([]);

  useEffect(() => { tripApi.getMyTrips().then(({ data }) => setTrips(data.trips)); }, []);

  const respond = async (bookingId: string, action: 'accept' | 'reject') => {
    await bookingApi.respond(bookingId, action);
    const { data } = await tripApi.getMyTrips();
    setTrips(data.trips);
  };

  const statusColor: Record<string, string> = {
    OPEN: 'bg-green-100 text-green-700', FULL: 'bg-amber-100 text-amber-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700', COMPLETED: 'bg-gray-100 text-gray-600',
    CANCELLED: 'bg-red-100 text-red-600',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Trips</h1>
        <Link href="/trips/new" className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-brand-700 transition-colors">
          <Plus className="w-4 h-4" /> New Trip
        </Link>
      </div>

      {trips.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">✈️</p>
          <p className="font-semibold text-gray-600">No trips yet</p>
          <p className="text-sm mt-1">Post your first trip to start carrying parcels.</p>
        </div>
      )}

      <div className="space-y-4">
        {trips.map((trip) => (
          <div key={trip.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{trip.originCity} → {trip.destinationCity}</h3>
                <p className="text-sm text-gray-500">🗓 {new Date(trip.departureAt).toLocaleString()} · ⚖️ {trip.maxWeightKg}kg · €{trip.pricePerKg}/kg</p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor[trip.status] || 'bg-gray-100 text-gray-600'}`}>{trip.status}</span>
            </div>
            {trip.bookings?.filter((b: any) => b.status === 'PENDING').map((b: any) => (
              <div key={b.id} className="bg-gray-50 rounded-xl p-3 flex items-center gap-3 mt-2">
                <div className="flex-1 text-sm">
                  <p className="font-semibold text-gray-800">{b.parcelRequest?.description}</p>
                  <p className="text-gray-500">⚖️ {b.parcelRequest?.weightKg}kg · 📍 {b.parcelRequest?.deliveryAddress}</p>
                </div>
                <button onClick={() => respond(b.id, 'accept')} className="flex items-center gap-1 bg-green-500 text-white text-xs px-3 py-1.5 rounded-lg font-semibold hover:bg-green-600 transition-colors">
                  <CheckCircle className="w-3 h-3" /> Accept
                </button>
                <button onClick={() => respond(b.id, 'reject')} className="flex items-center gap-1 bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg font-semibold hover:bg-red-600 transition-colors">
                  <XCircle className="w-3 h-3" /> Reject
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
