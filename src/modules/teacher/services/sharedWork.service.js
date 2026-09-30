import api from '../../../utils/apiClient';

/** Students' own work shared with this teacher (backend: /teacher/shared-work, PDF Q15). */
export const listSharedWork = () => api.get('/teacher/shared-work');

/** Take it on: teacher-verified, but who added it and how stays as it was. */
export const adoptSharedWork = (shareId) => api.post(`/teacher/shared-work/${shareId}/adopt`);

export default { listSharedWork, adoptSharedWork };
