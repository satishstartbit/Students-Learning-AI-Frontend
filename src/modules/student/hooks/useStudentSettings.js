import { createContext, useContext } from 'react';

/**
 * The Grade 6+ student's saved Settings (StudentSettingsProvider, mounted by
 * StudentLayout for the standard shell only).
 *
 *   settings   the server copy, or null until loaded / outside the provider
 *   update     (patch) => Promise - optimistic, rolls back and rethrows on failure
 *
 * Outside the provider (K-4, other roles) this returns inert defaults, so a
 * shared page can read it without checking the grade band first.
 */
export const StudentSettingsContext = createContext({
  settings: null,
  isLoading: false,
  error: null,
  update: async () => {},
  reload: async () => {},
});

export function useStudentSettings() {
  return useContext(StudentSettingsContext);
}

export default useStudentSettings;
