import { useMemo } from 'react';
import { useApi } from '../../../hooks/useApi';
import lookupService from '../../../services/lookup.service';

/**
 * The Assignment Types master ("Homework", "Project", "Map work"...) as
 * select options, each with its icon - what a student or parent picks as the
 * kind of work they are adding. Values are names, like subjects.
 */
export function useWorkTypeOptions() {
  const api = useApi(lookupService.listWorkTypes, { immediate: true });
  const options = useMemo(
    () => (Array.isArray(api.data) ? api.data : []).map((t) => ({ value: t.name, label: `${t.icon ? `${t.icon} ` : ''}${t.name}` })),
    [api.data]
  );
  return { options, loading: api.isLoading && !api.data };
}

export default useWorkTypeOptions;
