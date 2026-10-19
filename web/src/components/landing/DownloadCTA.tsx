import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';

export default function DownloadCTA() {
  const t = useTranslations('landing.downloadCTA');
  return (
    <section className="py-24 bg-gradient-to-br from-brand-600 to-brand-900">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
          {t('heading')}
        </h2>
        <p className="text-xl text-brand-100 mb-10 max-w-2xl mx-auto">
          {t('description')}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <Link
            href="/auth"
            className="flex items-center gap-2 bg-white text-brand-600 px-8 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-xl"
          >
            {t('cta')} <ArrowRight className="w-5 h-5 rtl:rotate-180" />
          </Link>
        </div>

        <div className="flex items-center justify-center gap-6 text-brand-200 text-sm">
          <span>{t('iosComingSoon')}</span>
          <span>{t('androidComingSoon')}</span>
        </div>
      </div>
    </section>
  );
}
