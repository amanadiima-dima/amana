'use client';
import { useLocale } from 'next-intl';

export const CURRENCIES = ['EUR', 'CHF', 'MAD', 'DZD', 'TND', 'GBP', 'USD'] as const;
export type Currency = (typeof CURRENCIES)[number];

// Latin digits in every language (incl. Arabic) so amounts match the rest of the UI.
export function formatMoney(amount: number | string | null | undefined, currency: string | undefined, locale: string, exact = false) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '—';
  const cur = currency || 'EUR';
  try {
    return new Intl.NumberFormat(`${locale}-u-nu-latn`, {
      style: 'currency',
      currency: cur,
      minimumFractionDigits: exact || !Number.isInteger(n) ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${cur} ${n}`;
  }
}

export function useMoney() {
  const locale = useLocale();
  return (amount: number | string | null | undefined, currency?: string, exact = false) => formatMoney(amount, currency, locale, exact);
}

const COUNTRY_CURRENCY: Record<string, Currency> = {
  france: 'EUR', belgium: 'EUR', spain: 'EUR', italy: 'EUR', germany: 'EUR', netherlands: 'EUR', portugal: 'EUR',
  ireland: 'EUR', austria: 'EUR', luxembourg: 'EUR', greece: 'EUR', finland: 'EUR',
  switzerland: 'CHF', morocco: 'MAD', algeria: 'DZD', tunisia: 'TND',
  'united kingdom': 'GBP', 'united states': 'USD', 'united states of america': 'USD',
};

export function currencyForCountry(country?: string): Currency | undefined {
  return country ? COUNTRY_CURRENCY[country.trim().toLowerCase()] : undefined;
}

const PHONE_PREFIX: [string, Currency][] = [
  ['+212', 'MAD'], ['+213', 'DZD'], ['+216', 'TND'], ['+41', 'CHF'], ['+44', 'GBP'],
  ['+33', 'EUR'], ['+32', 'EUR'], ['+34', 'EUR'], ['+39', 'EUR'], ['+49', 'EUR'], ['+31', 'EUR'], ['+351', 'EUR'],
  ['+1', 'USD'],
];

// Sender's home currency from their phone country code.
export function currencyForPhone(phone?: string): Currency {
  const p = phone || '';
  return PHONE_PREFIX.find(([prefix]) => p.startsWith(prefix))?.[1] ?? 'EUR';
}
