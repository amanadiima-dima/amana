'use client';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useMoney } from '@/lib/money';
import { Link } from '@/i18n/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { bookingApi, paymentApi } from '@/lib/api';
import { ArrowLeft, Loader2, ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';
import { modeMeta } from '@/lib/trip';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey && !publishableKey.includes('placeholder') ? loadStripe(publishableKey) : null;

interface PaymentInfo {
  grossAmount: number;
  platformFee: number;
  travelerAmount: number;
  status: string;
  clientSecret: string | null;
  stubbed: boolean;
}

// ── Test-mode checkout: no card, just confirms the simulated payment ──────────
function StubCheckout({ bookingId, onDone }: { bookingId: string; onDone: () => void }) {
  const t = useTranslations('payment');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const confirm = async () => {
    setLoading(true);
    setError('');
    try {
      await paymentApi.confirmStub(bookingId);
      onDone();
    } catch (err: any) {
      setError(err?.response?.data?.message || t('payError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold rounded-xl px-4 py-3 mb-4">
        <ShieldCheck className="w-4 h-4 shrink-0" /> {t('testModeNotice')}
      </div>
      {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg mb-3">{error}</p>}
      <button
        onClick={confirm}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white py-3 rounded-xl font-semibold hover:bg-brand-700 transition-colors disabled:opacity-60"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Lock className="w-4 h-4" /> {t('confirmPayment')}</>}
      </button>
    </div>
  );
}

// ── Real Stripe checkout (used once real API keys are configured) ────────────
function StripeCheckout({ clientSecret, amount, onDone }: { clientSecret: string; amount: string; onDone: () => void }) {
  const t = useTranslations('payment');
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pay = async () => {
    if (!stripe || !elements) return;
    const card = elements.getElement(CardElement);
    if (!card) return;
    setLoading(true);
    setError('');
    const { error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card },
    });
    if (stripeError) {
      setError(stripeError.message || t('payError'));
      setLoading(false);
      return;
    }
    onDone();
  };

  return (
    <div>
      <div className="border border-gray-200 rounded-xl px-4 py-3.5 mb-4 focus-within:ring-2 focus-within:ring-brand-500">
        <CardElement options={{ style: { base: { fontSize: '15px' } } }} />
      </div>
      {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg mb-3">{error}</p>}
      <button
        onClick={pay}
        disabled={loading || !stripe}
        className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white py-3 rounded-xl font-semibold hover:bg-brand-700 transition-colors disabled:opacity-60"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Lock className="w-4 h-4" /> {t('payAmount', { amount })}</>}
      </button>
    </div>
  );
}

function PaymentPageInner() {
  const t = useTranslations('payment');
  const money = useMoney();
  const params = useSearchParams();
  const bookingId = params.get('bookingId') || '';

  const [booking, setBooking] = useState<any>(null);
  const [info, setInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    // Fetches an existing payment for this booking. Returns null (not thrown)
    // when none exists yet, so the caller can fall back to creating one.
    const fetchExisting = async () => {
      try {
        const p = await paymentApi.get(bookingId);
        return p.data.payment;
      } catch (err: any) {
        if (err?.response?.status === 404) return null;
        throw err;
      }
    };

    try {
      const b = await bookingApi.getById(bookingId);
      setBooking(b.data.booking);

      let pay = await fetchExisting();

      if (!pay) {
        try {
          const created = await paymentApi.createIntent(bookingId);
          setInfo({
            grossAmount: created.data.amount,
            platformFee: created.data.platformFee,
            travelerAmount: created.data.travelerAmount,
            status: 'PENDING',
            clientSecret: created.data.clientSecret,
            stubbed: created.data.stubbed,
          });
          return;
        } catch (err: any) {
          // Two near-simultaneous loads (e.g. React StrictMode's double-mount
          // in dev) can both see "no payment yet" and both try to create one;
          // the loser hits this 400. Recover by just fetching what the winner
          // created, instead of surfacing a confusing error.
          pay = await fetchExisting();
          if (!pay) throw err;
        }
      }

      setInfo({
        grossAmount: pay.grossAmount,
        platformFee: pay.platformFee,
        travelerAmount: pay.travelerAmount,
        status: pay.status,
        clientSecret: null,
        stubbed: pay.stubbed,
      });
      if (pay.status !== 'PENDING') setDone(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [bookingId, t]);

  useEffect(() => {
    if (bookingId) load();
    else setLoading(false);
  }, [bookingId, load]);

  const cur = booking?.trip?.currency || 'EUR';

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
    </div>
  );

  return (
    <div className="max-w-lg">
      <Link href={bookingId ? `/bookings/${bookingId}` : '/bookings'} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t('backToBooking')}
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('title')}</h1>

      {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl mb-4">{error}</p>}

      {booking && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4 shadow-sm">
          <p className="font-bold text-gray-900">{modeMeta(booking.trip?.mode).emoji} {booking.trip?.originCity} → {booking.trip?.destinationCity}</p>
          <p className="text-sm text-gray-500 mt-1">📦 {booking.parcelRequest?.description} · ⚖️ {booking.parcelRequest?.weightKg}kg</p>
        </div>
      )}

      {info && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4 shadow-sm space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{t('youPay')}</span>
            <span className="font-bold text-gray-900 text-base">{money(info.grossAmount, cur, true)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>{t('platformFeeNote')}</span>
            <span>{money(info.platformFee, cur, true)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-400 pt-2 border-t border-gray-50">
            <span>{t('travelerReceives')}</span>
            <span>{money(info.travelerAmount, cur, true)}</span>
          </div>
        </div>
      )}

      {done ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
          <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
          <p className="font-bold text-green-700 text-lg">{t('completeTitle')}</p>
          <p className="text-sm text-green-600 mt-1 mb-4">{t('completeSubtitle')}</p>
          <Link href={`/bookings/${bookingId}`} className="inline-flex items-center gap-2 bg-brand-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-brand-700 transition-colors">
            {t('backToBookingCta')}
          </Link>
        </div>
      ) : info?.stubbed ? (
        <StubCheckout bookingId={bookingId} onDone={() => setDone(true)} />
      ) : info?.clientSecret && stripePromise ? (
        <Elements stripe={stripePromise}>
          <StripeCheckout clientSecret={info.clientSecret} amount={money(info.grossAmount, cur, true)} onDone={() => setDone(true)} />
        </Elements>
      ) : info ? (
        <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">
          {t('notConfigured')}
        </p>
      ) : null}
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense>
      <PaymentPageInner />
    </Suspense>
  );
}
