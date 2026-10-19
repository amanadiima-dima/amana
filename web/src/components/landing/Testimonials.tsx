import { useTranslations } from 'next-intl';

export default function Testimonials() {
  const t = useTranslations('landing.testimonials');
  const reviews = t.raw('items') as { name: string; role: string; text: string }[];

  return (
    <section id="testimonials" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4">{t('heading')}</h2>
          <p className="text-xl text-gray-500">{t('subheading')}</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {reviews.map(({ name, role, text }) => (
            <div key={name} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center">
                  {name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{name}</p>
                  <p className="text-xs text-gray-400">{role}</p>
                </div>
                <div className="ms-auto text-yellow-400 text-sm">{'★'.repeat(5)}</div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">&ldquo;{text}&rdquo;</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
