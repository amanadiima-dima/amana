'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { bookingApi, paymentApi, reviewApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { ArrowLeft, Star } from 'lucide-react';

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
  const [booking, setBooking] = useState<any>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const refresh = () => bookingApi.getById(id).then(({ data }) => setBooking(data.booking));
  useEffect(() => { if (id) refresh(); }, [id]);

  if (!booking) return <div className="flex items-center justify-center py-32"><div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" /></div>;

  const isSender = booking.senderId === user?.id;
  const isTraveler = booking.trip?.travelerId === user?.id;
  const canPay = isSender && booking.status === 'ACCEPTED' && !booking.payment;
  const myReview = booking.reviews?.find((r: any) => r.reviewerId === user?.id);
  const canReview = booking.status === 'COMPLETED' && !myReview;
  const otherReview = booking.reviews?.find((r: any) => r.reviewerId !== user?.id);
  const reviewTarget = isSender ? booking.trip?.traveler?.name : 'the sender';

  const handlePay = async () => {
    try {
      const { data } = await paymentApi.createIntent(id);
      router.push(`/payment?clientSecret=${data.clientSecret}&bookingId=${id}&amount=${data.amount}`);
    } catch { setError('Could not initiate payment. Please try again.'); }
  };

  const submitReview = async () => {
    setSubmitting(true); setError('');
    try {
      await reviewApi.create({ bookingId: id, rating, comment });
      setShowReviewForm(false);
      await refresh();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to submit review');
    } finally { setSubmitting(false); }
  };

  const statusColor: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700', ACCEPTED: 'bg-blue-100 text-blue-700',
    REJECTED: 'bg-red-100 text-red-600', CANCELLED: 'bg-gray-100 text-gray-500',
    COMPLETED: 'bg-green-100 text-green-700',
  };

  return (
    <div className="max-w-2xl">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Booking Details</h1>
        <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${statusColor[booking.status] || 'bg-gray-100 text-gray-600'}`}>{booking.status}</span>
      </div>

      {/* Trip info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4 shadow-sm">
        <h2 className="text-xs font-bold text-gray-400 uppercase mb-3">Trip</h2>
        <p className="font-bold text-gray-900 text-lg">✈️ {booking.trip?.originCity} → {booking.trip?.destinationCity}</p>
        <p className="text-sm text-gray-500 mt-1">🗓 {new Date(booking.trip?.departureAt).toLocaleString()}</p>
        <Link href={`/traveler/${booking.trip?.travelerId}`} className="inline-flex items-center gap-2 mt-2 text-sm text-brand-600 hover:underline font-semibold">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          {booking.trip?.traveler?.name} · {booking.trip?.traveler?.rating?.toFixed(1) || 'New'}
          {booking.trip?.traveler?.reviewCount ? ` (${booking.trip.traveler.reviewCount} reviews)` : ''}
        </Link>
      </div>

      {/* Parcel info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4 shadow-sm">
        <h2 className="text-xs font-bold text-gray-400 uppercase mb-3">Parcel</h2>
        <p className="text-gray-900">📦 {booking.parcelRequest?.description}</p>
        <p className="text-sm text-gray-500 mt-1">⚖️ {booking.parcelRequest?.weightKg}kg · 📍 {booking.parcelRequest?.deliveryAddress}</p>
      </div>

      {/* Payment */}
      {booking.payment && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4 shadow-sm">
          <h2 className="text-xs font-bold text-gray-400 uppercase mb-3">Payment</h2>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total charged</span>
            <span className="font-bold text-gray-900">€{booking.payment.grossAmount?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-600">Traveler receives</span>
            <span className="font-semibold text-gray-700">€{booking.payment.travelerAmount?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-600">Status</span>
            <span className="font-semibold">{booking.payment.status}</span>
          </div>
        </div>
      )}

      {/* Tracking */}
      {booking.trackingEvents?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4 shadow-sm">
          <h2 className="text-xs font-bold text-gray-400 uppercase mb-3">Latest Update</h2>
          <p className="text-gray-900 font-semibold">📍 {booking.trackingEvents[0].status}</p>
          {booking.trackingEvents[0].note && <p className="text-sm text-gray-500 mt-1">{booking.trackingEvents[0].note}</p>}
          <Link href={`/tracking/${id}`} className="text-sm text-brand-600 hover:underline mt-2 inline-block">View full history →</Link>
        </div>
      )}

      {/* Reviews section */}
      {booking.status === 'COMPLETED' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4 shadow-sm">
          <h2 className="text-xs font-bold text-gray-400 uppercase mb-3">Reviews</h2>
          <div className="space-y-3">
            {myReview && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Your review</p>
                <ReviewCard review={myReview} />
              </div>
            )}
            {otherReview && (
              <div>
                <p className="text-xs text-gray-400 mb-1">{otherReview.reviewer?.name}'s review of you</p>
                <ReviewCard review={otherReview} />
              </div>
            )}
            {!myReview && !otherReview && <p className="text-sm text-gray-400">No reviews yet.</p>}
          </div>
        </div>
      )}

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {/* Actions */}
      <div className="flex flex-col gap-3">
        {canPay && (
          <button onClick={handlePay} className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-brand-700 transition-colors">
            💳 Pay Now
          </button>
        )}
        {isTraveler && booking.status === 'ACCEPTED' && (
          <Link href={`/tracking/${id}`} className="w-full text-center bg-blue-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors">
            📍 Update Tracking
          </Link>
        )}
        {canReview && !showReviewForm && (
          <button onClick={() => setShowReviewForm(true)} className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-amber-600 transition-colors">
            ⭐ Rate {reviewTarget}
          </button>
        )}
      </div>

      {/* Inline review form */}
      {showReviewForm && (
        <div className="mt-4 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Rate {reviewTarget}</h3>
          <StarPicker value={rating} onChange={setRating} />
          <textarea
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50 h-24 resize-none"
            placeholder="Leave a comment (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={300}
          />
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowReviewForm(false)} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors">Cancel</button>
            <button onClick={submitReview} disabled={submitting} className="flex-1 bg-amber-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-amber-600 transition-colors disabled:opacity-50">
              {submitting ? 'Submitting…' : 'Submit Review'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
