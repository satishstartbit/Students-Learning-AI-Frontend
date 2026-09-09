import api from '../../../utils/apiClient';

/** Combined Master Management dashboard summary: every master as one list. */
export const getSummary = () => api.get('/admin/master/dashboard-summary');

export default { getSummary };
