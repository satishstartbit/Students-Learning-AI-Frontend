import api from '../../../utils/apiClient';

/** Super Admin dashboard: `GET /admin/dashboard?days=7|30|90|365` (backend services/adminDashboard.service.js). */
export const getDashboard = (days = 30) => api.get('/admin/dashboard', { params: { days } });

export default { getDashboard };
