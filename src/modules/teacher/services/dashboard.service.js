import api from '../../../utils/apiClient';

/**
 * Teacher dashboard aggregate.
 *
 * A super admin may pass `?teacherId=` to view a specific teacher's
 * dashboard; a teacher never needs to (the backend scopes to the signed-in
 * user by default).
 */
export const getTeacherDashboard = (params = {}) => api.get('/dashboard', { params });

export default { getTeacherDashboard };
