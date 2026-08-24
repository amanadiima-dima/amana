'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Package, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

type Step = 'phone' | 'otp';

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const { sendOtp, verifyOtp } = useAuthStore();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!phone.trim()) return setError('Please enter your phone number.');
    // basic E.164 check
    if (!/^\+[1-9]\d{7,14}$/.test(phone.trim())) {
      return setError('Use international format, e.g. +213xxxxxxxxx');
    }
    setLoading(true);
    try {
      await sendOtp(phone.trim());
      setStep('otp');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (code.length < 4) return setError('Enter the 6-digit code.');
    if (isNewUser && !name.trim()) return setError('Please enter your name.');
    setLoading(true);
    try {
      await verifyOtp(phone.trim(), code.trim(), isNewUser ? name.trim() : undefined);
      router.push(redirect);
    } catch (err: any) {
      const msg = err?.response?.data?.message || '';
      if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('expired')) {
        setError('Invalid or expired code. Please try again.');
      } else {
        setError(msg || 'Verification failed. Try again.');
      }
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
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome to Amana</h1>
              <p className="text-gray-500 mb-8">Enter your phone number to continue</p>

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+213xxxxxxxxx"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    autoFocus
                  />
                  <p className="text-xs text-gray-400 mt-1">Include country code, e.g. +213 for Algeria</p>
                </div>

                {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white py-3 rounded-xl font-semibold text-base hover:bg-brand-700 transition-all disabled:opacity-60"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Send code <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>

              <p className="text-center text-sm text-gray-400 mt-6">
                By continuing, you agree to our{' '}
                <a href="#" className="text-brand-600 hover:underline">Terms</a> and{' '}
                <a href="#" className="text-brand-600 hover:underline">Privacy Policy</a>
              </p>
            </>
          )}

          {step === 'otp' && (
            <>
              <button
                onClick={() => { setStep('phone'); setCode(''); setError(''); }}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600 mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <h1 className="text-2xl font-bold text-gray-900 mb-1">Enter the code</h1>
              <p className="text-gray-500 mb-8">
                We sent a 6-digit code to <span className="font-semibold text-gray-700">{phone}</span>
              </p>

              {process.env.NODE_ENV === 'development' && (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-xl mb-4">
                  🛠️ <strong>Dev mode:</strong> use code <strong>123456</strong>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Verification code</label>
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

                {/* Ask name for new users */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="newUser"
                    checked={isNewUser}
                    onChange={(e) => setIsNewUser(e.target.checked)}
                    className="w-4 h-4 accent-brand-600"
                  />
                  <label htmlFor="newUser" className="text-sm text-gray-600">I&apos;m a new user</label>
                </div>

                {isNewUser && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ahmed Benali"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                  </div>
                )}

                {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white py-3 rounded-xl font-semibold text-base hover:bg-brand-700 transition-all disabled:opacity-60"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Verify & Continue <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>

              <p className="text-center text-sm text-gray-400 mt-6">
                Didn&apos;t receive the code?{' '}
                <button
                  onClick={handleSendOtp as any}
                  className="text-brand-600 hover:underline font-medium"
                >
                  Resend
                </button>
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
