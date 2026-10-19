'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useMoney } from '@/lib/money';
import { useRouter, Link } from '@/i18n/navigation';
import { bookingApi, reviewApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { ArrowLeft, Star } from 'lucide-react';
import BookingChat from '@/components/booking/BookingChat';
import InviteLinkBox from '@/components/ui/InviteLinkBox';
import { modeMeta } from '@/lib/trip';

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-2 justify-center my-4">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} onClick={() => onChange(s)} type="button" className="text-3xl hover:scale-110 transition-transform">
          {s <= value ? '⭐' : '☆'}
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: any }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-semibold text-sm text-gray-800">{review.reviewer?.name}</span>
        <span className="text-sm">{'⭐'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
      </div>
      {review.booking?.trip && (
        <p className="text-xs text-gray-400 mb-1">
          {review.booking.trip.originCity} → {review.booking.trip.destinationCity} · {new Date(review.booking.trip.departureAt).toLocaleDateString()}
        </p>
      )}
      {review.comment && <p className="text-sm text-gray-600 italic">"{review.comment}"</p>}
    </div>
  );
}

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const t = useTranslations('bookingDetail');
  const tCommon = useTranslations('common');
  const money = useMoney();
  const locale = useLocale();
  const [booking, setBooking] = useState<any>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSending, setReportSending] = useState(false);

  const refresh = () => bookingApi.getById(id).then(({ data }) => setBooking(data.booking));
  useEffect(() => { if (id) refresh(); }, [id]);

  if (!booking) return <div className="flex items-center justify-center py-32"><div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" /></div>;

  const isSender = booking.senderId === user?.id;
  const isTraveler = booking.trip?.travelerId === user?.id;
  const isPayer = booking.payerId === user?.id;
  const fmtDate = (d?: string) => (d ? new Date(d).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }) : '');
  const canPay = (isSender && !booking.payerId && booking.status === 'ACCEPTED' && !booking.payment)
    || (isPayer && booking.status === 'PAYMENT_PENDING' && (!booking.payment || booking.payment.status === 'PENDING'));
  const myReview = booking.reviews?.find((r: any) => r.reviewerId === user?.id);
  const canReview = booking.status === 'COMPLETED' && !myReview && (isSender || isTraveler);
  const started = (booking.trackingEvents?.length ?? 0) > 0;
  const canCancel = (isSender || isPayer) && ['PAYMENT_PENDING', 'PENDING', 'ACCEPTED'].includes(booking.status) && !started;
  const canReport = booking.status === 'ACCEPTED' && started && (isSender || isTraveler || isPayer);
  const otherReview = booking.reviews?.find((r: any) => r.reviewerId !== user?.id);
  const reviewTarget = isSender ? booking.trip?.traveler?.name : t('theSender');

  const handlePay = () => router.push(`/payment?bookingId=${id}`);

  const handleCancel = async () => {
    setCancelling(true);
    setError('');
    try {
      await bookingApi.cancel(id);
      await refresh();
      setConfirmingCancel(false);
    } catch (e: any) {
      setError(e.response?.data?.message || t('cancelErrorGeneric'));
    } finally {
      setCancelling(false);
    }
  };

  const submitReport = async () => {
    setReportSending(true); setError('');
    try {
      await bookingApi.dispute(id, reportReason);
      setReporting(false); setReportReason('');
      await refresh();
    } catch (e: any) {
      setError(e.response?.data?.message || t('reportErrorGeneric'));
    } finally { setReportSending(false); }
  };

  const submitReview = async () => {
    setSubmitting(true); setError('');
    try {
      await reviewApi.create({ bookingId: id, rating, comment });
      setShowReviewForm(false);
      await refresh();
    } catch (e: any) {
      setError(e.response?.data?.message || t('reviewErrorGeneric'));
    } finally { setSubmitting(false); }
  };

  const statusColor: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700', PAYMENT_PENDING: 'bg-amber-100 text-amber-700', ACCEPTED: 'bg-blue-100 text-blue-700',
    REJECTED: 'bg-red-100 text-red-600', CANCELLED: 'bg-gray-100 text-gray-500',
    COMPLETED: 'bg-green-100 text-green-700', DISPUTED: 'bg-orange-100 text-orange-700',
  };

  return (
    <div className="max-w-2xl">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {tCommon('back')}
      </button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${statusColor[booking.status] || 'bg-gray-100 text-gray-600'}`}>{tCommon(`status.${booking.status}`)}</span>
      </div>

      {booking.status === 'DISPUTED' && (
        <div className="bg-orange-50 border border-orange-200 text-orange-800 text-sm rounded-2xl p-4 mb-4">
          {t('disputeBanner')}
        </div>
      )}

      {isPayer && booking.status === 'PAYMENT_PENDING' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-4">
          <p className="font-bold text-amber-900 mb-1">💳 {t('payerRequestTitle', { name: booking.sender?.name || '' })}</p>
          <p className="text-xs text-amber-800 mb-2">{t('payerRequestHelp')}</p>
          {booking.payDeadline && <p className="text-xs font-semibold text-amber-900">⏳ {t('payerDeadline', { date: fmtDate(booking.payDeadline) })}</p>}
        </div>
      )}
      {isSender && booking.payerId && booking.status === 'PAYMENT_PENDING' && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 text-sm rounded-2xl p-4 mb-4">
          ⏳ {t('waitingPayer', { name: booking.payer?.name || booking.payerPhone || '', date: fmtDate(booking.payDeadline) })}
          {booking.inviteToken && <InviteLinkBox token={booking.inviteToken} label={t('inviteLinkLabel')} copyLabel={t('copyLink')} copiedLabel={t('copied')} locale={locale} />}
        </div>
      )}
      {booking.status === 'PENDING' && booking.payment?.status === 'HELD' && (isSender || isPayer) && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-2xl p-4 mb-4">
          {t('paymentSecuredWaiting', { date: fmtDate(booking.respondDeadline) })}
        </div>
      )}

      {(isSender || isPayer) && booking.status === 'ACCEPTED' && booking.deliveryCode && (
        <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5 mb-4 text-center">
          <h2 className="text-xs font-bold text-brand-700 uppercase mb-2">🔑 {t('deliveryCodeTitle')}</h2>
          <p className="text-3xl font-bold tracking-[0.3em] text-gray-900 mb-2" dir="ltr">{booking.deliveryCode}</p>
          <p className="text-xs text-gray-600">{t('deliveryCodeHelp')}</p>
        </div>
      )}

      {/* Trip info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4 shadow-sm">
        <h2 className="text-xs font-bold text-gray-400 uppercase mb-3">{t('trip')}</h2>
        <p className="font-bold text-gray-900 text-lg">{modeMeta(booking.trip?.mode).emoji} {booking.trip?.originCity} → {booking.trip?.destinationCity}</p>
        <p className="text-sm text-gray-500 mt-1">🗓 {new Date(booking.trip?.departureAt).toLocaleString()}</p>
        <Link href={`/traveler/${booking.trip?.travelerId}`} className="inline-flex items-center gap-2 mt-2 text-sm text-brand-600 hover:underline font-semibold">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          {booking.trip?.traveler?.name} · {booking.trip?.traveler?.rating?.toFixed(1) || t('new')}
          {booking.trip?.traveler?.reviewCount ? ` (${booking.trip.traveler.reviewCount} ${t('reviewsSuffix')})` : ''}
        </Link>
      </div>

      {/* Parcel info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4 shadow-sm">
        <h2 className="text-xs font-bold text-gray-400 uppercase mb-3">{t('parcel')}</h2>
        <p className="text-gray-900">📦 {booking.parcelRequest?.description}</p>
        <p className="text-sm text-gray-500 mt-1">⚖️ {booking.parcelRequest?.weightKg}kg · 📍 {booking.parcelRequest?.deliveryAddress}</p>
        {booking.payer && booking.payerId !== booking.senderId && (
          <p className="text-sm text-gray-500 mt-1">💳 {isPayer ? t('youPayLine') : t('payerLine', { name: booking.payer.name })}</p>
        )}
        {booking.priorityTip > 0 && (
          <p className="text-sm font-semibold text-amber-700 mt-1">💎 {t('priorityTip')}: +{money(booking.priorityTip, booking.trip?.currency)}</p>
        )}
      </div>

      {/* Chat between sender & traveler */}
      {booking.status !== 'REJECTED' && booking.status !== 'CANCELLED' && (
        <div className="mb-4">
          <BookingChat bookingId={id} currentUserId={user?.id} />
        </div>
      )}

      {/* Payment */}
      {booking.payment && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4 shadow-sm">
          <h2 className="text-xs font-bold text-gray-400 uppercase mb-3">{t('payment')}</h2>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{t('totalCharged')}</span>
            <span className="font-bold text-gray-900">{money(booking.payment.grossAmount, booking.payment.currency, true)}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-600">{t('travelerReceives')}</span>
            <span className="font-semibold text-gray-700">{money(booking.payment.travelerAmount, booking.payment.currency, true)}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-600">{t('status')}</span>
            <span className="font-semibold">{tCommon(`status.${booking.payment.status}`)}</span>
          </div>
        </div>
      )}

      {/* Tracking */}
      {booking.trackingEvents?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4 shadow-sm">
          <h2 className="text-xs font-bold text-gray-400 uppercase mb-3">{t('latestUpdate')}</h2>
          <p className="text-gray-900 font-semibold">📍 {tCommon(`status.${booking.trackingEvents[0].status}`)}</p>
          {booking.trackingEvents[0].note && <p className="text-sm text-gray-500 mt-1">{booking.trackingEvents[0].note}</p>}
          <Link href={`/tracking/${id}`} className="text-sm text-brand-600 hover:underline mt-2 inline-block">{t('viewFullHistory')}</Link>
        </div>
      )}

      {/* Reviews section */}
      {booking.status === 'COMPLETED' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4 shadow-sm">
          <h2 className="text-xs font-bold text-gray-400 uppercase mb-3">{t('reviews')}</h2>
          <div className="space-y-3">
            {myReview && (
              <div>
                <p className="text-xs text-gray-400 mb-1">{t('yourReview')}</p>
                <ReviewCard review={myReview} />
              </div>
            )}
            {otherReview && (
              <div>
                <p className="text-xs text-gray-400 mb-1">{t('theirReviewOfYou', { name: otherReview.reviewer?.name })}</p>
                <ReviewCard review={otherReview} />
              </div>
            )}
            {!myReview && !otherReview && <p className="text-sm text-gray-400">{t('noReviewsYet')}</p>}
          </div>
        </div>
      )}

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {/* Actions */}
      <div className="flex flex-col gap-3">
        {canPay && (
          <button onClick={handlePay} className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-brand-700 transition-colors">
            {isPayer ? t('acceptAndPay') : t('payNow')}
          </button>
        )}
        {isTraveler && booking.status === 'ACCEPTED' && (
          <Link href={`/tracking/${id}`} className="w-full text-center bg-blue-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors">
            {t('updateTracking')}
          </Link>
        )}
        {canReview && !showReviewForm && (
          <button onClick={() => setShowReviewForm(true)} className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-amber-600 transition-colors">
            {t('rate', { name: reviewTarget })}
          </button>
        )}
      </div>

      {/* Cancel booking (sender only, before completion) */}
      {canCancel && !confirmingCancel && (
        <button onClick={() => setConfirmingCancel(true)} className="w-full text-center text-sm text-red-500 hover:text-red-600 font-medium py-3 mt-1 transition-colors">
          {isPayer && booking.status === 'PAYMENT_PENDING' ? t('decline') : t('cancelBooking')}
        </button>
      )}
      {confirmingCancel && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mt-3 text-center">
          <p className="text-sm font-semibold text-red-700 mb-1">{t('cancelConfirmTitle')}</p>
          <p className="text-xs text-red-500 mb-4">
            {booking.payment?.status === 'HELD' ? t('cancelConfirmRefund') : t('cancelConfirmPlain')}
          </p>
          <div className="flex gap-3">
            <button onClick={() => setConfirmingCancel(false)} className="flex-1 bg-white border border-gray-200 text-gray-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors">
              {t('keepBooking')}
            </button>
            <button onClick={handleCancel} disabled={cancelling} className="flex-1 bg-red-500 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-red-600 transition-colors disabled:opacity-60">
              {cancelling ? t('cancelling') : t('yesCancel')}
            </button>
          </div>
        </div>
      )}

      {canReport && !reporting && (
        <button onClick={() => setReporting(true)} className="w-full text-center text-sm text-orange-600 hover:text-orange-700 font-medium py-3 mt-1 transition-colors">
          ⚠️ {t('reportProblem')}
        </button>
      )}
      {reporting && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 mt-3">
          <p className="text-sm font-semibold text-orange-800 mb-2">{t('reportTitle')}</p>
          <textarea
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder={t('reportPlaceholder')}
            rows={3}
            maxLength={500}
            className="w-full border border-orange-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white resize-none mb-3"
          />
          <div className="flex gap-3">
            <button onClick={() => setReporting(false)} className="flex-1 bg-white border border-gray-200 text-gray-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors">{t('cancel')}</button>
            <button onClick={submitReport} disabled={reportSending || reportReason.trim().length < 5} className="flex-1 bg-orange-500 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors disabled:opacity-50">
              {reportSending ? t('submitting') : t('reportSubmit')}
            </button>
          </div>
        </div>
      )}

      {/* Inline review form */}
      {showReviewForm && (
        <div className="mt-4 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 text-center mb-2">{t('rateHeading', { name: reviewTarget })}</h3>
          <StarPicker value={rating} onChange={setRating} />
          <textarea
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50 h-24 resize-none"
            placeholder={t('commentPlaceholder')}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={300}
          />
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowReviewForm(false)} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors">{t('cancel')}</button>
            <button onClick={submitReview} disabled={submitting} className="flex-1 bg-amber-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-amber-600 transition-colors disabled:opacity-50">
              {submitting ? t('submitting') : t('submitReview')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
