import { useCallback, useMemo } from 'react';
import { useApi } from '../../../hooks/useApi';
import checkInService from '../services/checkIn.service';
import { TodayCheckInContext } from '../hooks/useTodayCheckIn';

/** Loads today's check-in once and shares it - see hooks/useTodayCheckIn.js. */
export function TodayCheckInProvider({ children }) {
  const today = useApi(checkInService.getToday, { immediate: true });
  const { run, setData } = today;

  const save = useCallback(
    async (values) => {
      const { data } = await checkInService.submitCheckIn(values);
      setData({ date: data.checkIn.date, checkedIn: true, checkIn: data.checkIn });
      return data;
    },
    [setData]
  );

  const refresh = useCallback(() => run().catch(() => {}), [run]);

  const value = useMemo(
    () => ({
      checkedIn: Boolean(today.data?.checkedIn),
      checkIn: today.data?.checkIn ?? null,
      date: today.data?.date ?? null,
      // Only the first load blocks; a background refresh keeps showing what we had.
      isLoading: today.isLoading && !today.data,
      error: today.data ? null : today.error,
      save,
      refresh,
    }),
    [today.data, today.isLoading, today.error, save, refresh]
  );

  return <TodayCheckInContext.Provider value={value}>{children}</TodayCheckInContext.Provider>;
}

export default TodayCheckInProvider;
