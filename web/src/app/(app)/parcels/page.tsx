'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { parcelApi } from '@/lib/api';
import { Plus, Search } from 'lucide-react';

export default function ParcelsPage() {
  const [parcels, setParcels] = useState<any[]>([]);

  useEffect(() => { parcelApi.getMyParcels().then(({ data }) => setParcels(data.parcels || [])).catch(() => {}); }, []);

  const statusColor: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700', MATCHED: 'bg-blue-100 text-blue-700',
    IN_TRANSIT: 'bg-purple-100 text-purple-700', DELIVERED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-600',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Parcels</h1>
        <div className="flex items-center gap-2">
          <Link href="/parcels/new" className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors">
            <Plus className="w-4 h-4" /> New Parcel
          </Link>
          <Link href="/parcels/search" className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-brand-700 transition-colors">
            <Search className="w-4 h-4" /> Find a Traveler
          </Link>
        </div>
      </div>

      {parcels.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">📦</p>
          <p className="font-semibold text-gray-600">No parcels yet</p>
          <p className="text-sm mt-1 mb-6">Search for a traveler going to your destination.</p>
          <Link href="/parcels/search" className="inline-flex items-center gap-2 bg-brand-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-700 transition-colors">
            <Search className="w-4 h-4" /> Search Travelers
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {parcels.map((parcel) => (
          <div key={parcel.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-gray-900">{parcel.description}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  📍 {parcel.deliveryAddress} · ⚖️ {parcel.weightKg}kg
                  {parcel.fragile && ' · 🔴 Fragile'}
                </p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor[parcel.status] || 'bg-gray-100 text-gray-600'}`}>
                {parcel.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
