import { useCallback, useEffect, useRef, useState } from 'react';
import notificationService from '../services/notification.service';
import { getErrorMessage } from '../../../utils/errorHandler';

const DEFAULT_POLL_MS = 30000;

/**
 * Unread count + recent notification list for the bell, shared by every
 * signed-in role.
 *
 * Polls the lightweight unread-count endpoint rather than the full list, so
 * the badge stays live without re-fetching message bodies on every tick.
 */
export function useNotifications({ pollIntervalMs = DEFAULT_POLL_MS, limit = 10 } = {}) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadUnreadCount = useCallback(async () => {
    try {
      const res = await notificationService.getUnreadCount();
      if (mountedRef.current) setUnreadCount(res?.data?.count ?? 0);
    } catch {
      // The bell just won't update this tick; the next poll retries.
    }
  }, []);

  const loadNotifications = useCallback(
    async (params = {}) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await notificationService.listNotifications({ limit, ...params });
        if (mountedRef.current) setNotifications(res?.data ?? []);
        return res;
      } catch (err) {
        if (mountedRef.current) setError(getErrorMessage(err));
        throw err;
      } finally {
        if (mountedRef.current) setIsLoading(false);
      }
    },
    [limit]
  );

  useEffect(() => {
    // First load one microtask later: loadNotifications flips isLoading
    // straight away, and setting state synchronously inside an effect body
    // cascades renders (react-hooks/set-state-in-effect).
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      loadUnreadCount();
      loadNotifications().catch(() => {});
    });

    const timer = pollIntervalMs ? setInterval(loadUnreadCount, pollIntervalMs) : null;
    return () => {
      active = false;
      if (timer) clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollIntervalMs]);

  const markRead = useCallback(async (id) => {
    try {
      await notificationService.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Let the next poll reconcile state.
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await notificationService.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // Let the next poll reconcile state.
    }
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    loadNotifications,
    markRead,
    markAllRead,
  };
}

export default useNotifications;
