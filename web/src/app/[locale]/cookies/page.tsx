import { getTranslations, setRequestLocale } from 'next-intl/server';
import LegalPage from '@/components/legal/LegalPage';
import { COOKIES } from '@/content/legal/cookies';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'legal' });
  return { title: `${t('cookiesTitle')} · Amana` };
}

export default async function CookiesPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'legal' });
  return <LegalPage locale={locale} title={t('cookiesTitle')} doc={COOKIES[locale] || COOKIES.en} />;
}
