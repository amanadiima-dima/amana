'use client';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRouter, Link } from '@/i18n/navigation';
import { Package, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

type Step = 'phone' | 'otp' | 'name';

function AuthForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const { sendOtp, verifyOtp, completeRegistration } = useAuthStore();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [registrationToken, setRegistrationToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!phone.trim()) return setError(t('errors.phoneRequired'));
    // basic E.164 check
    if (!/^\+[1-9]\d{7,14}$/.test(phone.trim())) {
      return setError(t('errors.phoneFormat'));
    }
    setLoading(true);
    try {
      await sendOtp(phone.trim());
      setStep('otp');
    } catch (err: any) {
      setError(err?.response?.data?.message || t('errors.sendFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (code.length < 4) return setError(t('errors.codeLength'));
    setLoading(true);
    try {
      const res = await verifyOtp(phone.trim(), code.trim());
      if (res.registrationToken) {
        // New phone number: the code is verified, we only need a name to create the account.
        setRegistrationToken(res.registrationToken);
        setStep('name');
      } else {
        router.push(redirect);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || '';
      if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('expired')) {
        setError(t('errors.invalidCode'));
      } else {
        setError(msg || t('errors.verifyFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (name.trim().length < 2) return setError(t('errors.nameRequired'));
    if (!acceptTerms) return setError(t('errors.termsRequired'));
    setLoading(true);
    try {
      await completeRegistration(registrationToken, name.trim());
      router.push(redirect);
    } catch (err: any) {
      setError(err?.response?.data?.message || t('errors.verifyFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-blue-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <a href="/" className="flex items-center gap-2 text-brand-600 font-bold text-2xl">
            <Package className="w-8 h-8" />
            Amana
          </a>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          {step === 'phone' && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('welcomeTitle')}</h1>
              <p className="text-gray-500 mb-8">{t('welcomeSubtitle')}</p>

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('phoneLabel')}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t('phonePlaceholder')}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    autoFocus
                  />
                  <p className="text-xs text-gray-400 mt-1">{t('phoneHint')}</p>
                </div>

                {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white py-3 rounded-xl font-semibold text-base hover:bg-brand-700 transition-all disabled:opacity-60"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{t('sendCode')} <ArrowRight className="w-4 h-4 rtl:rotate-180" /></>}
                </button>
              </form>

              <p className="text-center text-sm text-gray-400 mt-6">
                {t.rich('termsNotice', {
                  terms: (chunks) => <Link href="/terms" target="_blank" className="text-brand-600 hover:underline">{chunks}</Link>,
                  privacy: (chunks) => <Link href="/privacy" target="_blank" className="text-brand-600 hover:underline">{chunks}</Link>,
                })}
              </p>
            </>
          )}

          {step === 'otp' && (
            <>
              <button
                onClick={() => { setStep('phone'); setCode(''); setError(''); }}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600 mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t('back')}
              </button>

              <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('enterCodeTitle')}</h1>
              <p className="text-gray-500 mb-8">
                {t('codeSentTo', { phone: '' })}
                <span className="font-semibold text-gray-700">{phone}</span>
              </p>

              {process.env.NODE_ENV === 'development' && (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-xl mb-4">
                  {t('devModeNotice')}
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('codeLabel')}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base text-center tracking-[0.4em] font-mono text-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    autoFocus
                  />
                </div>

                {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white py-3 rounded-xl font-semibold text-base hover:bg-brand-700 transition-all disabled:opacity-60"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{t('verifyContinue')} <ArrowRight className="w-4 h-4 rtl:rotate-180" /></>}
                </button>
              </form>

              <p className="text-center text-sm text-gray-400 mt-6">
                {t('didntReceive')}{' '}
                <button
                  onClick={handleSendOtp as any}
                  className="text-brand-600 hover:underline font-medium"
                >
                  {t('resend')}
                </button>
              </p>
            </>
          )}

          {step === 'name' && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('nameStepTitle')}</h1>
              <p className="text-gray-500 mb-8">{t('nameStepSubtitle')}</p>

              <form onSubmit={handleFinish} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('yourName')}</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('namePlaceholder')}
                    maxLength={60}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    autoFocus
                  />
                </div>

                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className="mt-0.5 w-4 h-4 accent-brand-600 shrink-0" />
                  <span className="text-sm text-gray-600">
                    {t.rich('acceptTerms', {
                      terms: (chunks) => <Link href="/terms" target="_blank" className="text-brand-600 hover:underline">{chunks}</Link>,
                      privacy: (chunks) => <Link href="/privacy" target="_blank" className="text-brand-600 hover:underline">{chunks}</Link>,
                    })}
                  </span>
                </label>

                {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white py-3 rounded-xl font-semibold text-base hover:bg-brand-700 transition-all disabled:opacity-60"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{t('createAccount')} <ArrowRight className="w-4 h-4 rtl:rotate-180" /></>}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}
