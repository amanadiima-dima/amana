'use client';
import { useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { Globe, Check } from 'lucide-react';
import { routing, LOCALE_LABELS, type Locale } from '@/i18n/routing';

export default function LanguageSwitcher({ triggerClassName }: { triggerClassName?: string }) {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const switchTo = (next: Locale) => {
    setOpen(false);
    router.replace(pathname, { locale: next });
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Change language"
        className={
          triggerClassName ||
          'flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors'
        }
      >
        <Globe className="w-4 h-4" />
        {LOCALE_LABELS[locale]}
      </button>

      {open && (
        <ul className="absolute end-0 top-full mt-2 w-40 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
          {routing.locales.map((l) => (
            <li key={l}>
              <button
                type="button"
                onClick={() => switchTo(l)}
                className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm hover:bg-brand-50 transition-colors text-start"
              >
                <span className={l === locale ? 'font-semibold text-brand-700' : 'text-gray-700'}>
                  {LOCALE_LABELS[l]}
                </span>
                {l === locale && <Check className="w-3.5 h-3.5 text-brand-600" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
