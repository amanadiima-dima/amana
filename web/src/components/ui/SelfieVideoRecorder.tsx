'use client';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Video, Square, RotateCcw, Upload, Loader2 } from 'lucide-react';

const MAX_SECONDS = 20;

// Records a short selfie video in the browser (with a file-upload fallback when there is no camera).
export default function SelfieVideoRecorder({ file, onChange }: { file: File | null; onChange: (f: File | null) => void }) {
  const t = useTranslations('profile');
  const liveRef = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [state, setState] = useState<'idle' | 'starting' | 'recording'>('idle');
  const [seconds, setSeconds] = useState(0);
  const [noCamera, setNoCamera] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const stopStream = () => { streamRef.current?.getTracks().forEach((tr) => tr.stop()); streamRef.current = null; };
  useEffect(() => () => { stopStream(); if (timerRef.current) clearInterval(timerRef.current); }, []);
  useEffect(() => {
    if (!file) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const start = async () => {
    setNoCamera(false);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') return setNoCamera(true);
    setState('starting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
      streamRef.current = stream;
      if (liveRef.current) { liveRef.current.srcObject = stream; liveRef.current.play().catch(() => {}); }
      const mime = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'].find((m) => MediaRecorder.isTypeSupported(m));
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const type = rec.mimeType || 'video/webm';
        const ext = type.includes('mp4') ? 'mp4' : 'webm';
        onChange(new File(chunksRef.current, `selfie.${ext}`, { type }));
        stopStream();
        if (timerRef.current) clearInterval(timerRef.current);
        setState('idle');
      };
      recorderRef.current = rec;
      rec.start();
      setSeconds(0);
      setState('recording');
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= MAX_SECONDS) recorderRef.current?.stop();
          return s + 1;
        });
      }, 1000);
    } catch {
      stopStream();
      setState('idle');
      setNoCamera(true);
    }
  };

  const stop = () => recorderRef.current?.state === 'recording' && recorderRef.current.stop();

  return (
    <div>
      {state !== 'idle' && (
        <div className="relative rounded-xl overflow-hidden bg-black mb-3">
          <video ref={liveRef} muted playsInline className="w-full max-h-64 object-cover -scale-x-100" />
          {state === 'recording' && (
            <span className="absolute top-2 start-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">● {t('selfieRecording', { seconds })}</span>
          )}
        </div>
      )}

      {state === 'idle' && previewUrl && (
        <div className="mb-3">
          <video src={previewUrl} controls playsInline className="w-full max-h-64 rounded-xl bg-black" />
          <p className="text-xs font-semibold text-green-600 mt-1">{t('selfieReady')}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        {state === 'idle' && (
          <button type="button" onClick={start} className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors">
            {file ? <RotateCcw className="w-4 h-4" /> : <Video className="w-4 h-4" />} {file ? t('selfieRetake') : t('selfieRecord')}
          </button>
        )}
        {state === 'starting' && <span className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="w-4 h-4 animate-spin" /> {t('preparing')}</span>}
        {state === 'recording' && (
          <button type="button" onClick={stop} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors">
            <Square className="w-4 h-4" /> {t('selfieStop')}
          </button>
        )}
        {state === 'idle' && (
          <label className="flex items-center gap-2 text-sm text-brand-600 font-medium cursor-pointer hover:underline">
            <Upload className="w-4 h-4" /> {t('selfieUpload')}
            <input type="file" accept="video/*" capture="user" className="hidden" onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
          </label>
        )}
      </div>
      {noCamera && <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mt-2">{t('selfieNoCamera')}</p>}
    </div>
  );
}
