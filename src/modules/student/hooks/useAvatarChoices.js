import { useApi } from '../../../hooks/useApi';
import studentSettingsService from '../services/studentSettings.service';

/**
 * The avatars a student can pick from on "Make it yours" - the active rows of
 * the Avatars master a Super Admin manages (backend: /student-settings/avatars),
 * lowest display order first. Shared by the K-5 and Grade 6+ versions of the
 * page; the student's own choice lives in useStudentSettings().
 */
export function useAvatarChoices() {
  const list = useApi(studentSettingsService.listAvatars, { immediate: true });

  return {
    items: Array.isArray(list.data) ? list.data : [],
    isLoading: list.isLoading && !list.data,
    error: list.error,
    reload: () => list.run().catch(() => {}),
  };
}

export default useAvatarChoices;
