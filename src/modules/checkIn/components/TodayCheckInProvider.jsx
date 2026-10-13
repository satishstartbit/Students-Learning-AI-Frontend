import { useCallback, useMemo } from 'react';
import { useApi } from '../../../hooks/useApi';
import checkInService from '../services/checkIn.service';
import onboardingService from '../../onboarding/services/onboarding.service';
import { TodayCheckInContext } from '../hooks/useTodayCheckIn';

/**
 * Loads today's check-in once and shares it - see hooks/useTodayCheckIn.js.
 *
 * Also loads the active Emotional States (Master Management, admin-editable -
 * icon, uploaded icon image, background colour) once here rather than in
 * every screen that renders the mood picker, the same "one shared fetch" as
 * today's check-in itself.
 */
export function TodayCheckInProvider({ children }) {
  const today = useApi(checkInService.getToday, { immediate: true });
  const { run, setData } = today;

  const moodsApi = useApi(onboardingService.listLookup, { immediate: true, args: ['emotional_states'] });

  const moods = useMemo(
    () =>
      (moodsApi.data ?? []).map((item) => ({
        code: item.code,
        name: item.name,
        icon: item.icon ?? null,
        iconUrl: item.iconUrl ?? null,
        backgroundColor: item.extra?.background_color ?? null,
      })),
    [moodsApi.data]
  );

  const save = useCallback(
    async (values) => {
      const { data } = await checkInService.submitCheckIn(values);
      setData((prev) => ({ ...(prev ?? {}), date: data.checkIn.date, checkedIn: true, checkIn: data.checkIn, skipped: false }));
      return data;
    },
    [setData]
  );

  // An older student chose "Continue to my work": recorded, and not asked again today.
  const skip = useCallback(async () => {
    const { data } = await checkInService.skipCheckIn();
    setData(data);
    return data;
  }, [setData]);

  const refresh = useCallback(() => run().catch(() => {}), [run]);

  const value = useMemo(
    () => ({
      checkedIn: Boolean(today.data?.checkedIn),
      checkIn: today.data?.checkIn ?? null,
      date: today.data?.date ?? null,
      // Older students: skipped today, the "before you start" words, and the invite to come back.
      skipped: Boolean(today.data?.skipped),
      skipPrompt: today.data?.skipPrompt ?? null,
      laterInvite: today.data?.laterInvite ?? null,
      skip,
      // Only the first load blocks; a background refresh keeps showing what we had.
      isLoading: today.isLoading && !today.data,
      error: today.data ? null : today.error,
      save,
      refresh,
      moods,
      moodsLoading: moodsApi.isLoading && !moodsApi.data,
    }),
    [today.data, today.isLoading, today.error, save, skip, refresh, moods, moodsApi.isLoading, moodsApi.data]
  );

  return <TodayCheckInContext.Provider value={value}>{children}</TodayCheckInContext.Provider>;
}

export default TodayCheckInProvider;
