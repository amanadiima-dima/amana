'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { bookingApi, trackingApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { ArrowLeft, Loader2, Package, Truck, CheckCircle2, AlertTriangle, Camera } from 'lucide-react';
import { modeMeta } from '@/lib/trip';

const STEPS = [
  { status: 'PICKED_UP', icon: Package },
  { status: 'IN_TRANSIT', icon: Truck },
  { status: 'DELIVERED', icon: CheckCircle2 },
] as const;

const STATUS_META: Record<string, { icon: any; color: string }> = {
  PENDING: { icon: Package, color: 'text-gray-400' },
  ACCEPTED: { icon: Package, color: 'text-blue-500' },
  PICKED_UP: { icon: Package, color: 'text-amber-500' },
  IN_TRANSIT: { icon: Truck, color: 'text-blue-500' },
  DELIVERED: { icon: CheckCircle2, color: 'text-green-500' },
  FAILED: { icon: AlertTriangle, color: 'text-red-500' },
};

export default function TrackingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const t = useTranslations('tracking');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const [booking, setBooking] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    const [b, h] = await Promise.all([bookingApi.getById(id), trackingApi.getHistory(id)]);
    setBooking(b.data.booking);
    setEvents(h.data.events || []);
  };

  useEffect(() => {
    if (!id) return;
    load().finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
    </div>
  );
  if (!booking) return null;

  const isTraveler = booking.trip?.travelerId === user?.id;
  const lastStatus = events[events.length - 1]?.status;
  const nextStepIndex = STEPS.findIndex((s) => s.status === lastStatus) + 1;
  const nextStep = booking.status === 'ACCEPTED' ? STEPS[nextStepIndex] : undefined;

  const submit = async (status: string) => {
    setSubmitting(status);
    setError('');
    try {
      const fd = new FormData();
      fd.append('status', status);
      if (note.trim()) fd.append('note', note.trim());
      if (photo) fd.append('photo', photo);
      if (status === 'DELIVERED') fd.append('code', code.trim());
      await trackingApi.addEvent(id, fd);
      setNote('');
      setPhoto(null);
      setCode('');
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || t('errorGeneric'));
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="max-w-xl">
      <Link href={`/bookings/${id}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t('backToBooking')}
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-gray-100 text-gray-600">{tCommon(`status.${booking.status}`)}</span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4 shadow-sm">
        <p className="font-bold text-gray-900">{modeMeta(booking.trip?.mode).emoji} {booking.trip?.originCity} → {booking.trip?.destinationCity}</p>
        <p className="text-sm text-gray-500 mt-1">📦 {booking.parcelRequest?.description}</p>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4 shadow-sm">
        <h2 className="text-xs font-bold text-gray-400 uppercase mb-4">{t('history')}</h2>
        {events.length === 0 ? (
          <p className="text-sm text-gray-400">{isTraveler ? t('noUpdatesTraveler') : t('noUpdatesOther')}</p>
        ) : (
          <ol className="space-y-4">
            {events.map((e) => {
              const meta = STATUS_META[e.status] || STATUS_META.PENDING;
              const Icon = meta.icon;
              return (
                <li key={e.id} className="flex gap-3">
                  <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${meta.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{tCommon(`status.${e.status}`)}</p>
                    {e.note && <p className="text-sm text-gray-500 mt-0.5">{e.note}</p>}
                    {e.photoUrl && (
                      <img src={e.photoUrl} alt={t('proofAlt')} className="mt-2 rounded-xl border border-gray-100 max-h-40 object-cover" />
                    )}
                    <p className="text-xs text-gray-400 mt-1">{new Date(e.createdAt).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* Traveler controls */}
      {isTraveler && nextStep && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-3">{t('markAs', { status: tCommon(`status.${nextStep.status}`) })}</h2>

          {nextStep.status === 'DELIVERED' && (
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">🔑 {t('deliveryCodeLabel')}</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                dir="ltr"
                placeholder={t('deliveryCodePlaceholder')}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-lg tracking-[0.3em] text-center focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="text-xs text-gray-400 mt-1">{t('deliveryCodeHelp')}</p>
            </div>
          )}

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('notePlaceholder')}
            rows={2}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none mb-3"
          />

          <label className={`flex items-center gap-2 text-sm text-gray-500 border border-dashed rounded-xl px-4 py-3 mb-1 cursor-pointer hover:bg-gray-50 ${nextStep.status === 'DELIVERED' && !photo ? 'border-orange-300 bg-orange-50' : 'border-gray-200'}`}>
            <Camera className="w-4 h-4" />
            {photo ? photo.name : (nextStep.status === 'DELIVERED' ? `📷 ${t('deliveryPhotoLabel')}` : t('attachPhoto'))}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
          </label>
          {nextStep.status === 'DELIVERED' && <p className="text-xs text-gray-400 mb-3">{t('deliveryPhotoHelp')}</p>}
          {nextStep.status !== 'DELIVERED' && <div className="mb-2" />}

          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg mb-3">{error}</p>}

          <button
            onClick={() => submit(nextStep.status)}
            disabled={!!submitting || (nextStep.status === 'DELIVERED' && (code.length !== 6 || !photo))}
            className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white py-3 rounded-xl font-semibold hover:bg-brand-700 transition-colors disabled:opacity-60 mb-2"
          >
            {submitting === nextStep.status ? <Loader2 className="w-5 h-5 animate-spin" /> : t('confirm', { status: tCommon(`status.${nextStep.status}`) })}
          </button>

          <button
            onClick={() => submit('FAILED')}
            disabled={!!submitting}
            className="w-full text-sm text-red-500 hover:text-red-600 py-2 font-medium disabled:opacity-60"
          >
            {submitting === 'FAILED' ? t('reporting') : t('reportIssue')}
          </button>
          <p className="text-[11px] text-gray-400 text-center">{t('reportIssueHelp')}</p>
        </div>
      )}

      {isTraveler && booking.status === 'COMPLETED' && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center text-green-700 font-semibold text-sm">
          {t('deliveredTitle')}
        </div>
      )}

      {!isTraveler && (
        <p className="text-xs text-gray-400 text-center mt-2">
          {t('travelerOnly')} <Link href={`/bookings/${id}`} className="text-brand-600 hover:underline">{t('backToBookingLink')}</Link>
        </p>
      )}
    </div>
  );
}
