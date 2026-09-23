import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useApi } from '../../hooks/useApi';
import { setThemeMode } from '../../store/slices/themeSlice';
import { applyAccent } from '../../theme';
import appSettingsService from '../../services/appSettings.service';
import { AppSettingsContext } from './useAppSettings';

/**
 * Loads the signed-in person's colour theme and appearance once, applies
 * them, and lets a picker change them.
 *
 *   accent      data-accent on <html>, so every --accent-* token follows, in
 *               light and dark alike
 *   appearance  Light / Dark / Match device -> the existing theme slice
 *               (data-theme on <html>)
 *
 * The student area has its own richer provider
 * (modules/student/components/StudentSettingsProvider.jsx) covering larger
 * text, reduce motion, note style and the rest; this is the two settings
 * every other role shares, so Teacher and Parent get the colour theme
 * without inheriting student-only behaviour. Both read the same stored value
 * per person - see the backend's services/appSettings.service.js.
 */
export function AppSettingsProvider({ children }) {
  const dispatch = useDispatch();
  const api = useApi(appSettingsService.getAppSettings, { immediate: true });
  const { run, setData } = api;
  const settings = api.data ?? null;

  // Latest copy, so update() can roll back to it if a save fails.
  const lastSaved = useRef(null);
  useEffect(() => {
    if (api.data) lastSaved.current = api.data;
  }, [api.data]);

  const appearance = settings?.appearance;
  const accent = settings?.accent;

  useEffect(() => {
    if (appearance) dispatch(setThemeMode(appearance));
  }, [appearance, dispatch]);

  useEffect(() => {
    if (!accent) return undefined;
    applyAccent(accent);
    return () => applyAccent(null);
  }, [accent]);

  const update = useCallback(
    async (patch) => {
      const previous = lastSaved.current;
      if (previous) {
        // Applied straight away so the colour changes as it is picked.
        const optimistic = { ...previous, ...patch };
        lastSaved.current = optimistic;
        setData(optimistic);
      }
      try {
        const { data } = await appSettingsService.updateAppSettings(patch);
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
    () => ({
      settings,
      accent: accent ?? null,
      appearance: appearance ?? null,
      isLoading: api.isLoading && !api.data,
      error: api.data ? null : api.error,
      update,
      reload,
    }),
    [settings, accent, appearance, api.isLoading, api.data, api.error, update, reload]
  );

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
}

export default AppSettingsProvider;
