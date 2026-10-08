import { useEffect } from 'react';
import { setActiveLocale, setActiveTimezone } from '../utils/locale';
import { useDeviceTimezone } from './useDeviceTimezone';

/**
 * Points every date/currency formatter (utils/date.js, utils/format.js) at
 * the signed-in user's own timezone/locale instead of the browser's, and
 * keeps that timezone in step with their device (useDeviceTimezone) - there
 * is no time zone picker anywhere.
 *
 * Called once by each signed-in shell - AuthenticatedLayout for most roles,
 * KidLayout for K-4 students - so whichever one is on screen sets it.
 */
export function useSyncUserLocale(user) {
  useDeviceTimezone(user);

  useEffect(() => {
    setActiveTimezone(user?.timezone);
    setActiveLocale(user?.locale);
  }, [user?.timezone, user?.locale]);
}

export default useSyncUserLocale;
