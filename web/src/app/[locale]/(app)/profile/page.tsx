'use client';
import { useEffect, useRef, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useAuthStore } from '@/store/authStore';
import { userApi } from '@/lib/api';
import { Link, useRouter } from '@/i18n/navigation';
import SelfieVideoRecorder from '@/components/ui/SelfieVideoRecorder';
import { Loader2, Save, ShieldCheck, ShieldAlert, Upload, CheckCircle2, Clock, Download, Trash2, Lock, KeyRound } from 'lucide-react';

function PrivacySection() {
  const t = useTranslations('profile.privacy');
  const router = useRouter();
  const { logout } = useAuthStore();
  const [exporting, setExporting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [understood, setUnderstood] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const download = async () => {
    setExporting(true); setError('');
    try {
      const { data } = await userApi.exportMyData();
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url; a.download = `amana-data-${new Date().toISOString().slice(0, 10)}.json`; a.click();
      URL.revokeObjectURL(url);
    } catch { setError(t('exportFailed')); }
    finally { setExporting(false); }
  };

  const closeAccount = async () => {
    setDeleting(true); setError('');
    try {
      await userApi.deleteMyAccount();
      await logout();
      router.push('/');
    } catch (err: any) {
      setError(err?.response?.data?.message || t('deleteFailed'));
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Lock className="w-5 h-5 text-brand-600" />
          <h2 className="font-semibold text-gray-900">{t('title')}</h2>
        </div>
        <p className="text-sm text-gray-500">
          {t.rich('intro', { privacy: (chunks) => <Link href="/privacy" className="text-brand-600 hover:underline">{chunks}</Link> })}
        </p>
      </div>

      <button onClick={download} disabled={exporting}
        className="flex items-center justify-center gap-2 border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-60">
        {exporting ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('exporting')}</> : <><Download className="w-4 h-4" /> {t('exportButton')}</>}
      </button>

      <div className="border-t border-gray-100 pt-4">
        <p className="text-sm font-semibold text-gray-900 mb-1">{t('deleteTitle')}</p>
        <p className="text-xs text-gray-500 mb-3">{t('deleteIntro')}</p>
        {!confirming ? (
          <button onClick={() => { setConfirming(true); setUnderstood(false); }}
            className="flex items-center gap-2 text-red-600 border border-red-200 px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-red-50 transition-colors">
            <Trash2 className="w-4 h-4" /> {t('deleteButton')}
          </button>
        ) : (
          <div className="bg-red-50 rounded-xl p-4 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input type="checkbox" checked={understood} onChange={(e) => setUnderstood(e.target.checked)} className="mt-0.5 w-4 h-4 accent-red-600 shrink-0" />
              <span className="text-sm text-red-800">{t('deleteUnderstand')}</span>
            </label>
            <div className="flex gap-2">
              <button onClick={closeAccount} disabled={!understood || deleting}
                className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-red-700 transition-colors disabled:opacity-50">
                {deleting ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('deleting')}</> : t('deleteConfirmButton')}
              </button>
              <button onClick={() => setConfirming(false)} disabled={deleting} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-white transition-colors">{t('cancel')}</button>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
    </div>
  );
}

function PasswordSection() {
  const t = useTranslations('profile.password');
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (next.length < 8) return setMsg({ ok: false, text: t('tooShort') });
    setBusy(true);
    try {
      await userApi.changePassword(current, next);
      setCurrent(''); setNext('');
      setMsg({ ok: true, text: t('changed') });
    } catch (err: any) {
      setMsg({ ok: false, text: err?.response?.status === 400 ? t('wrongCurrent') : t('failed') });
    } finally { setBusy(false); }
  };

  const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';
  return (
    <form onSubmit={save} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <KeyRound className="w-5 h-5 text-brand-600" />
        <h2 className="font-semibold text-gray-900">{t('title')}</h2>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('current')}</label>
        <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" className={inputCls} dir="ltr" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('new')}</label>
        <input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" className={inputCls} dir="ltr" />
      </div>
      {msg && <p className={`text-sm px-3 py-2 rounded-lg ${msg.ok ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'}`}>{msg.text}</p>}
      <button type="submit" disabled={busy}
        className="flex items-center justify-center gap-2 border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-60">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : t('save')}
      </button>
    </form>
  );
}

function IdVerificationSection() {
  const t = useTranslations('profile');
  const { user, loadUser } = useAuthStore();
  const status = user?.idVerification?.status;
  const rejectedNote = (user?.idVerification as any)?.reviewNote as string | undefined;

  const [docType, setDocType] = useState<'ID_CARD' | 'PASSPORT'>('ID_CARD');
  const [front, setFront] = useState<File | null>(null);
  const [back, setBack] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [challenge, setChallenge] = useState<{ code: string; token: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);

  const showForm = !user?.isVerified && status !== 'PENDING';
  const loadChallenge = () => userApi.getIdChallenge().then(({ data }) => setChallenge({ code: data.code, token: data.token })).catch(() => {});
  useEffect(() => { if (showForm && !challenge) loadChallenge(); }, [showForm]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!front || (docType === 'ID_CARD' && !back)) { setUploadError(t('photosRequired')); return; }
    if (!video) { setUploadError(t('videoRequired')); return; }
    if (!consent) { setUploadError(t('consentRequired')); return; }
    if (!challenge) return;
    setUploading(true); setUploadError(''); setUploadSuccess(false);
    try {
      const fd = new FormData();
      fd.append('documentType', docType);
      fd.append('front', front);
      if (docType === 'ID_CARD' && back) fd.append('back', back);
      fd.append('video', video);
      fd.append('challengeToken', challenge.token);
      fd.append('consent', 'true');
      await userApi.uploadIdVerification(fd);
      setUploadSuccess(true);
      await loadUser();
      setFront(null); setBack(null); setVideo(null); setConsent(false);
    } catch (err: any) {
      setUploadError(err?.response?.data?.message || t('uploadFailed'));
      loadChallenge(); // the code is single-use per attempt
    } finally {
      setUploading(false);
    }
  };

  if (user?.isVerified) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 shadow-sm flex items-center gap-3">
        <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
        <div>
          <p className="font-semibold text-green-800">{t('idVerifiedTitle')}</p>
          <p className="text-sm text-green-600">{t('idVerifiedSubtitle')}</p>
        </div>
      </div>
    );
  }

  if (status === 'PENDING') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm flex items-center gap-3">
        <Clock className="w-6 h-6 text-amber-600 shrink-0" />
        <div>
          <p className="font-semibold text-amber-800">{t('underReviewTitle')}</p>
          <p className="text-sm text-amber-600">{t('underReviewSubtitle')}</p>
        </div>
      </div>
    );
  }

  const picker = (label: string, placeholder: string, file: File | null, ref: React.RefObject<HTMLInputElement>, setFile: (f: File | null) => void) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div
        onClick={() => ref.current?.click()}
        className={`flex items-center gap-3 border-2 border-dashed rounded-xl px-4 py-3 cursor-pointer transition-colors ${file ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50'}`}
      >
        <Upload className={`w-5 h-5 shrink-0 ${file ? 'text-brand-600' : 'text-gray-400'}`} />
        <span className={`text-sm truncate ${file ? 'text-brand-700 font-medium' : 'text-gray-400'}`}>{file ? file.name : placeholder}</span>
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck className="w-5 h-5 text-brand-600" />
        <h2 className="font-semibold text-gray-900">{t('idVerificationTitle')}</h2>
      </div>
      <p className="text-sm text-gray-500 mb-1">
        {status === 'REJECTED' ? t('idVerificationRejected') : t('idVerificationIntro')}
      </p>
      {status === 'REJECTED' && rejectedNote && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">{t('rejectedReason', { note: rejectedNote })}</p>}

      <form onSubmit={handleSubmit} className="space-y-4 mt-3">
        <div>
          <p className="block text-sm font-medium text-gray-700 mb-1.5">{t('docTypeLabel')}</p>
          <div className="grid grid-cols-2 gap-2">
            {(['ID_CARD', 'PASSPORT'] as const).map((d) => (
              <button type="button" key={d} onClick={() => setDocType(d)} aria-pressed={docType === d}
                className={`py-2.5 rounded-xl border text-sm font-medium transition-colors ${docType === d ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                {d === 'ID_CARD' ? t('docIdCard') : t('docPassport')}
              </button>
            ))}
          </div>
        </div>

        {docType === 'ID_CARD' ? (
          <>
            {picker(t('frontLabel'), t('frontPlaceholder'), front, frontRef, setFront)}
            {picker(t('backLabel'), t('backPlaceholder'), back, backRef, setBack)}
          </>
        ) : (
          picker(t('passportLabel'), t('passportPlaceholder'), front, frontRef, setFront)
        )}

        <div className="bg-gray-50 rounded-2xl p-4">
          <p className="text-sm font-semibold text-gray-900 mb-1">🎥 {t('selfieTitle')}</p>
          <p className="text-xs text-gray-500 mb-2">{t('selfieInstruction')}</p>
          <p className="text-3xl font-bold tracking-[0.3em] text-brand-700 text-center bg-white rounded-xl py-2 mb-2" dir="ltr">{challenge?.code ?? '····'}</p>
          <p className="text-xs text-gray-400 mb-3">{t('selfieHint')}</p>
          <SelfieVideoRecorder file={video} onChange={setVideo} />
        </div>

        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 w-4 h-4 accent-brand-600 shrink-0" />
          <span className="text-xs text-gray-600">{t('consentLabel')}</span>
        </label>

        {uploadError && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{uploadError}</p>}
        {uploadSuccess && <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">{t('uploadSuccess')}</p>}

        <button type="submit" disabled={uploading || !challenge}
          className="flex items-center justify-center gap-2 bg-brand-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-brand-700 transition-colors disabled:opacity-60 w-full">
          {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('uploading')}</> : <><ShieldAlert className="w-4 h-4" /> {t('submitVerification')}</>}
        </button>
      </form>
    </div>
  );
}

export default function ProfilePage() {
  const t = useTranslations('profile');
  const locale = useLocale();
  const { user, loadUser } = useAuthStore();
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (user?.name) setName(user.name); setLastName(user?.lastName || ''); setEmail(user?.email || ''); }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSaved(false);
    try {
      await userApi.updateMe({ name, ...(lastName.trim() && { lastName: lastName.trim() }), email: email.trim() });
      await loadUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setError(err?.response?.status === 409 ? t('emailTaken') : err?.response?.data?.message || t('saveErrorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>

      {/* Avatar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex items-center gap-4">
        <div className="w-16 h-16 bg-brand-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-bold text-gray-900 text-lg">{user?.name}</p>
          <p className="text-sm text-gray-500">{user?.phone}</p>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${user?.isVerified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
            {user?.isVerified ? t('verified') : t('notVerified')}
          </span>
          {(user?.rating ?? 0) > 0 && (
            <p className="text-sm text-gray-500 mt-1">⭐ {Number(user?.rating).toFixed(1)} {t('ratingSuffix')}</p>
          )}
        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-900">{t('editProfile')}</h2>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('firstName')}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="given-name"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('lastName')}</label>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} required={!!user?.lastName} autoComplete="family-name"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>
        <p className="text-xs text-gray-400 -mt-2">{t('nameHint')}</p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('phone')}</label>
          <input value={user?.phone || ''} disabled
            className="w-full border border-gray-100 bg-gray-50 rounded-xl px-4 py-2.5 text-sm text-gray-400 cursor-not-allowed" dir="ltr" />
        </div>

        {user?.birthDate && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('birthDate')}</label>
            <input value={new Date(user.birthDate).toLocaleDateString(locale, { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' })} disabled
              className="w-full border border-gray-100 bg-gray-50 rounded-xl px-4 py-2.5 text-sm text-gray-400 cursor-not-allowed" />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" dir="ltr"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          <p className="text-xs text-gray-400 mt-1">{t('emailHint')}</p>
        </div>

        {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        {saved && <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">{t('savedNotice')}</p>}

        <button type="submit" disabled={loading}
          className="flex items-center justify-center gap-2 bg-brand-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-brand-700 transition-colors disabled:opacity-60">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> {t('saveChanges')}</>}
        </button>
      </form>

      <PasswordSection />

      {/* ID Verification */}
      <div id="verification" className="scroll-mt-20">
        <IdVerificationSection />
      </div>

      <PrivacySection />
    </div>
  );
}
