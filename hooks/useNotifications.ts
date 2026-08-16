import { useState } from 'react';
import { notificationsApi } from '@/lib/api/notifications.api';
import type { NotificationQuery } from '@/lib/api/notifications.api';

export function useNotifications() {
  const [notifications, setNotifications] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async (query?: NotificationQuery) => {
    setLoading(true);
    setError(null);

    try {
      const result = await notificationsApi.list(query);
      setNotifications(result.data.items ?? []);
      return result;
    } catch (err) {
      setError((err as Error).message ?? 'Failed to fetch notifications');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    notifications,
    loading,
    error,
    fetchNotifications,
    getUnreadCount: notificationsApi.getUnreadCount,
    markRead: notificationsApi.markRead,
    markAllRead: notificationsApi.markAllRead
  };
}
