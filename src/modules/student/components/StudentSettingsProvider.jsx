import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { MotionConfig } from 'motion/react';
import { useApi } from '../../../hooks/useApi';
import { setThemeMode } from '../../../store/slices/themeSlice';
import { StudentSettingsContext } from '../hooks/useStudentSettings';
import studentSettingsService from '../services/studentSettings.service';

/**
 * Loads the Grade 6+ student's saved settings once and applies the ones that
 * change how the whole app looks, wherever they are set from:
 *
 *   appearance    Light / Dark / Match device -> the existing theme slice
 *                 (stamps data-theme on <html>)
 *   largerText    body.student-large-text  (theme/studentTheme.css)
 *   reduceMotion  body.student-reduce-motion + <MotionConfig reducedMotion>
 *
 * Classes go on <body> so portaled dialogs follow them too (same reasoning as
 * the student-theme class in StudentLayout). Saved on the server, so they
 * follow the student to any device.
 */
export function StudentSettingsProvider({ children }) {
  const dispatch = useDispatch();
  const api = useApi(studentSettingsService.getSettings, { immediate: true });
  const { run, setData } = api;
  const settings = api.data ?? null;

  // Latest copy, so update() can merge a patch into it and roll back on failure.
  const lastSaved = useRef(null);
  useEffect(() => {
    if (api.data) lastSaved.current = api.data;
  }, [api.data]);

  const appearance = settings?.appearance;
  const largerText = Boolean(settings?.largerText);
  const reduceMotion = Boolean(settings?.reduceMotion);

  useEffect(() => {
    if (appearance) dispatch(setThemeMode(appearance));
  }, [appearance, dispatch]);

  useEffect(() => {
    document.body.classList.toggle('student-large-text', largerText);
    document.body.classList.toggle('student-reduce-motion', reduceMotion);
    return () => {
      document.body.classList.remove('student-large-text', 'student-reduce-motion');
    };
  }, [largerText, reduceMotion]);

  const update = useCallback(
    async (patch) => {
      const previous = lastSaved.current;
      if (previous) {
        const optimistic = {
          ...previous,
          ...patch,
          reminders: { ...previous.reminders, ...(patch.reminders ?? {}) },
        };
        lastSaved.current = optimistic;
        setData(optimistic);
      }
      try {
        const { data } = await studentSettingsService.updateSettings(patch);
        lastSaved.current = data;
        setData(data);
        return data;
      } catch (err) {
        if (previous) {
          lastSaved.current = previous;
          setData(previous);
        }
        throw err;
      }
    },
    [setData]
  );

  const reload = useCallback(() => run().catch(() => {}), [run]);

  const value = useMemo(
    () => ({ settings, isLoading: api.isLoading && !api.data, error: api.data ? null : api.error, update, reload }),
    [settings, api.isLoading, api.data, api.error, update, reload]
  );

  return (
    <StudentSettingsContext.Provider value={value}>
      <MotionConfig reducedMotion={reduceMotion ? 'always' : 'user'}>{children}</MotionConfig>
    </StudentSettingsContext.Provider>
  );
}

export default StudentSettingsProvider;
