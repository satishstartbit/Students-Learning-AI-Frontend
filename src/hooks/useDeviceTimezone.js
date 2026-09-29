import { useEffect, useRef } from 'react';
import { updateMyTimezone } from '../modules/auth/services/auth.service';
import { detectBrowserTimezone } from '../utils/locale';
import { useAuth } from './useAuth';

/**
 * Keeps the signed-in user's time zone in step with their device, so nobody
 * is ever asked for one. The device's zone is matched to a Canadian zone
 * (utils/canadianTimezone.js; the app default when the device is set outside
 * North America). When it differs from the stored one, it is saved
 * (PATCH /auth/me/timezone, any role) and the session's user updated, which
 * re-points every date display (useSyncUserLocale).
 *
 * One attempt per user + zone per page load: a failure (offline) is retried
 * on the next visit, never in a loop.
 */
export function useDeviceTimezone(user) {
  const { setUser } = useAuth();
  const latestUser = useRef(user);
  const attempted = useRef(null);

  useEffect(() => {
    latestUser.current = user;
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    const device = detectBrowserTimezone();
    const key = `${user.id}:${device}`;
    if (user.timezone === device || attempted.current === key) return;
    attempted.current = key;

    updateMyTimezone(device)
      .then(() => {
        const current = latestUser.current;
        if (current?.id === user.id) setUser({ ...current, timezone: device });
      })
      .catch(() => {});
  }, [user?.id, user?.timezone, setUser]);
}

export default useDeviceTimezone;
