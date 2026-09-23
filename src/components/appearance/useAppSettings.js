import { createContext, useContext } from 'react';

/**
 * The signed-in person's colour theme and appearance, shared by whatever the
 * shell wraps - see AppSettingsProvider.jsx, which loads and applies them.
 *
 *   accent      the chosen accent family ("ocean", "sunset", ...)
 *   appearance  'system' | 'light' | 'dark'
 *   update      (patch) => Promise - optimistic, rolled back if the save fails
 *   reload      re-read from the server
 *
 * Kept apart from the provider for the same reason
 * modules/student/hooks/useStudentSettings.js is: a file that exports a
 * component and a hook breaks fast refresh.
 */
export const AppSettingsContext = createContext(null);

export function useAppSettings() {
  const value = useContext(AppSettingsContext);
  if (!value) throw new Error('useAppSettings() must be used inside <AppSettingsProvider>');
  return value;
}

export default useAppSettings;
