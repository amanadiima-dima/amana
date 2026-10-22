import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowRight, Plane } from 'lucide-react';

export default function TravelerBand() {
  const t = useTranslations('landing.travelerBand');
  return (
    <section id="become-traveler" className="px-4 py-16 scroll-mt-32">
      <div className="max-w-6xl mx-auto bg-gray-900 rounded-3xl px-6 py-14 md:px-16 text-center relative overflow-hidden">
        <div aria-hidden className="absolute -top-20 -start-20 w-72 h-72 rounded-full bg-brand-600/20" />
        <div aria-hidden className="absolute -bottom-24 -end-16 w-80 h-80 rounded-full bg-amber-400/10" />
        <div className="relative">
          <Plane className="w-10 h-10 text-amber-400 mx-auto mb-5 rtl:-scale-x-100" />
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">{t('heading')}</h2>
          <p className="text-gray-300 max-w-2xl mx-auto leading-relaxed mb-8">{t('description')}</p>
          <Link href="/trips/new"
            className="inline-flex items-center gap-2 bg-white text-gray-900 px-7 py-3.5 rounded-full font-semibold hover:bg-amber-300 transition-colors">
            {t('cta')} <ArrowRight className="w-5 h-5 rtl:rotate-180" />
          </Link>
          <p className="text-sm text-gray-400 mt-4">{t('note')}</p>
        </div>
      </div>
    </section>
  );
}
