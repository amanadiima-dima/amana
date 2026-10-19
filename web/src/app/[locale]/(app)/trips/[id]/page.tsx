'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import InviteLinkBox from '@/components/ui/InviteLinkBox';
import { useMoney } from '@/lib/money';
import { Link, useRouter } from '@/i18n/navigation';
import { tripApi, parcelApi, bookingApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { ArrowLeft, Star, Shield, Loader2, Package, CheckCircle, XCircle, Clock, Users, MapPin } from 'lucide-react';
import { modeMeta, formatDuration } from '@/lib/trip';

// ── Booking management panel (traveler's own trip) ────────────────────────────
function BookingStatusBadge({ status }: { status: string }) {
  const tCommon = useTranslations('common');
  const map: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    ACCEPTED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-gray-100 text-gray-500',
    COMPLETED: 'bg-blue-100 text-blue-700',
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${map[status] ?? 'bg-gray-100 text-gray-500'}`}>
      {tCommon(`status.${status}`)}
    </span>
  );
}

function TripBookingsPanel({ tripId, currency }: { tripId: string; currency: string }) {
  const t = useTranslations('tripDetail');
  const money = useMoney();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);

  const load = () =>
    tripApi.getBookings(tripId)
      .then(({ data }) => setBookings(data.bookings || []))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, [tripId]);

  const respond = async (bookingId: string, action: 'accept' | 'reject') => {
    setResponding(bookingId);
    try {
      await bookingApi.respond(bookingId, action);
      await load();
    } finally {
      setResponding(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
    </div>
  );

  const pending = bookings.filter((b) => b.status === 'PENDING');
  const others = bookings.filter((b) => b.status !== 'PENDING');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Users className="w-5 h-5 text-brand-600" />
        <h2 className="font-bold text-gray-900 text-lg">{t('bookingRequests')}</h2>
        {pending.length > 0 && (
          <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
            {pending.length} {t('pending')}
          </span>
        )}
      </div>

      {bookings.length === 0 && (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-gray-600">{t('noRequestsTitle')}</p>
          <p className="text-sm text-gray-400 mt-1">{t('noRequestsSubtitle')}</p>
        </div>
      )}

      {/* Pending bookings */}
      {pending.map((b) => (
        <div key={b.id} className="bg-white rounded-2xl border border-amber-200 shadow-sm p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-600 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                {b.parcelRequest?.sender?.name?.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{b.parcelRequest?.sender?.name}</p>
              </div>
            </div>
            <BookingStatusBadge status={b.status} />
          </div>
          {b.payment?.status === 'HELD' && (
            <p className="text-xs font-semibold text-green-700 bg-green-50 rounded-lg px-3 py-1.5 mb-3">{t('paymentSecured')}</p>
          )}

          <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-1">
            <p className="text-sm font-medium text-gray-900">📦 {b.parcelRequest?.description}</p>
            <p className="text-xs text-gray-500">
              ⚖️ {b.parcelRequest?.weightKg} kg
              {b.parcelRequest?.fragile && ` · 🔴 ${t('fragile')}`}
              {b.parcelRequest?.estimatedValue && ` · ${t('value')}: ${money(b.parcelRequest.estimatedValue, b.parcelRequest.valueCurrency)}`}
            </p>
            <p className="text-xs text-gray-500">📍 {b.parcelRequest?.deliveryAddress}</p>
            {b.priorityTip > 0 && (
              <p className="text-xs font-semibold text-amber-700">💎 {t('priorityTip')}: +{money(b.priorityTip, currency)}</p>
            )}
            {b.payment?.grossAmount && (
              <p className="text-xs text-gray-500">💶 {t('payment')}: {money(b.payment.grossAmount, b.payment.currency || currency, true)} ({b.payment.status})</p>
            )}
          </div>

          <Link href={`/bookings/${b.id}`} className="block text-center text-sm font-semibold text-brand-600 hover:bg-brand-50 border border-brand-100 rounded-xl py-2 mb-3 transition-colors">
            {t('openChat')}
          </Link>

          <div className="flex gap-2">
            <button
              disabled={responding === b.id}
              onClick={() => respond(b.id, 'accept')}
              className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {responding === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> {t('accept')}</>}
            </button>
            <button
              disabled={responding === b.id}
              onClick={() => respond(b.id, 'reject')}
              className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {responding === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><XCircle className="w-4 h-4" /> {t('reject')}</>}
            </button>
          </div>
        </div>
      ))}

      {/* Non-pending bookings */}
      {others.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('previousRequests')}</p>
          {others.map((b) => (
            <Link key={b.id} href={`/bookings/${b.id}`} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
              <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold text-sm shrink-0">
                {b.parcelRequest?.sender?.name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">{b.parcelRequest?.sender?.name}</p>
                <p className="text-xs text-gray-500 truncate">📦 {b.parcelRequest?.description} · ⚖️ {b.parcelRequest?.weightKg}kg</p>
              </div>
              <BookingStatusBadge status={b.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main trip detail page ─────────────────────────────────────────────────────
export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations('tripDetail');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const money = useMoney();
  const router = useRouter();
  const { user } = useAuthStore();
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancellingTrip, setCancellingTrip] = useState(false);

  const [trip, setTrip] = useState<any>(null);
  const [myParcels, setMyParcels] = useState<any[]>([]);
  const [selectedParcel, setSelectedParcel] = useState('');
  const [tip, setTip] = useState('');
  const [payerMode, setPayerMode] = useState<'me' | 'recipient'>('me');
  const [payerPhone, setPayerPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [inviteInfo, setInviteInfo] = useState<{ token: string; phone: string; stubbed: boolean } | null>(null);

  useEffect(() => {
    Promise.all([
      tripApi.getById(id),
      parcelApi.getMyParcels(),
    ]).then(([tripRes, parcelRes]) => {
      setTrip(tripRes.data.trip);
      const unbookedParcels = (parcelRes.data.parcels || []).filter((p: any) => !p.booking);
      setMyParcels(unbookedParcels);
    }).catch(() => router.push('/parcels/search'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleBook = async () => {
    if (!selectedParcel) return setError(t('selectParcelError'));
    if (payerMode === 'recipient' && !/^\+[1-9]\d{7,14}$/.test(payerPhone.trim())) return setError(t('recipientPhoneRequired'));
    setBooking(true); setError('');
    try {
      const { data } = await bookingApi.create(id, selectedParcel, parseFloat(tip) || 0, payerMode === 'recipient' ? payerPhone.trim() : undefined, locale);
      if (data.booking?.inviteToken) setInviteInfo({ token: data.booking.inviteToken, phone: payerPhone.trim(), stubbed: !!data.invite?.stubbed });
      setDone(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || t('bookingErrorGeneric'));
    } finally {
      setBooking(false);
    }
  };

  const handleCancelTrip = async () => {
    setCancellingTrip(true); setError('');
    try {
      await tripApi.cancel(id);
      router.push('/trips');
    } catch (err: any) {
      setError(err?.response?.data?.message || t('cancelTripError'));
      setConfirmingCancel(false);
    } finally {
      setCancellingTrip(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
    </div>
  );

  if (!trip) return null;

  const isOwnTrip = trip.traveler?.id === user?.id;

  return (
    <div className="max-w-xl">
      <Link
        href={isOwnTrip ? '/trips' : '/parcels/search'}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-brand-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {isOwnTrip ? t('backToMyTrips') : t('backToSearch')}
      </Link>

      {/* Trip card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{trip.originCity} → {trip.destinationCity}</h1>
            <p className="text-gray-500 mt-1">
              🗓 {new Date(trip.departureAt).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {(() => { const m = modeMeta(trip.mode); const Icon = m.icon; return (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full">
                  <Icon className="w-3.5 h-3.5" /> {tCommon(`modes.${m.value}`)}
                </span>
              ); })()}
              {formatDuration(trip.estimatedDurationMinutes) && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                  <Clock className="w-3.5 h-3.5" /> ≈ {formatDuration(trip.estimatedDurationMinutes)}
                </span>
              )}
            </div>
          </div>
          <span className="text-xs bg-green-100 text-green-700 font-semibold px-2.5 py-1 rounded-full">{tCommon(`status.${trip.status}`)}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-0.5">{t('availableCapacity')}</p>
            <p className="font-bold text-gray-900 text-lg">{trip.availableWeightKg ?? trip.maxWeightKg} kg</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-0.5">{t('pricePerKg')}</p>
            <p className="font-bold text-gray-900 text-lg">{money(trip.pricePerKg, trip.currency)}</p>
          </div>
        </div>

        {(trip.originAddress || (trip.originLat != null && trip.originLng != null)) && (
          <div className="text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 mb-3">
            <p className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
              <span>
                <span className="font-medium text-gray-700">{t('pickup')}</span>
                {trip.originAddress || `${trip.originLat.toFixed(5)}, ${trip.originLng.toFixed(5)}`}
                {trip.originLat != null && trip.originLng != null && (
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${trip.originLat}&mlon=${trip.originLng}#map=16/${trip.originLat}/${trip.originLng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-600 hover:underline ms-1 whitespace-nowrap"
                  >
                    {t('viewOnMap')}
                  </a>
                )}
              </span>
            </p>
          </div>
        )}

        {trip.notes && (
          <p className="text-sm text-gray-500 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
            📝 {trip.notes}
          </p>
        )}
      </div>

      {/* Traveler (only show when viewing someone else's trip) */}
      {trip.traveler && !isOwnTrip && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-4 flex items-center gap-4">
          <Link href={`/traveler/${trip.traveler.id}`}>
            <div className="w-12 h-12 bg-brand-600 rounded-full flex items-center justify-center text-white font-bold text-lg cursor-pointer hover:opacity-80 transition-opacity">
              {trip.traveler.name?.charAt(0)}
            </div>
          </Link>
          <div className="flex-1">
            <Link href={`/traveler/${trip.traveler.id}`} className="font-bold text-gray-900 hover:text-brand-600 transition-colors">
              {trip.traveler.name}
            </Link>
            <div className="flex items-center gap-3 mt-0.5">
              {(trip.traveler.rating ?? 0) > 0 && (
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {Number(trip.traveler.rating).toFixed(1)}
                  {trip.traveler.reviewCount > 0 && <span className="text-gray-400">· {trip.traveler.reviewCount} {t('reviewsSuffix')}</span>}
                </span>
              )}
              {trip.traveler.isVerified && (
                <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                  <Shield className="w-3 h-3" /> {t('verified')}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Own trip: booking management */}
      {isOwnTrip ? (
        <>
          <TripBookingsPanel tripId={id} currency={trip.currency} />
          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg mt-4">{error}</p>}
          {['OPEN', 'FULL'].includes(trip.status) && !confirmingCancel && (
            <button onClick={() => setConfirmingCancel(true)} className="w-full text-center text-sm text-red-500 hover:text-red-600 font-medium py-3 mt-4 transition-colors">
              {t('cancelTrip')}
            </button>
          )}
          {confirmingCancel && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mt-4 text-center">
              <p className="text-sm font-semibold text-red-700 mb-1">{t('cancelTripTitle')}</p>
              <p className="text-xs text-red-500 mb-4">{t('cancelTripText')}</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmingCancel(false)} className="flex-1 bg-white border border-gray-200 text-gray-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors">{t('keepTrip')}</button>
                <button onClick={handleCancelTrip} disabled={cancellingTrip} className="flex-1 bg-red-500 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-red-600 transition-colors disabled:opacity-60">
                  {cancellingTrip ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t('yesCancelTrip')}
                </button>
              </div>
            </div>
          )}
        </>
      ) : done ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
          <p className="text-3xl mb-2">🎉</p>
          <p className="font-bold text-green-700 text-lg">{t('bookingSentTitle')}</p>
          {inviteInfo ? (
            <>
              <p className="text-sm font-semibold text-green-700 mt-1">{t('inviteSentTitle')}</p>
              <p className="text-sm text-green-600 mt-1">{t('inviteSentText', { phone: inviteInfo.phone })}</p>
              {inviteInfo.stubbed && <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mt-2">{t('inviteTestMode')}</p>}
              <InviteLinkBox token={inviteInfo.token} label={t('inviteLinkLabel')} copyLabel={t('copyLink')} copiedLabel={t('copied')} locale={locale} />
              <div className="mb-4" />
            </>
          ) : (
            <p className="text-sm text-green-600 mt-1 mb-4">{t('bookingSentSubtitle')}</p>
          )}
          <Link href="/bookings" className="inline-flex items-center gap-2 bg-brand-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-brand-700 transition-colors">
            {t('viewMyBookings')}
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">{t('sendParcelHeading')}</h2>

          {myParcels.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium text-gray-600 mb-3">{t('noParcelsTitle')}</p>
              <p className="text-xs text-gray-400 mb-4">{t('noParcelsSubtitle')}</p>
              <Link href="/parcels/new" className="inline-flex items-center gap-2 bg-brand-600 text-white px-5 py-2 rounded-xl font-semibold text-sm hover:bg-brand-700 transition-colors">
                {t('createParcel')}
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                {myParcels.map((p: any) => (
                  <label key={p.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selectedParcel === p.id ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" name="parcel" value={p.id} checked={selectedParcel === p.id}
                      onChange={() => setSelectedParcel(p.id)} className="accent-brand-600" />
                    <div>
                      <p className="font-medium text-sm text-gray-900">{p.description}</p>
                      <p className="text-xs text-gray-500">⚖️ {p.weightKg}kg · 📍 {p.deliveryAddress}</p>
                    </div>
                  </label>
                ))}
              </div>

              {selectedParcel && (() => {
                const p = myParcels.find((x: any) => x.id === selectedParcel);
                const cost = p ? money(p.weightKg * trip.pricePerKg + (parseFloat(tip) || 0), trip.currency, true) : null;
                return cost ? (
                  <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm text-gray-600">
                    💶 {t('estimatedCost')} <span className="font-bold text-gray-900">{cost}</span>
                    <span className="text-gray-400"> {t('feeIncluded')}</span>
                  </div>
                ) : null;
              })()}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">💎 {t('priorityTipLabel')} <span className="text-gray-400 font-normal">({trip.currency})</span></label>
                <input type="number" min="0" step="1" value={tip} onChange={(e) => setTip(e.target.value)} placeholder="0"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                <p className="text-[11px] text-gray-400 mt-1">{t('priorityTipHelp')}</p>
              </div>

              <div className="mb-4">
                <p className="block text-sm font-medium text-gray-700 mb-1.5">{t('whoPays')}</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['me', 'recipient'] as const).map((m) => (
                    <button type="button" key={m} onClick={() => setPayerMode(m)} aria-pressed={payerMode === m}
                      className={`py-2.5 rounded-xl border text-sm font-medium transition-colors ${payerMode === m ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                      {m === 'me' ? t('payMyself') : t('recipientPays')}
                    </button>
                  ))}
                </div>
                {payerMode === 'recipient' && (
                  <div className="mt-3">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">{t('recipientPhoneLabel')}</label>
                    <input type="tel" dir="ltr" value={payerPhone} onChange={(e) => setPayerPhone(e.target.value)} placeholder="+33612345678"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                    <p className="text-[11px] text-gray-400 mt-1">{t('recipientPhoneHelp')}</p>
                  </div>
                )}
              </div>

              {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg mb-3">{error}</p>}

              <button onClick={handleBook} disabled={booking || !selectedParcel}
                className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white py-3 rounded-xl font-semibold hover:bg-brand-700 transition-colors disabled:opacity-60">
                {booking ? <Loader2 className="w-5 h-5 animate-spin" /> : t('requestBooking')}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
