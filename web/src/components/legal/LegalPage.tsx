import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ArrowLeft, Package } from 'lucide-react';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import Footer from '@/components/landing/Footer';
import { COMPANY } from '@/content/legal/company';
import type { LegalBlock, LegalDoc } from '@/content/legal/types';

const fill = (text: string) =>
  text.replace(/\{(legalName|address|privacyEmail|euRepresentative)\}/g, (_, k: keyof typeof COMPANY) => COMPANY[k]);

function Block({ block }: { block: LegalBlock }) {
  if (typeof block === 'string') return <p className="text-gray-600 leading-relaxed">{fill(block)}</p>;
  if ('list' in block) {
    return (
      <ul className="list-disc ps-5 space-y-2 text-gray-600 leading-relaxed">
        {block.list.map((item, i) => <li key={i}>{fill(item)}</li>)}
      </ul>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>{block.table.head.map((h) => <th key={h} className="text-start px-4 py-2.5 font-semibold text-gray-700">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {block.table.rows.map((row, i) => (
            <tr key={i} className="align-top">
              {row.map((cell, j) => <td key={j} className={`px-4 py-2.5 ${j === 0 ? 'font-medium text-gray-800 min-w-[9rem]' : 'text-gray-600'}`}>{fill(cell)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function LegalPage({ locale, title, doc }: { locale: string; title: string; doc: LegalDoc }) {
  const t = await getTranslations({ locale, namespace: 'legal' });
  const updated = new Date(COMPANY.lastUpdated).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
  return (
    <main className="bg-white text-gray-900 min-h-screen">
      <header className="border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-brand-600"><Package className="w-6 h-6" /> Amana</Link>
          <LanguageSwitcher />
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-4 py-10">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600 mb-6">
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t('backHome')}
        </Link>
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        <p className="text-sm text-gray-400 mb-6">{t('lastUpdated', { date: updated })}</p>
        <p className="text-gray-700 leading-relaxed mb-8">{fill(doc.intro)}</p>

        {doc.sections.length > 3 && (
          <nav className="bg-gray-50 rounded-2xl p-5 mb-10">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">{t('contents')}</p>
            <ol className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
              {doc.sections.map((s) => <li key={s.id}><a href={`#${s.id}`} className="text-brand-600 hover:underline">{s.title}</a></li>)}
            </ol>
          </nav>
        )}

        <div className="space-y-10">
          {doc.sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-6 space-y-3">
              <h2 className="text-xl font-semibold">{s.title}</h2>
              {s.blocks.map((b, i) => <Block key={i} block={b} />)}
            </section>
          ))}
        </div>
      </article>
      <Footer />
    </main>
  );
}
