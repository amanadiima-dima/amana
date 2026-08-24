'use client';
import { useEffect, useState } from 'react';
import { notificationApi } from '@/lib/api';
import { Bell } from 'lucide-react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    notificationApi.getAll().then(({ data }) => setNotifications(data.notifications || [])).catch(() => {});
  }, []);

  const markRead = async (id: string) => {
    await notificationApi.markRead(id).catch(() => {});
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Notifications</h1>

      {notifications.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <Bell className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-semibold text-gray-600">No notifications yet</p>
        </div>
      )}

      <div className="space-y-3">
        {notifications.map((n) => (
          <div key={n.id} onClick={() => !n.read && markRead(n.id)}
            className={`bg-white rounded-2xl border p-4 shadow-sm cursor-pointer transition-colors ${n.read ? 'border-gray-100 opacity-70' : 'border-brand-200 bg-brand-50'}`}>
            <div className="flex items-start gap-3">
              <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${n.read ? 'bg-gray-300' : 'bg-brand-600'}`} />
              <div>
                <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                <p className="text-sm text-gray-500 mt-0.5">{n.body}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
