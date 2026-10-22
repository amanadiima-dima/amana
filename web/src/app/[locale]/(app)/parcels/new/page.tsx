'use client';
import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, Link } from '@/i18n/navigation';
import { parcelApi } from '@/lib/api';
import { Loader2, AlertTriangle, Upload, X, ShieldAlert } from 'lucide-react';
import Image from 'next/image';
import AddressAutocomplete from '@/components/ui/AddressAutocomplete';
import { CURRENCIES, currencyForPhone } from '@/lib/money';
import { useAuthStore } from '@/store/authStore';

export default function NewParcelPage() {
  const t = useTranslations('newParcel');
  const router = useRouter();
  const { user } = useAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previews, setPreviews] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [fragile, setFragile] = useState(false);
  const [valueCurrency, setValueCurrency] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [form, setForm] = useState({
    pickupAddress: '',
    deliveryAddress: '',
    weightKg: '',
    description: '',
    estimatedValue: '',
  });

  const set = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []).slice(0, 3);
    setFiles(selected);
    setPreviews(selected.map((f) => URL.createObjectURL(f)));
  };

  const removeFile = (i: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) { setError(t('agreementRequired')); return; }
    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      fd.append('fragile', String(fragile));
      fd.append('valueCurrency', valueCurrency || currencyForPhone(user?.phone));
      files.forEach((f) => fd.append('photos', f));
      await parcelApi.create(fd);
      router.push('/parcels');
    } catch (err: any) {
      setError(err?.response?.data?.message || t('errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  const disclaimerItems = t.raw('disclaimerItems') as string[];

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('title')}</h1>
      <p className="text-sm text-gray-500 mb-6">{t('subtitle')}</p>

      {/* ── Disclaimer ────────────────────────────────────────────────────── */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-amber-800 text-sm mb-1">{t('disclaimerTitle')}</p>
            <ul className="text-xs text-amber-700 space-y-0.5 list-disc ms-4">
              {disclaimerItems.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
            <p className="text-xs text-amber-700 mt-2">
              {t('disclaimerFooter')}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">

        {/* Item description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('whatSending')}</label>
          <textarea required value={form.description} onChange={(e) => set('description', e.target.value)}
            placeholder={t('descriptionPlaceholder')}
            rows={2}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
        </div>

        {/* Photos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('photosLabel')} <span className="text-gray-400 font-normal">{t('photosLimit')}</span>
          </label>
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-brand-400 transition-colors">
            <Upload className="w-5 h-5 text-gray-400 mx-auto mb-1" />
            <p className="text-xs text-gray-500">{t('photosCta')}</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
          {previews.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {previews.map((src, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
                  <Image src={src} alt="item preview" fill className="object-cover" />
                  <button type="button" onClick={() => removeFile(i)}
                    className="absolute top-0.5 end-0.5 bg-white rounded-full p-0.5 shadow">
                    <X className="w-3 h-3 text-gray-600" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Addresses */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('pickupAddress')}</label>
          <AddressAutocomplete
            value={form.pickupAddress}
            onChange={(v) => set('pickupAddress', v)}
            placeholder={t('pickupPlaceholder')}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('deliveryAddress')}</label>
          <AddressAutocomplete
            value={form.deliveryAddress}
            onChange={(v) => set('deliveryAddress', v)}
            placeholder={t('deliveryPlaceholder')}
            required
          />
        </div>

        {/* Weight + value */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('weight')}</label>
            <input required type="number" min="0.1" step="0.1" value={form.weightKg}
              onChange={(e) => set('weightKg', e.target.value)} placeholder="1.5"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('estimatedValue')}</label>
            <div className="flex gap-2">
              <input type="number" min="0" step="1" value={form.estimatedValue}
                onChange={(e) => set('estimatedValue', e.target.value)} placeholder="50"
                className="w-full min-w-0 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              <select value={valueCurrency || currencyForPhone(user?.phone)} onChange={(e) => setValueCurrency(e.target.value)}
                className="border border-gray-200 rounded-xl px-2 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500">
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Fragile toggle */}
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div
            onClick={() => setFragile((v) => !v)}
            className={`w-10 h-6 rounded-full transition-colors flex items-center ${fragile ? 'bg-brand-600' : 'bg-gray-200'}`}>
            <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${fragile ? 'translate-x-4 rtl:-translate-x-4' : ''}`} />
          </div>
          <span className="text-sm font-medium text-gray-700">{t('fragileToggle')}</span>
        </label>

        {/* Disclaimer checkbox */}
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-brand-600 shrink-0" />
          <span className="text-xs text-gray-600">
            {t.rich('agreement', {
              b: (chunks) => <strong>{chunks}</strong>,
              link: (chunks) => <Link href="/terms" target="_blank" className="text-brand-600 underline">{chunks}</Link>,
            })}
          </span>
        </label>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white py-3 rounded-xl font-semibold hover:bg-brand-700 transition-colors disabled:opacity-60">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('submit')}
        </button>
      </form>
    </div>
  );
}
