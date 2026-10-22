'use client';
import { useEffect } from 'react';
import Logo from '@/components/ui/Logo';
import { useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { Package, Plane, Bell, User, LayoutDashboard, LogOut, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import clsx from 'clsx';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const router = useRouter();
  const { user, loadUser, logout } = useAuthStore();
  const { unread, refresh: refreshUnread } = useNotificationStore();

  // Rehydrate the current user on a fresh page load (store isn't persisted)
  useEffect(() => {
    if (!user) loadUser();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the unread-notifications badge fresh: on load, on navigation, every 30s.
  useEffect(() => {
    if (!user) return;
    refreshUnread();
    const timer = setInterval(refreshUnread, 30000);
    return () => clearInterval(timer);
  }, [user?.id, pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const nav = [
    { href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { href: '/parcels', label: t('sendParcels'), icon: Package },
    { href: '/trips', label: t('myTrips'), icon: Plane },
    { href: '/bookings', label: t('bookings'), icon: Package },
    { href: '/notifications', label: t('notifications'), icon: Bell },
    { href: '/profile', label: t('profile'), icon: User },
  ];

  const allNav = [
    ...nav,
    ...(user?.role === 'ADMIN' || user?.role === 'MODERATOR' ? [{ href: '/admin', label: t('admin'), icon: ShieldCheck }] : []),
  ];

  const handleLogout = async () => { await logout(); router.push('/'); };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-e border-gray-100 fixed h-full">
        <div className="p-6 border-b border-gray-100">
          <Link href="/" aria-label="Amana">
            <Logo className="h-8" priority />
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {allNav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-brand-50 text-brand-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="flex-1">{label}</span>
              {href === '/notifications' && unread > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100 space-y-3">
          <LanguageSwitcher triggerClassName="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors w-full" />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-400">{user?.isVerified ? `✓ ${t('verified')}` : `⚠ ${t('unverified')}`}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 transition-colors w-full">
            <LogOut className="w-4 h-4 rtl:rotate-180" /> {t('logout')}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 md:ms-64 min-h-screen">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-100">
          <Link href="/" aria-label="Amana"><Logo className="h-7" /></Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher triggerClassName="text-gray-600" />
            <Link href="/profile"><User className="w-5 h-5 text-gray-600" /></Link>
          </div>
        </div>
        <div className="p-6">{children}</div>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 start-0 end-0 bg-white border-t border-gray-100 flex justify-around py-2">
          {allNav.slice(0, 5).map(({ href, icon: Icon }) => (
            <Link key={href} href={href} className={clsx('p-2 relative', pathname === href ? 'text-brand-600' : 'text-gray-400')}>
              <Icon className="w-5 h-5" />
              {href === '/notifications' && unread > 0 && (
                <span className="absolute top-0.5 end-0 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}
