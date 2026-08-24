'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { tripApi } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import CityAutocomplete from '@/components/ui/CityAutocomplete';

export default function NewTripPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    originCity: '', destinationCity: '', departureAt: '',
    maxWeightKg: '', pricePerKg: '', notes: '',
  });

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await tripApi.create({
        ...form,
        maxWeightKg: parseFloat(form.maxWeightKg),
        pricePerKg: parseFloat(form.pricePerKg),
        departureAt: new Date(form.departureAt).toISOString(),
      });
      router.push('/trips');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create trip.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Post a New Trip</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
        {/* Route */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">From</label>
            <CityAutocomplete
              value={form.originCity}
              onChange={(v) => set('originCity', v)}
              placeholder="Departure city (e.g. Paris)"
              required
            />
          </div>
          <div className="border-t border-dashed border-gray-200" />
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">To</label>
            <CityAutocomplete
              value={form.destinationCity}
              onChange={(v) => set('destinationCity', v)}
              placeholder="Destination city (e.g. Algiers)"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Departure date & time</label>
          <input required type="datetime-local" value={form.departureAt} onChange={(e) => set('departureAt', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max weight (kg)</label>
            <input required type="number" min="0.5" step="0.5" value={form.maxWeightKg} onChange={(e) => set('maxWeightKg', e.target.value)}
              placeholder="10" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price per kg (€)</label>
            <input required type="number" min="0.5" step="0.5" value={form.pricePerKg} onChange={(e) => set('pricePerKg', e.target.value)}
              placeholder="3" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
          <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)}
            placeholder="No liquids, fragile items ok…" rows={3}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
        </div>

        {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white py-3 rounded-xl font-semibold hover:bg-brand-700 transition-colors disabled:opacity-60">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Post Trip ✈️'}
        </button>
      </form>
    </div>
  );
}
