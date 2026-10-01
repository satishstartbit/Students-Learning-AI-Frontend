import { useCallback, useMemo } from 'react';
import { useApi } from '../../hooks/useApi';
import lookupService from '../../services/lookup.service';
import { colorMapFrom, subjectKey } from './subjectColor';
import { SubjectColorContext } from './useSubjectColors';
import './subjectColors.css';

/**
 * The Super Admin's default subject colours (Subjects master, `extra.color`),
 * for the Parent and Teacher shells, so a subject looks the same to them as
 * it does to students. Students get their own provider with their choices on
 * top (planner SchoolworkSettingsProvider). If the list can't load, subjects
 * simply keep their neutral look.
 */
export function SubjectColorsProvider({ children }) {
  const lookup = useApi(lookupService.listLookup, { immediate: true, args: ['subjects'] });
  const map = useMemo(
    () => colorMapFrom((lookup.data ?? []).map((item) => ({ name: item.name, color: item.extra?.color }))),
    [lookup.data]
  );
  const colorOf = useCallback((subject) => (subject ? map.get(subjectKey(subject)) ?? null : null), [map]);
  const value = useMemo(() => ({ colorOf, ready: Boolean(lookup.data) }), [colorOf, lookup.data]);
  return <SubjectColorContext.Provider value={value}>{children}</SubjectColorContext.Provider>;
}

export default SubjectColorsProvider;
