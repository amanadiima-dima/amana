import { useTranslations } from 'next-intl';
import { Wallet, ShieldCheck, UserCheck } from 'lucide-react';

const ICONS = [Wallet, ShieldCheck, UserCheck];

export default function Benefits() {
  const t = useTranslations('landing.benefits');
  const items = t.raw('items') as { title: string; desc: string }[];
  return (
    <section id="features" className="px-4 py-16 scroll-mt-32">
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10">
        {items.map(({ title, desc }, i) => {
          const Icon = ICONS[i];
          return (
            <div key={title}>
              <Icon className="w-9 h-9 text-brand-600 mb-4" strokeWidth={1.75} />
              <h3 className="font-bold text-lg text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-500 leading-relaxed">{desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
