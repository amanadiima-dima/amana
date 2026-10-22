'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { userApi } from '@/lib/api';
import { ArrowRight, Clock, ShieldAlert, ShieldX } from 'lucide-react';

type Status = 'loading' | 'verified' | 'none' | 'PENDING' | 'REJECTED';

// Publishing a trip or a parcel needs a verified identity (enforced by the API). Shown on top of those
// forms so the user knows before filling them in, with a direct link to the verification step.
export default function VerificationNotice({ kind, onVerifiedChange }: { kind: 'trip' | 'parcel'; onVerifiedChange?: (verified: boolean) => void }) {
  const t = useTranslations('verificationNotice');
  const [status, setStatus] = useState<Status>('loading');
  const [note, setNote] = useState('');

  useEffect(() => {
    userApi.getMe().then(({ data }) => {
      const u = data.user;
      const s: Status = u.isVerified ? 'verified' : (u.idVerification?.status === 'PENDING' || u.idVerification?.status === 'REJECTED') ? u.idVerification.status : 'none';
      setStatus(s);
      setNote(u.idVerification?.reviewNote || '');
      onVerifiedChange?.(s === 'verified');
    }).catch(() => setStatus('verified')); // the API still enforces it; don't block the form on a network error
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (status === 'loading' || status === 'verified') return null;

  if (status === 'PENDING') {
    return (
      <div className="flex items-start gap-4 bg-blue-50 border-2 border-blue-200 rounded-2xl p-5 mb-6">
        <Clock className="w-8 h-8 text-blue-600 shrink-0" />
        <div>
          <p className="font-bold text-blue-900">{t('pendingTitle')}</p>
          <p className="text-sm text-blue-800 mt-1">{t(kind === 'trip' ? 'pendingTrip' : 'pendingParcel')}</p>
        </div>
      </div>
    );
  }

  const rejected = status === 'REJECTED';
  const Icon = rejected ? ShieldX : ShieldAlert;
  return (
    <div className={`rounded-2xl border-2 p-5 mb-6 ${rejected ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-300'}`}>
      <div className="flex items-start gap-4">
        <Icon className={`w-8 h-8 shrink-0 ${rejected ? 'text-red-600' : 'text-amber-600'}`} />
        <div className="flex-1">
          <p className={`font-bold text-lg ${rejected ? 'text-red-900' : 'text-amber-900'}`}>
            {rejected ? t('rejectedTitle') : t(kind === 'trip' ? 'titleTrip' : 'titleParcel')}
          </p>
          <p className={`text-sm mt-1 ${rejected ? 'text-red-800' : 'text-amber-900'}`}>
            {rejected ? (note ? t('rejectedReason', { note }) : t('rejectedText')) : t('text')}
          </p>
          <Link
            href="/profile#verification"
            className={`inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-colors ${rejected ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-amber-500 text-white hover:bg-amber-600'}`}
          >
            {rejected ? t('retry') : t('cta')} <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </Link>
        </div>
      </div>
    </div>
  );
}
