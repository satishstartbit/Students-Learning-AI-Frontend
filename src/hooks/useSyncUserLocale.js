import { useEffect } from 'react';
import { setActiveLocale, setActiveTimezone } from '../utils/locale';

/**
 * Points every date/currency formatter (utils/date.js, utils/format.js) at
 * the signed-in user's own timezone/locale instead of the browser's.
 *
 * Called once by each signed-in shell - AuthenticatedLayout for most roles,
 * KidLayout for K-5 students - so whichever one is on screen sets it.
 */
export function useSyncUserLocale(user) {
  useEffect(() => {
    setActiveTimezone(user?.timezone);
    setActiveLocale(user?.locale);
  }, [user?.timezone, user?.locale]);
}

export default useSyncUserLocale;
