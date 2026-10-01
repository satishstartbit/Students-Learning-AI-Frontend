import { useMemo } from 'react';
import { SubjectColorContext } from '../../../components/subjects/useSubjectColors';
import '../../../components/subjects/subjectColors.css';
import { SchoolworkSettingsContext, useSchoolworkSettingsStore } from '../hooks/useSchoolworkSettings';

/**
 * The signed-in student's schoolwork settings for their whole shell (both
 * bands, mounted in StudentLayout): one copy shared by the Plan / My week
 * page, Settings, Home and every subject chip, so choosing a subject colour
 * or a default view shows everywhere at once.
 *
 * Also answers the app-wide subject colour question (useSubjectColors) with
 * the student's own colours on top of the admin defaults.
 */
export function SchoolworkSettingsProvider({ enabled = true, children }) {
  const store = useSchoolworkSettingsStore('me', { enabled });
  const { colorOf, loaded } = store;
  const colors = useMemo(() => ({ colorOf, ready: loaded }), [colorOf, loaded]);
  return (
    <SchoolworkSettingsContext.Provider value={store}>
      <SubjectColorContext.Provider value={colors}>{children}</SubjectColorContext.Provider>
    </SchoolworkSettingsContext.Provider>
  );
}

export default SchoolworkSettingsProvider;
