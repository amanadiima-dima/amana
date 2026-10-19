'use client';
import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { notificationApi } from '@/lib/api';
import { Bell } from 'lucide-react';
import { useNotificationStore } from '@/store/notificationStore';

export default function NotificationsPage() {
  const t = useTranslations('notifications');
  const locale = useLocale();
  const router = useRouter();
  const refreshUnread = useNotificationStore((s) => s.refresh);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    notificationApi.getAll().then(({ data }) => setNotifications(data.notifications || [])).catch(() => {});
  }, []);

  const markRead = async (id: string) => {
    await notificationApi.markRead(id).catch(() => {});
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    refreshUnread();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('title')}</h1>

      {notifications.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <Bell className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-semibold text-gray-600">{t('emptyTitle')}</p>
        </div>
      )}

      <div className="space-y-3">
        {notifications.map((n) => (
          <div key={n.id} onClick={() => {
            if (!n.read) markRead(n.id);
            if (n.data?.bookingId) router.push(`/bookings/${n.data.bookingId}`);
          }}
            className={`bg-white rounded-2xl border p-4 shadow-sm cursor-pointer transition-colors ${n.read ? 'border-gray-100 opacity-70' : 'border-brand-200 bg-brand-50'}`}>
            <div className="flex items-start gap-3">
              <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${n.read ? 'bg-gray-300' : 'bg-brand-600'}`} />
              <div>
                <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                <p className="text-sm text-gray-500 mt-0.5">{n.body}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString(locale)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
