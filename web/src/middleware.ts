import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

const APP_ROUTE_PREFIXES = [
  '/dashboard', '/trips', '/parcels', '/bookings', '/tracking',
  '/profile', '/traveler', '/notifications', '/admin', '/payment',
];

// English is the default locale and carries no URL prefix (localePrefix:
// 'as-needed'), so only fr/ar/es ever show up as a leading path segment.
function stripLocale(pathname: string): { locale: string | null; path: string } {
  const match = pathname.match(/^\/(fr|ar|es)(\/.*)?$/);
  if (match) return { locale: match[1], path: match[2] || '/' };
  return { locale: null, path: pathname };
}

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const { locale, path } = stripLocale(pathname);
  const prefix = locale ? `/${locale}` : '';

  const token = req.cookies.get('accessToken')?.value;
  const isAppRoute = APP_ROUTE_PREFIXES.some((p) => path.startsWith(p));

  if (isAppRoute && !token) {
    // Preserve the intended destination so auth can redirect back after login
    const loginUrl = new URL(`${prefix}/auth`, req.url);
    loginUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(loginUrl);
  }
  if (path === '/auth' && token) {
    return NextResponse.redirect(new URL(`${prefix}/dashboard`, req.url));
  }

  return intlMiddleware(req);
}

export const config = {
  // Same app routes as before, plus their fr/ar/es-prefixed equivalents, plus
  // every other path next-intl needs to see to negotiate/redirect locales
  // (excluding static files and Next internals).
  matcher: ['/((?!_next|.*\\..*).*)'],
};
