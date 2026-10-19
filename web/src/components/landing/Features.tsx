import { useTranslations } from 'next-intl';
import { Shield, MapPin, Star, Bell, CreditCard, Zap } from 'lucide-react';

const ICONS = [Shield, CreditCard, MapPin, Star, Bell, Zap];
const COLORS = [
  'text-blue-600 bg-blue-50',
  'text-green-600 bg-green-50',
  'text-purple-600 bg-purple-50',
  'text-yellow-600 bg-yellow-50',
  'text-red-600 bg-red-50',
  'text-orange-600 bg-orange-50',
];

export default function Features() {
  const t = useTranslations('landing.features');
  const items = t.raw('items') as { title: string; desc: string }[];

  return (
    <section id="features" className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4">{t('heading')}</h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            {t('subheading')}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map(({ title, desc }, i) => {
            const Icon = ICONS[i];
            return (
              <div key={title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 ${COLORS[i]} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
