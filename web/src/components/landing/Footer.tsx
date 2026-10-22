import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Package } from 'lucide-react';

export default function Footer() {
  const t = useTranslations('landing.footer');
  return (
    <footer className="bg-gray-900 text-gray-400 py-16">
      <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-4 gap-10">
        <div>
          <Link href="/" className="flex items-center gap-2 text-white font-bold text-xl mb-4">
            <Package className="w-5 h-5 text-brand-500" /> Amana
          </Link>
          <p className="text-sm leading-relaxed">
            {t('tagline')}
          </p>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4">{t('product')}</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/#how-it-works" className="hover:text-white transition-colors">{t('howItWorks')}</Link></li>
            <li><Link href="/#features" className="hover:text-white transition-colors">{t('features')}</Link></li>
            <li><Link href="/auth" className="hover:text-white transition-colors">{t('getStarted')}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4">{t('forUsers')}</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/parcels/search" className="hover:text-white transition-colors">{t('sendParcel')}</Link></li>
            <li><Link href="/trips/new" className="font-semibold text-amber-400 hover:text-amber-300 transition-colors">{t('becomeTraveler')}</Link></li>
            <li><Link href="/dashboard" className="hover:text-white transition-colors">{t('dashboard')}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4">{t('legal')}</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/privacy" className="hover:text-white transition-colors">{t('privacyPolicy')}</Link></li>
            <li><Link href="/terms" className="hover:text-white transition-colors">{t('termsOfService')}</Link></li>
            <li><Link href="/cookies" className="hover:text-white transition-colors">{t('cookiePolicy')}</Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-12 pt-6 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between text-sm">
        <p>{t('rights', { year: new Date().getFullYear() })}</p>
        <p className="mt-2 md:mt-0">{t('madeWith')}</p>
      </div>
    </footer>
  );
}
