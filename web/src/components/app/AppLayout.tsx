'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Package, Plane, Bell, User, LayoutDashboard, LogOut, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import clsx from 'clsx';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/parcels', label: 'Send Parcels', icon: Package },
  { href: '/trips', label: 'My Trips', icon: Plane },
  { href: '/bookings', label: 'Bookings', icon: Package },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const allNav = [
    ...nav,
    ...(user?.role === 'ADMIN' ? [{ href: '/admin', label: 'Admin', icon: ShieldCheck }] : []),
  ];

  const handleLogout = async () => { await logout(); router.push('/'); };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 fixed h-full">
        <div className="p-6 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-brand-600">
            <Package className="w-5 h-5" /> Amana
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
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-400">{user?.isVerified ? '✓ Verified' : '⚠ Unverified'}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 transition-colors w-full">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 md:ml-64 min-h-screen">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2 font-bold text-brand-600"><Package className="w-5 h-5" /> Amana</Link>
          <Link href="/profile"><User className="w-5 h-5 text-gray-600" /></Link>
        </div>
        <div className="p-6">{children}</div>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-2">
          {allNav.slice(0, 5).map(({ href, icon: Icon }) => (
            <Link key={href} href={href} className={clsx('p-2', pathname === href ? 'text-brand-600' : 'text-gray-400')}>
              <Icon className="w-5 h-5" />
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}
