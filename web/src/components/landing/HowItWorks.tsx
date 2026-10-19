import { useTranslations } from 'next-intl';

const ICONS = ['🔍', '📦', '🤝', '✅'];
const COLORS = ['bg-blue-50 text-blue-600', 'bg-purple-50 text-purple-600', 'bg-orange-50 text-orange-600', 'bg-green-50 text-green-600'];

export default function HowItWorks() {
  const t = useTranslations('landing.howItWorks');
  const steps = t.raw('steps') as { title: string; desc: string }[];

  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4">{t('heading')}</h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            {t('subheading')}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="relative text-center">
              <div className={`w-16 h-16 ${COLORS[i]} rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4`}>
                {ICONS[i]}
              </div>
              <div className="absolute -top-2 -end-2 w-7 h-7 bg-brand-600 text-white rounded-full text-xs font-bold flex items-center justify-center">
                {i + 1}
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">{step.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
