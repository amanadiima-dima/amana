'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Menu, X, Package } from 'lucide-react';
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
          <a href="#how-it-works" className="hover:text-brand-600 transition-colors">{t('howItWorks')}</a>
          <a href="#features" className="hover:text-brand-600 transition-colors">{t('features')}</a>
          <a href="#testimonials" className="hover:text-brand-600 transition-colors">{t('reviews')}</a>
          <LanguageSwitcher />
          <Link href="/auth" className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors">
            {t('getStarted')}
          </Link>
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 flex flex-col gap-4 text-sm font-medium">
          <a href="#how-it-works" onClick={() => setOpen(false)}>{t('howItWorks')}</a>
          <a href="#features" onClick={() => setOpen(false)}>{t('features')}</a>
          <a href="#testimonials" onClick={() => setOpen(false)}>{t('reviews')}</a>
          <LanguageSwitcher />
          <Link href="/auth" className="bg-brand-600 text-white px-4 py-2 rounded-lg text-center">{t('getStarted')}</Link>
        </div>
      )}
    </nav>
  );
}
