'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Cookies from 'js-cookie';
import { useTranslations, useLocale } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { inviteApi } from '@/lib/api';
import { formatMoney } from '@/lib/money';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { Package, Loader2, ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const t = useTranslations('invite');
  const locale = useLocale();
  const router = useRouter();
  const [invite, setInvite] = useState<any>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'declined'>('loading');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    setSignedIn(!!Cookies.get('accessToken'));
    inviteApi.preview(token)
      .then(({ data }) => { setInvite(data.invite); setState('ready'); })
      .catch(() => setState('missing'));
  }, [token]);

  const fmtDate = (d?: string) => (d ? new Date(d).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }) : '');

  const pay = async () => {
    if (!signedIn) return router.push(`/auth?redirect=${encodeURIComponent(`/invite/${token}`)}`);
    setBusy(true); setError('');
    try {
      const { data } = await inviteApi.claim(token);
      router.push(`/bookings/${data.bookingId}`);
    } catch (e: any) {
      setError(e?.response?.data?.message || t('errorGeneric'));
      setBusy(false);
    }
  };

  const decline = async () => {
    if (!window.confirm(t('declineConfirm', { name: invite?.senderName || '' }))) return;
    setBusy(true); setError('');
    try { await inviteApi.decline(token); setState('declined'); }
    catch (e: any) { setError(e?.response?.data?.message || t('errorGeneric')); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex flex-col">
      <div className="flex items-center justify-between p-4 max-w-md w-full mx-auto">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-brand-600"><Package className="w-5 h-5" /> Amana</Link>
        <LanguageSwitcher triggerClassName="flex items-center gap-2 text-sm text-gray-500" />
      </div>

      <div className="flex-1 flex items-start justify-center px-4 pb-10">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 w-full max-w-md">
          {state === 'loading' && <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>}

          {state === 'missing' && (
            <div className="text-center py-10">
              <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="font-bold text-gray-900">{t('unavailableTitle')}</p>
              <p className="text-sm text-gray-500 mt-1">{t('unavailableText')}</p>
            </div>
          )}

          {state === 'declined' && (
            <div className="text-center py-10">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-500" />
              <p className="font-bold text-gray-900">{t('declinedTitle')}</p>
              <p className="text-sm text-gray-500 mt-1">{t('declinedText')}</p>
            </div>
          )}

          {state === 'ready' && invite && !invite.open && (
            <div className="text-center py-10">
              <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="font-bold text-gray-900">{t('unavailableTitle')}</p>
              <p className="text-sm text-gray-500 mt-1">{t('unavailableText')}</p>
            </div>
          )}

          {state === 'ready' && invite?.open && (
            <>
              <p className="text-xs font-bold text-brand-600 uppercase tracking-wide mb-1">{t('title')}</p>
              <h1 className="text-xl font-bold text-gray-900 mb-5">{t('headline', { name: invite.senderName })}</h1>

              <div className="bg-gray-50 rounded-2xl p-4 mb-4 space-y-2 text-sm">
                <div className="flex justify-between gap-3"><span className="text-gray-500">{t('route')}</span><span className="font-semibold text-gray-900 text-end">{invite.route}</span></div>
                <div className="flex justify-between gap-3"><span className="text-gray-500">{t('amount')}</span><span className="font-bold text-gray-900 text-lg">{formatMoney(invite.amount, invite.currency, locale, true)}</span></div>
                <p className="text-xs text-gray-400">{t('departs', { date: fmtDate(invite.departureAt) })}</p>
              </div>

              <p className="text-xs font-semibold text-amber-700 bg-amber-50 rounded-xl px-3 py-2 mb-4">⏳ {t('deadline', { date: fmtDate(invite.payDeadline) })}</p>
              <p className="flex gap-2 text-xs text-gray-500 mb-5"><ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />{t('protection')}</p>

              {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg mb-3">{error}</p>}

              <button onClick={pay} disabled={busy}
                className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white py-3 rounded-xl font-semibold hover:bg-brand-700 transition-colors disabled:opacity-60 mb-2">
                {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : (signedIn ? t('reviewAndPay') : t('signInToPay'))}
              </button>
              <button onClick={decline} disabled={busy} className="w-full text-sm text-gray-400 hover:text-red-500 py-2 transition-colors">{t('notForMe')}</button>
              <p className="text-xs text-gray-400 text-center mt-3">
                {t.rich('privacyNotice', { privacy: (chunks) => <Link href="/privacy" className="text-brand-600 hover:underline">{chunks}</Link> })}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
