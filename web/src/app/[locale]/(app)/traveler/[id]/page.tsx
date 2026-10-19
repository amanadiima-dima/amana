'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { reviewApi } from '@/lib/api';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export default function TravelerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations('travelerProfile');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (id) reviewApi.getPublicProfile(id).then(({ data }) => setProfile(data.user));
  }, [id]);

  if (!profile) return <div className="flex items-center justify-center py-32"><div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" /></div>;

  const initial = profile.name?.[0]?.toUpperCase();
  const memberSince = new Date(profile.createdAt).toLocaleDateString(locale, { month: 'long', year: 'numeric' });

  return (
    <div className="max-w-2xl">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {tCommon('back')}
      </button>

      {/* Profile header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6">
        <div className="flex items-start gap-5">
          {profile.photoUrl ? (
            <img src={profile.photoUrl} alt={profile.name} className="w-20 h-20 rounded-2xl object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-brand-600 flex items-center justify-center text-white text-3xl font-bold shrink-0">
              {initial}
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
              {profile.isVerified && (
                <span className="flex items-center gap-1 text-green-600 text-sm font-semibold">
                  <CheckCircle className="w-4 h-4" /> {t('verified')}
                </span>
              )}
            </div>

            {/* Star rating */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex text-amber-400 text-lg">
                {[1,2,3,4,5].map((s) => (
                  <span key={s}>{s <= Math.round(profile.rating) ? '★' : '☆'}</span>
                ))}
              </div>
              <span className="text-gray-700 font-semibold">{profile.rating?.toFixed(1)}</span>
              <span className="text-gray-400 text-sm">{t('reviewCountParen', { count: profile.reviewCount ?? 0 })}</span>
            </div>

            <p className="text-sm text-gray-400 mt-1">{t('memberSince', { date: memberSince })}</p>
            {profile.bio && <p className="text-gray-600 text-sm mt-2">{profile.bio}</p>}
          </div>
        </div>
      </div>

      {/* Reviews */}
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        {t('reviews')} <span className="text-gray-400 font-normal text-base">({profile.reviewsReceived?.length ?? 0})</span>
      </h2>

      {profile.reviewsReceived?.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 shadow-sm">
          <p className="text-4xl mb-3">⭐</p>
          <p className="font-semibold text-gray-500">{t('noReviewsTitle')}</p>
          <p className="text-sm mt-1">{t('noReviewsSubtitle')}</p>
        </div>
      )}

      <div className="space-y-4">
        {profile.reviewsReceived?.map((review: any) => (
          <div key={review.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-3">
                {review.reviewer?.photoUrl ? (
                  <img src={review.reviewer.photoUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm">
                    {review.reviewer?.name?.[0]}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-sm text-gray-900">{review.reviewer?.name}</p>
                  {review.booking?.trip && (
                    <p className="text-xs text-gray-400">
                      {review.booking.trip.originCity} → {review.booking.trip.destinationCity} · {new Date(review.booking.trip.departureAt).toLocaleDateString(locale)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 text-amber-400 shrink-0">
                {[1,2,3,4,5].map((s) => (
                  <span key={s} className="text-base">{s <= review.rating ? '★' : '☆'}</span>
                ))}
              </div>
            </div>
            {review.comment && (
              <p className="text-sm text-gray-600 italic border-s-2 border-gray-100 ps-3">"{review.comment}"</p>
            )}
            <p className="text-xs text-gray-400 mt-2">{new Date(review.createdAt).toLocaleDateString(locale)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
