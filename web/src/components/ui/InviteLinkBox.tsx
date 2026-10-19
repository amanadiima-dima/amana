'use client';
import { useState } from 'react';

export default function InviteLinkBox({ token, label, copyLabel, copiedLabel, locale }: { token: string; label: string; copyLabel: string; copiedLabel: string; locale: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window === 'undefined' ? '' : `${window.location.origin}${locale === 'en' ? '' : `/${locale}`}/invite/${token}`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
  };
  return (
    <div className="mt-3 text-start">
      <p className="text-xs font-semibold text-gray-500 mb-1">{label}</p>
      <div className="flex gap-2">
        <input readOnly value={url} dir="ltr" onFocus={(e) => e.currentTarget.select()} className="flex-1 min-w-0 border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white text-gray-600" />
        <button type="button" onClick={copy} className="shrink-0 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-brand-600 hover:bg-brand-50 transition-colors">{copied ? copiedLabel : copyLabel}</button>
      </div>
    </div>
  );
}
