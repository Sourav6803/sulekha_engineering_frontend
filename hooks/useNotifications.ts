import { useCallback, useEffect, useMemo, useState } from 'react';
import { notificationsApi } from '@/lib/api/notifications.api';
import { handleApiError } from '@/lib/errors/handleApiError';
import type { NotificationQuery, UnifiedNotification } from '@/types/notification';
import type { PaginationInfo } from '@/types/api';

export function useNotifications() {
  const [notifications, setNotifications] = useState<UnifiedNotification[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async (query?: NotificationQuery) => {
    setLoading(true);
    setError(null);

    try {
      const result = await notificationsApi.list(query);
      // The array is `data` itself, not `data.items` — see ApiListResponse.
      const items = Array.isArray(result.data) ? result.data : [];
      setNotifications(items.map(n => ({ ...n, publishedAt: n.createdAt })));
      setPagination(
        result.pagination ?? {
          page: query?.page ?? 1,
          limit: query?.limit ?? 20,
          total: items.length,
          pages: items.length > 0 ? 1 : 0,
        }
      );
      return result;
    } catch (err) {
      const message = handleApiError(err);
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnified = useCallback(async (query?: NotificationQuery) => {
    setLoading(true);
    setError(null);

    try {
      const result = await notificationsApi.getUnified(query);
      // As above: `data` is the feed. Reading `data.data` here returned undefined for
      // every call, so the feed was always empty while the unread count — which is
      // read correctly — still showed on the bell.
      const items = Array.isArray(result.data) ? result.data : [];
      setNotifications(items);
      setPagination(
        result.pagination ?? {
          page: query?.page ?? 1,
          limit: query?.limit ?? 20,
          total: items.length,
          pages: items.length > 0 ? 1 : 0,
        }
      );
      return result;
    } catch (err) {
      const message = handleApiError(err);
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const result = await notificationsApi.getUnreadCount();
      setUnreadCount(result.data.unreadCount ?? 0);
      return result;
    } catch {
      return null;
    }
  }, []);

  const markRead = useCallback(async (id: string) => {
    try {
      const result = await notificationsApi.markRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      return result;
    } catch (err) {
      throw err;
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      const result = await notificationsApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      return result;
    } catch (err) {
      throw err;
    }
  }, []);

  const fetchPMSuryaGhar = useCallback(async () => {
    try {
      const result = await notificationsApi.fetchPMSuryaGhar();
      const external = Array.isArray(result.data) ? result.data : [];
      setNotifications(prev => {
        const internal = prev.filter(n => n.source === 'internal');
        return [...external, ...internal].sort((a, b) => {
          const da = new Date(a.publishedAt || a.createdAt).getTime();
          const db = new Date(b.publishedAt || b.createdAt).getTime();
          return db - da;
        });
      });
      return result;
    } catch {
      return [];
    }
  }, []);

  // Auto-fetch unread count on mount
  useEffect(() => {
    let active = true;
    async function load() {
      if (!active) return;
      await fetchUnreadCount();
    }
    void load();
    return () => {
      active = false;
    };
  }, [fetchUnreadCount]);

  /*
   * Re-read the count when the tab comes back to the foreground, so a notification
   * filed while the window was in the background shows on the badge without a
   * reload. Deliberately not a timer: being right whenever it is looked at is
   * enough, and an interval would keep every open tab talking to the server all
   * day for a number nobody is watching.
   */
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void fetchUnreadCount();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [fetchUnreadCount]);

  const unreadNotifications = useMemo(
    () => notifications.filter(n => !n.isRead),
    [notifications]
  );

  const schemeNotifications = useMemo(
    () => notifications.filter(n => n.type === 'scheme' || n.source !== 'internal'),
    [notifications]
  );

  const internalNotifications = useMemo(
    () => notifications.filter(n => n.source === 'internal'),
    [notifications]
  );

  return {
    notifications,
    pagination,
    loading,
    error,
    setError,
    unreadCount,
    unreadNotifications,
    schemeNotifications,
    internalNotifications,
    fetchNotifications,
    fetchUnified,
    fetchUnreadCount,
    markRead,
    markAllRead,
    fetchPMSuryaGhar,
  };
}
