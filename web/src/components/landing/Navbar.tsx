'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Menu, X, Package, Plane } from 'lucide-react';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

export default function Navbar() {
  const t = useTranslations('landing.navbar');
  const [open, setOpen] = useState(false);
  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-brand-600">
          <Package className="w-6 h-6" />
          Amana
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <Link href="/#how-it-works" className="hover:text-brand-600 transition-colors">{t('howItWorks')}</Link>
          <Link href="/#features" className="hover:text-brand-600 transition-colors">{t('features')}</Link>
          <Link href="/#testimonials" className="hover:text-brand-600 transition-colors">{t('reviews')}</Link>
          <Link href="/#become-traveler" className="flex items-center gap-1.5 bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full hover:bg-amber-200 transition-colors">
            <Plane className="w-4 h-4 rtl:-scale-x-100" /> {t('becomeTraveler')}
          </Link>
          <LanguageSwitcher />
          <Link href="/auth" className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors">
            {t('getStarted')}
          </Link>
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 flex flex-col gap-4 text-sm font-medium">
          <Link href="/#how-it-works" onClick={() => setOpen(false)}>{t('howItWorks')}</Link>
          <Link href="/#features" onClick={() => setOpen(false)}>{t('features')}</Link>
          <Link href="/#testimonials" onClick={() => setOpen(false)}>{t('reviews')}</Link>
          <Link href="/#become-traveler" onClick={() => setOpen(false)} className="flex items-center gap-1.5 text-amber-800 font-semibold">
            <Plane className="w-4 h-4 rtl:-scale-x-100" /> {t('becomeTraveler')}
          </Link>
          <LanguageSwitcher />
          <Link href="/auth" className="bg-brand-600 text-white px-4 py-2 rounded-lg text-center">{t('getStarted')}</Link>
        </div>
      )}
    </nav>
  );
}
