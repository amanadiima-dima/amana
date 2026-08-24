'use client';
import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { userApi } from '@/lib/api';
import { Loader2, Save, ShieldCheck, ShieldAlert, Upload, CheckCircle2, Clock } from 'lucide-react';

function IdVerificationSection() {
  const { user, loadUser } = useAuthStore();
  const status = user?.idVerification?.status;

  const [front, setFront] = useState<File | null>(null);
  const [back, setBack] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!front || !back) { setUploadError('Please select both front and back photos.'); return; }
    setUploading(true); setUploadError(''); setUploadSuccess(false);
    try {
      const fd = new FormData();
      fd.append('front', front);
      fd.append('back', back);
      await userApi.uploadIdVerification(fd);
      setUploadSuccess(true);
      await loadUser();
      setFront(null); setBack(null);
    } catch (err: any) {
      setUploadError(err?.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (user?.isVerified) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 shadow-sm flex items-center gap-3">
        <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
        <div>
          <p className="font-semibold text-green-800">Identity Verified</p>
          <p className="text-sm text-green-600">Your ID has been reviewed and approved.</p>
        </div>
      </div>
    );
  }

  if (status === 'PENDING') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm flex items-center gap-3">
        <Clock className="w-6 h-6 text-amber-600 shrink-0" />
        <div>
          <p className="font-semibold text-amber-800">Verification Under Review</p>
          <p className="text-sm text-amber-600">Your ID photos have been submitted. We'll notify you once reviewed (usually within 24h).</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck className="w-5 h-5 text-brand-600" />
        <h2 className="font-semibold text-gray-900">ID Verification</h2>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        {status === 'REJECTED'
          ? '⚠️ Your previous submission was rejected. Please re-upload clear photos of your ID.'
          : 'Upload a photo of your ID (passport or national ID) to get verified. Verified users build more trust with senders and travelers.'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {(['front', 'back'] as const).map((side) => {
          const file = side === 'front' ? front : back;
          const ref = side === 'front' ? frontRef : backRef;
          const setFile = side === 'front' ? setFront : setBack;
          return (
            <div key={side}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{side} of ID</label>
              <div
                onClick={() => ref.current?.click()}
                className={`flex items-center gap-3 border-2 border-dashed rounded-xl px-4 py-3 cursor-pointer transition-colors ${file ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50'}`}
              >
                <Upload className={`w-5 h-5 shrink-0 ${file ? 'text-brand-600' : 'text-gray-400'}`} />
                <span className={`text-sm truncate ${file ? 'text-brand-700 font-medium' : 'text-gray-400'}`}>
                  {file ? file.name : `Click to upload ${side} photo…`}
                </span>
              </div>
              <input
                ref={ref}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
          );
        })}

        {uploadError && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{uploadError}</p>}
        {uploadSuccess && <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">✓ Photos uploaded! Your verification is now pending review.</p>}

        <button type="submit" disabled={uploading || !front || !back}
          className="flex items-center justify-center gap-2 bg-brand-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-brand-700 transition-colors disabled:opacity-60 w-full">
          {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <><ShieldAlert className="w-4 h-4" /> Submit for Verification</>}
        </button>
      </form>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (user?.name) setName(user.name); }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSaved(false);
    try {
      await userApi.updateMe({ name });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>

      {/* Avatar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex items-center gap-4">
        <div className="w-16 h-16 bg-brand-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-bold text-gray-900 text-lg">{user?.name}</p>
          <p className="text-sm text-gray-500">{user?.phone}</p>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${user?.isVerified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
            {user?.isVerified ? '✓ ID Verified' : '⚠ Not Verified'}
          </span>
          {(user?.rating ?? 0) > 0 && (
            <p className="text-sm text-gray-500 mt-1">⭐ {Number(user?.rating).toFixed(1)} rating</p>
          )}
        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-900">Edit Profile</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input value={user?.phone || ''} disabled
            className="w-full border border-gray-100 bg-gray-50 rounded-xl px-4 py-2.5 text-sm text-gray-400 cursor-not-allowed" />
        </div>

        {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        {saved && <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">✓ Profile saved!</p>}

        <button type="submit" disabled={loading}
          className="flex items-center justify-center gap-2 bg-brand-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-brand-700 transition-colors disabled:opacity-60">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save changes</>}
        </button>
      </form>

      {/* ID Verification */}
      <IdVerificationSection />
    </div>
  );
}
