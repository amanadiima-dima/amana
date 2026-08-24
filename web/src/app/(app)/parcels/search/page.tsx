'use client';
import { useState } from 'react';
import Link from 'next/link';
import { tripApi } from '@/lib/api';
import { Search, Star } from 'lucide-react';
import CityAutocomplete from '@/components/ui/CityAutocomplete';

export default function SearchTripsPage() {
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [trips, setTrips] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await tripApi.search(destination, date);
      setTrips(data.trips || []);
      setSearched(true);
    } catch {
      setTrips([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Find a Traveler</h1>

      <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Destination</label>
            <CityAutocomplete
              value={destination}
              onChange={setDestination}
              placeholder="e.g. Algiers"
              required
            />
          </div>
          <div className="sm:w-44">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="sm:self-end">
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-brand-700 transition-colors disabled:opacity-60">
              <Search className="w-4 h-4" /> {loading ? 'Searching…' : 'Search'}
            </button>
          </div>
        </div>
      </form>

      {searched && trips.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">🔍</p>
          <p className="font-semibold text-gray-600">No trips found</p>
          <p className="text-sm mt-1">Try a different destination or date.</p>
        </div>
      )}

      <div className="space-y-4">
        {trips.map((trip) => (
          <div key={trip.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{trip.originCity} → {trip.destinationCity}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  🗓 {new Date(trip.departureAt).toLocaleDateString()} · ⚖️ {trip.maxWeightKg}kg available · 💶 €{trip.pricePerKg}/kg
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
                Send with them →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
