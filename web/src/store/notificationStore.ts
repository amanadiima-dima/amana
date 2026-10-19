import { create } from 'zustand';
import { notificationApi } from '@/lib/api';

interface NotificationState {
  unread: number;
  refresh: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unread: 0,
  refresh: async () => {
    try {
      const { data } = await notificationApi.unreadCount();
      set({ unread: data.count ?? 0 });
    } catch {
      /* keep the last known count */
    }
  },
}));
