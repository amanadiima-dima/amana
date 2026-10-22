'use client';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Link, getPathname } from '@/i18n/navigation';
import { Package, ArrowRight, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api';

// Sign-in = email or phone + password, then a code texted to the account's phone.
// Sign-up = name, phone, optional email, password, 18+/Terms → code to the phone → account.
// Forgot password = email or phone → code to the account's phone → new password (also how
// accounts created before passwords existed get their first one).
type Mode = 'login' | 'register' | 'forgot';
type Step = 'form' | 'code';

const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent';
const buttonCls = 'w-full flex items-center justify-center gap-2 bg-brand-600 text-white py-3 rounded-xl font-semibold text-base hover:bg-brand-700 transition-all disabled:opacity-60';

function PasswordInput({ value, onChange, placeholder, autoComplete }: { value: string; onChange: (v: string) => void; placeholder?: string; autoComplete: string }) {
  const t = useTranslations('auth');
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        autoComplete={autoComplete} className={`${inputCls} pe-12`} dir="ltr" />
      <button type="button" onClick={() => setShow(!show)} aria-label={show ? t('hidePassword') : t('showPassword')}
        className="absolute inset-y-0 end-0 px-4 text-gray-400 hover:text-gray-600">
        {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
    </div>
  );
}

function AuthForm() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const { startSession } = useAuthStore();

  const [mode, setMode] = useState<Mode>(searchParams.get('mode') === 'register' ? 'register' : 'login');
  const [step, setStep] = useState<Step>('form');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [code, setCode] = useState('');
  const [loginToken, setLoginToken] = useState('');
  const [phoneHint, setPhoneHint] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const switchMode = (m: Mode) => { setMode(m); setStep('form'); setCode(''); setPassword(''); setError(''); };

  // API messages are English: map the ones users can hit to translated text.
  const apiError = (err: any) => {
    const status = err?.response?.status;
    const msg: string = err?.response?.data?.message || '';
    if (status === 401) return t('errors.wrongPassword');
    if (status === 429) return t('errors.tooMany');
    if (status === 409) return msg.toLowerCase().includes('email') ? t('errors.emailTaken') : t('errors.phoneTaken');
    if (/invalid( or expired)? code|expired/i.test(msg)) return t('errors.invalidCode');
    if (status === 403) return msg;
    return t('errors.generic');
  };

  const run = async (fn: () => Promise<void>) => {
    setError('');
    setLoading(true);
    try { await fn(); } catch (err) { setError(apiError(err)); } finally { setLoading(false); }
  };

  const registerDetails = () => ({ name: name.trim(), phone: phone.replace(/[\s().-]/g, ''), email: email.trim() || undefined, password, acceptTerms });

  // ── Step 1 ──
  const submitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      if (!identifier.trim()) return setError(t('errors.identifierRequired'));
      if (!password) return setError(t('errors.passwordRequired'));
      return run(async () => {
        const { data } = await authApi.login(identifier.trim(), password);
        setLoginToken(data.loginToken); setPhoneHint(data.phoneHint); setStep('code');
      });
    }
    if (mode === 'register') {
      const d = registerDetails();
      if (d.name.length < 2) return setError(t('errors.nameRequired'));
      if (!/^\+[1-9]\d{7,14}$/.test(d.phone)) return setError(t('errors.phoneFormat'));
      if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return setError(t('errors.emailFormat'));
      if (password.length < 8) return setError(t('errors.passwordLength'));
      if (!acceptTerms) return setError(t('errors.termsRequired'));
      return run(async () => { await authApi.register(d); setPhoneHint(d.phone); setStep('code'); });
    }
    if (!identifier.trim()) return setError(t('errors.identifierRequired'));
    return run(async () => { await authApi.forgotPassword(identifier.trim()); setPassword(''); setStep('code'); });
  };

  // ── Step 2: the SMS code ──
  const submitCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return setError(t('errors.codeLength'));
    if (mode === 'forgot' && password.length < 8) return setError(t('errors.passwordLength'));
    return run(async () => {
      const { data } = mode === 'login'
        ? await authApi.loginVerify(loginToken, code)
        : mode === 'register'
          ? await authApi.registerVerify({ ...registerDetails(), code })
          : await authApi.resetPassword(identifier.trim(), code, password);
      await startSession(data);
      // Full page load: the client router cached "this page → /auth" from before the session existed.
      window.location.assign(getPathname({ href: redirect, locale }));
    });
  };

  const resend = () => run(async () => {
    if (mode === 'login') { const { data } = await authApi.login(identifier.trim(), password); setLoginToken(data.loginToken); }
    else if (mode === 'register') await authApi.register(registerDetails());
    else await authApi.forgotPassword(identifier.trim());
  });

  const termsLinks = {
    terms: (chunks: React.ReactNode) => <Link href="/terms" target="_blank" className="text-brand-600 hover:underline">{chunks}</Link>,
    privacy: (chunks: React.ReactNode) => <Link href="/privacy" target="_blank" className="text-brand-600 hover:underline">{chunks}</Link>,
  };
  const errorBox = error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-blue-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2 text-brand-600 font-bold text-2xl">
            <Package className="w-8 h-8" /> Amana
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          {step === 'form' && mode !== 'forgot' && (
            <div className="grid grid-cols-2 bg-gray-100 rounded-xl p-1 mb-6 text-sm font-semibold">
              {(['login', 'register'] as const).map((m) => (
                <button key={m} type="button" onClick={() => switchMode(m)}
                  className={`py-2 rounded-lg transition-colors ${mode === m ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  {t(m === 'login' ? 'loginTab' : 'registerTab')}
                </button>
              ))}
            </div>
          )}

          {step === 'form' && mode === 'login' && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('loginTitle')}</h1>
              <p className="text-gray-500 mb-6">{t('loginSubtitle')}</p>
              <form onSubmit={submitForm} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('identifierLabel')}</label>
                  <input type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder={t('identifierPlaceholder')}
                    autoComplete="username" className={inputCls} dir="ltr" autoFocus />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">{t('passwordLabel')}</label>
                    <button type="button" onClick={() => switchMode('forgot')} className="text-sm text-brand-600 hover:underline">{t('forgotLink')}</button>
                  </div>
                  <PasswordInput value={password} onChange={setPassword} autoComplete="current-password" />
                </div>
                {errorBox}
                <button type="submit" disabled={loading} className={buttonCls}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{t('loginButton')} <ArrowRight className="w-4 h-4 rtl:rotate-180" /></>}
                </button>
              </form>
              <p className="text-xs text-gray-400 mt-6 text-center">{t('firstTimeHint')}</p>
            </>
          )}

          {step === 'form' && mode === 'register' && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('registerTitle')}</h1>
              <p className="text-gray-500 mb-6">{t('registerSubtitle')}</p>
              <form onSubmit={submitForm} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('yourName')}</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('namePlaceholder')} maxLength={60}
                    autoComplete="name" className={inputCls} autoFocus />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('phoneLabel')}</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('phonePlaceholder')}
                    autoComplete="tel" className={inputCls} dir="ltr" />
                  <p className="text-xs text-gray-400 mt-1">{t('phoneHint')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('emailLabel')}</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('emailPlaceholder')}
                    autoComplete="email" className={inputCls} dir="ltr" />
                  <p className="text-xs text-gray-400 mt-1">{t('emailHint')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('newPasswordLabel')}</label>
                  <PasswordInput value={password} onChange={setPassword} placeholder={t('passwordPlaceholder')} autoComplete="new-password" />
                </div>
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className="mt-0.5 w-4 h-4 accent-brand-600 shrink-0" />
                  <span className="text-sm text-gray-600">{t.rich('acceptTerms', termsLinks)}</span>
                </label>
                {errorBox}
                <button type="submit" disabled={loading} className={buttonCls}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{t('createAccount')} <ArrowRight className="w-4 h-4 rtl:rotate-180" /></>}
                </button>
              </form>
            </>
          )}

          {step === 'form' && mode === 'forgot' && (
            <>
              <button onClick={() => switchMode('login')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t('back')}
              </button>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('forgotTitle')}</h1>
              <p className="text-gray-500 mb-6">{t('forgotSubtitle')}</p>
              <form onSubmit={submitForm} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('identifierLabel')}</label>
                  <input type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder={t('identifierPlaceholder')}
                    autoComplete="username" className={inputCls} dir="ltr" autoFocus />
                </div>
                {errorBox}
                <button type="submit" disabled={loading} className={buttonCls}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{t('sendCode')} <ArrowRight className="w-4 h-4 rtl:rotate-180" /></>}
                </button>
              </form>
            </>
          )}

          {step === 'code' && (
            <>
              <button onClick={() => { setStep('form'); setCode(''); setError(''); }}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t('back')}
              </button>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{t(mode === 'forgot' ? 'resetTitle' : 'enterCodeTitle')}</h1>
              <p className="text-gray-500 mb-6">
                {mode === 'forgot' ? t('codeSentToAccount') : <>{t('codeSentTo')} <span className="font-semibold text-gray-700" dir="ltr">{phoneHint}</span></>}
              </p>
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-xl mb-4">{t('devModeNotice')}</div>
              )}
              <form onSubmit={submitCode} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('codeLabel')}</label>
                  <input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="123456" dir="ltr"
                    className={`${inputCls} text-center tracking-[0.4em] font-mono text-lg`} autoFocus />
                </div>
                {mode === 'forgot' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('newPasswordLabel')}</label>
                    <PasswordInput value={password} onChange={setPassword} placeholder={t('passwordPlaceholder')} autoComplete="new-password" />
                  </div>
                )}
                {errorBox}
                <button type="submit" disabled={loading} className={buttonCls}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{t(mode === 'forgot' ? 'resetButton' : 'verifyContinue')} <ArrowRight className="w-4 h-4 rtl:rotate-180" /></>}
                </button>
              </form>
              <p className="text-center text-sm text-gray-400 mt-6">
                {t('didntReceive')}{' '}
                <button type="button" onClick={resend} disabled={loading} className="text-brand-600 hover:underline font-medium">{t('resend')}</button>
              </p>
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
