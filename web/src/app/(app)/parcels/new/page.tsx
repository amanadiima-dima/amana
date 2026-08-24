'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { parcelApi } from '@/lib/api';
import { Loader2, AlertTriangle, Upload, X, ShieldAlert } from 'lucide-react';
import Image from 'next/image';

export default function NewParcelPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previews, setPreviews] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [fragile, setFragile] = useState(false);
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
    if (!agreed) { setError('Please read and accept the disclaimer before continuing.'); return; }
    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      fd.append('fragile', String(fragile));
      files.forEach((f) => fd.append('photos', f));
      await parcelApi.create(fd);
      router.push('/parcels');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create parcel request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">New Parcel Request</h1>
      <p className="text-sm text-gray-500 mb-6">Describe your item and we'll match you with a trusted traveler.</p>

      {/* ── Disclaimer ────────────────────────────────────────────────────── */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-amber-800 text-sm mb-1">Important — Prohibited Items</p>
            <ul className="text-xs text-amber-700 space-y-0.5 list-disc ml-4">
              <li>No cash, banknotes, coins or financial instruments</li>
              <li>No items worth more than <strong>€500</strong> (jewellery, electronics, luxury goods)</li>
              <li>No prescription drugs, controlled substances or alcohol</li>
              <li>No weapons, flammables or hazardous materials</li>
              <li>No perishable food without traveler&apos;s explicit agreement</li>
            </ul>
            <p className="text-xs text-amber-700 mt-2">
              Amana is not liable for loss or damage of prohibited or undeclared high-value items.
              Declaring a false value may result in account suspension.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">

        {/* Item description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">What are you sending?</label>
          <textarea required value={form.description} onChange={(e) => set('description', e.target.value)}
            placeholder="e.g. Traditional clothing, books, electronic accessories…"
            rows={2}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
        </div>

        {/* Photos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Item photos <span className="text-gray-400 font-normal">(up to 3)</span>
          </label>
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-brand-400 transition-colors">
            <Upload className="w-5 h-5 text-gray-400 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Click to upload photos</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
          {previews.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {previews.map((src, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
                  <Image src={src} alt="item preview" fill className="object-cover" />
                  <button type="button" onClick={() => removeFile(i)}
                    className="absolute top-0.5 right-0.5 bg-white rounded-full p-0.5 shadow">
                    <X className="w-3 h-3 text-gray-600" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Addresses */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pickup address</label>
          <input required value={form.pickupAddress} onChange={(e) => set('pickupAddress', e.target.value)}
            placeholder="Street, city where traveler picks it up"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Delivery address</label>
          <input required value={form.deliveryAddress} onChange={(e) => set('deliveryAddress', e.target.value)}
            placeholder="Street, city where recipient lives"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>

        {/* Weight + value */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
            <input required type="number" min="0.1" step="0.1" value={form.weightKg}
              onChange={(e) => set('weightKg', e.target.value)} placeholder="1.5"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estimated value (€)</label>
            <input type="number" min="0" step="1" value={form.estimatedValue}
              onChange={(e) => set('estimatedValue', e.target.value)} placeholder="50"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>

        {/* Fragile toggle */}
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div
            onClick={() => setFragile((v) => !v)}
            className={`w-10 h-6 rounded-full transition-colors flex items-center ${fragile ? 'bg-brand-600' : 'bg-gray-200'}`}>
            <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${fragile ? 'translate-x-4' : ''}`} />
          </div>
          <span className="text-sm font-medium text-gray-700">🔴 Fragile item — handle with care</span>
        </label>

        {/* Disclaimer checkbox */}
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-brand-600 shrink-0" />
          <span className="text-xs text-gray-600">
            I confirm this item is <strong>not prohibited</strong> and its declared value does not exceed <strong>€500</strong>.
            I have read and accept Amana&apos;s{' '}
            <a href="#" className="text-brand-600 underline">terms of service</a>.
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
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Parcel Request 📦'}
        </button>
      </form>
    </div>
  );
}
