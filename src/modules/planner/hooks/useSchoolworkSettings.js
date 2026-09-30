import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { useApi } from '../../../hooks/useApi';
import { colorMapFrom, subjectKey } from '../../../components/subjects/subjectColor';
import planService from '../services/plan.service';

/**
 * "Customize My Growing Focus" for one student (GET/PATCH
 * /students/:id/schoolwork-settings): the view they land on, the display
 * switches, their subject colours, plus the Personal Activity Categories.
 *
 *   useSchoolworkSettings('me')      the signed-in student - read from
 *                                    SchoolworkSettingsProvider (StudentLayout)
 *                                    when it is there, so every screen shares
 *                                    one copy and a change shows everywhere
 *   useSchoolworkSettings(childId)   a parent's child - fetched here
 */

/** What the screens assume until the settings arrive (the server's defaults). */
export const DEFAULT_PREFERENCES = Object.freeze({
  defaultView: 'calendar',
  showTypeIcons: true,
  showEstimatedTime: true,
  showPersonalEvents: false,
  subjectColors: Object.freeze({}),
});

export const SchoolworkSettingsContext = createContext(null);

/** The store behind both the provider and a parent's standalone use. */
export function useSchoolworkSettingsStore(studentId, { enabled = true } = {}) {
  const api = useApi(planService.getSchoolworkSettings, { immediate: Boolean(enabled && studentId), args: [studentId] });
  const { run, setData } = api;
  const settings = api.data ?? null;

  const latest = useRef(null);
  useEffect(() => {
    if (api.data) latest.current = api.data;
  }, [api.data]);

  const colors = useMemo(() => colorMapFrom(settings?.subjects ?? []), [settings]);
  const categories = useMemo(() => new Map((settings?.categories ?? []).map((c) => [c.code, c])), [settings]);

  const colorOf = useCallback((subject) => (subject ? colors.get(subjectKey(subject)) ?? null : null), [colors]);
  const categoryOf = useCallback((code) => (code ? categories.get(code) ?? null : null), [categories]);

  const reload = useCallback(() => run(studentId).catch(() => {}), [run, studentId]);

  /** Saves a partial change. Switches and the view flip at once; rolled back if the save fails. */
  const update = useCallback(
    async (patch) => {
      const previous = latest.current;
      if (previous) {
        // Colours wait for the server (it resolves defaults and resets); the switches don't.
        const flags = Object.fromEntries(Object.entries(patch).filter(([key]) => key !== 'subjectColors'));
        const optimistic = { ...previous, preferences: { ...previous.preferences, ...flags } };
        latest.current = optimistic;
        setData(optimistic);
      }
      try {
        const { data } = await planService.updateSchoolworkSettings(studentId, patch);
        latest.current = data;
        setData(data);
        return data;
      } catch (error) {
        if (previous) {
          latest.current = previous;
          setData(previous);
        }
        throw error;
      }
    },
    [setData, studentId]
  );

  return useMemo(
    () => ({
      studentId,
      settings,
      preferences: settings?.preferences ?? DEFAULT_PREFERENCES,
      subjects: settings?.subjects ?? [],
      palette: settings?.palette ?? [],
      categories: settings?.categories ?? [],
      colorOf,
      categoryOf,
      isLoading: api.isLoading && !settings,
      loaded: Boolean(settings),
      error: api.error,
      update,
      reload,
    }),
    [studentId, settings, colorOf, categoryOf, api.isLoading, api.error, update, reload]
  );
}

export function useSchoolworkSettings(studentId = 'me') {
  const shared = useContext(SchoolworkSettingsContext);
  const useShared = Boolean(shared) && (studentId === 'me' || studentId === shared.studentId);
  const own = useSchoolworkSettingsStore(studentId, { enabled: !useShared });
  return useShared ? shared : own;
}

export default useSchoolworkSettings;
