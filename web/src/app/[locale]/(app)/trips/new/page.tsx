'use client';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { tripApi } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import CityAutocomplete from '@/components/ui/CityAutocomplete';
import PickupLocationPicker, { type PickupValue } from '@/components/ui/PickupLocationPicker';
import { TRANSPORT_MODES } from '@/lib/trip';
import { CURRENCIES, currencyForCountry, currencyForPhone } from '@/lib/money';
import { useAuthStore } from '@/store/authStore';
import VerificationNotice from '@/components/app/VerificationNotice';

export default function NewTripPage() {
  const t = useTranslations('newTrip');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(true);
  const [form, setForm] = useState({
    originCity: '', destinationCity: '', departureAt: '',
    maxWeightKg: '', pricePerKg: '', notes: '',
    mode: 'PLANE', durationHours: '',
  });
  const [currency, setCurrency] = useState<string>('EUR');
  const [currencyTouched, setCurrencyTouched] = useState(false);
  const [pickup, setPickup] = useState<PickupValue>({ address: '', lat: null, lng: null });

  // Default currency = the sender's/departure country's, unless the traveler picked one.
  useEffect(() => {
    if (!currencyTouched && user?.phone) setCurrency(currencyForPhone(user.phone));
  }, [user?.phone, currencyTouched]);

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const hours = parseFloat(form.durationHours);
      await tripApi.create({
        originCity: form.originCity,
        destinationCity: form.destinationCity,
        notes: form.notes,
        mode: form.mode,
        currency,
        maxWeightKg: parseFloat(form.maxWeightKg),
        pricePerKg: parseFloat(form.pricePerKg),
        departureAt: new Date(form.departureAt).toISOString(),
        ...(Number.isFinite(hours) && hours > 0
          ? { estimatedDurationMinutes: Math.round(hours * 60) }
          : {}),
        ...(pickup.address ? { originAddress: pickup.address } : {}),
        ...(pickup.lat != null && pickup.lng != null
          ? { originLat: pickup.lat, originLng: pickup.lng }
          : {}),
      });
      router.push('/trips');
    } catch (err: any) {
      setError(err?.response?.data?.message || t('errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('title')}</h1>
      <VerificationNotice kind="trip" onVerifiedChange={setVerified} />

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
        {/* Route */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t('from')}</label>
            <CityAutocomplete
              value={form.originCity}
              onChange={(v) => set('originCity', v)}
              onSelectOption={({ country }) => {
                const c = currencyForCountry(country);
                if (c && !currencyTouched) setCurrency(c);
              }}
              placeholder={t('fromPlaceholder')}
              required
            />
          </div>
          <div className="border-t border-dashed border-gray-200" />
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t('to')}</label>
            <CityAutocomplete
              value={form.destinationCity}
              onChange={(v) => set('destinationCity', v)}
              placeholder={t('toPlaceholder')}
              required
            />
          </div>
        </div>

        {/* Transport mode */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('travellingQuestion')}</label>
          <div className="grid grid-cols-5 gap-2">
            {TRANSPORT_MODES.map(({ value, icon: Icon }) => (
              <button
                type="button"
                key={value}
                onClick={() => set('mode', value)}
                aria-pressed={form.mode === value}
                className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition-colors ${
                  form.mode === value
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tCommon(`modes.${value}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Pickup place */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('pickupLabel')}</label>
          <PickupLocationPicker value={pickup} onChange={setPickup} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('departureLabel')}</label>
            <input required type="datetime-local" min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)} value={form.departureAt} onChange={(e) => set('departureAt', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('durationLabel')}</label>
            <input type="number" min="0" step="0.5" value={form.durationHours} onChange={(e) => set('durationHours', e.target.value)}
              placeholder={t('durationPlaceholder')}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('maxWeightLabel')}</label>
            <input required type="number" min="0.5" step="0.5" value={form.maxWeightKg} onChange={(e) => set('maxWeightKg', e.target.value)}
              placeholder="10" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('priceLabel')}</label>
            <div className="flex gap-2">
              <input required type="number" min="0" step="0.5" value={form.pricePerKg} onChange={(e) => set('pricePerKg', e.target.value)}
                placeholder="3" className="w-full min-w-0 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              <select value={currency} onChange={(e) => { setCurrency(e.target.value); setCurrencyTouched(true); }}
                aria-label={t('currencyLabel')}
                className="border border-gray-200 rounded-xl px-2 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500">
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">{t('currencyHint')}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('notesLabel')}</label>
          <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)}
            placeholder={t('notesPlaceholder')} rows={3}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
        </div>

        {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <button type="submit" disabled={loading || !verified}
          className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white py-3 rounded-xl font-semibold hover:bg-brand-700 transition-colors disabled:opacity-60">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('submit')}
        </button>
      </form>
    </div>
  );
}
