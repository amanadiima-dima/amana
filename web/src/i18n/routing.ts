import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'fr', 'ar', 'es'],
  defaultLocale: 'en',
  // English (default) has no URL prefix — /trips/new — so every existing
  // link in the not-yet-translated pages keeps working unchanged. Other
  // locales are prefixed — /fr/trips/new, /ar/trips/new, /es/trips/new.
  localePrefix: 'as-needed',
});

export type Locale = (typeof routing.locales)[number];

export const RTL_LOCALES: Locale[] = ['ar'];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
  ar: 'العربية',
  es: 'Español',
};
