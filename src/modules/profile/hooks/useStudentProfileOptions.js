import { useApi } from '../../../hooks/useApi';
import api from '../../../utils/apiClient';

async function load(studentId) {
  const result = await api.get(`/students/${studentId}/profile-options`);
  return { data: { studentId, selections: result.data } };
}

/** Never reuse the previous child's choices while the next child is loading. */
export function useStudentProfileOptions(studentId = 'me', enabled = true) {
  const id = studentId || 'me';
  const request = useApi(load, { immediate: enabled, args: [id] });
  const current = request.data?.studentId === id;
  const selections = current ? request.data.selections : null;
  return {
    selections,
    subjectOptions: (selections?.subjects ?? []).map((item) => ({ value: item.name, label: item.name })),
    loading: enabled && (!current || request.isLoading) && !request.error,
    error: request.error,
  };
}
