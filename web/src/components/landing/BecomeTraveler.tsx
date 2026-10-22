import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowRight, CheckCircle2, Plane } from 'lucide-react';

export default function BecomeTraveler() {
  const t = useTranslations('landing.becomeTraveler');
  const points = t.raw('points') as string[];
  return (
    <section id="become-traveler" className="py-24 bg-gradient-to-br from-amber-50 via-white to-amber-50 scroll-mt-16">
      <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 text-sm font-semibold px-3 py-1 rounded-full mb-6">
            <Plane className="w-4 h-4 rtl:-scale-x-100" /> {t('badge')}
          </div>
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4 leading-tight">{t('heading')}</h2>
          <p className="text-lg text-gray-500 mb-8 leading-relaxed">{t('description')}</p>
          <Link
            href="/trips/new"
            className="inline-flex items-center gap-2 bg-amber-400 text-gray-900 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-amber-300 transition-all shadow-lg shadow-amber-100 hover:scale-105"
          >
            {t('cta')} <ArrowRight className="w-5 h-5 rtl:rotate-180" />
          </Link>
          <p className="text-sm text-gray-400 mt-4">{t('note')}</p>
        </div>

        <ul className="bg-white rounded-3xl shadow-xl border border-amber-100 p-8 space-y-5">
          {points.map((p) => (
            <li key={p} className="flex items-start gap-3 text-gray-700">
              <CheckCircle2 className="w-6 h-6 text-amber-500 shrink-0" />
              <span className="leading-relaxed">{p}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
