import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const token = req.cookies.get('accessToken')?.value;
  const { pathname } = req.nextUrl;

  const isAppRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/trips') ||
    pathname.startsWith('/parcels') || pathname.startsWith('/bookings') ||
    pathname.startsWith('/tracking') || pathname.startsWith('/profile') ||
    pathname.startsWith('/traveler') || pathname.startsWith('/notifications') ||
    pathname.startsWith('/admin');

  if (isAppRoute && !token) {
    // Preserve the intended destination so auth can redirect back after login
    const loginUrl = new URL('/auth', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  if (pathname === '/auth' && token) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/dashboard/:path*', '/trips/:path*', '/parcels/:path*', '/bookings/:path*', '/tracking/:path*', '/profile/:path*', '/traveler/:path*', '/notifications/:path*', '/auth'] };
