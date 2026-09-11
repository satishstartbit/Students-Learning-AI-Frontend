import api from '../../../utils/apiClient';

/** Regulation toolkit content and recommendations (Grade 6+ only - gated by TOOLKIT_READ). */

export const listCategories = () => api.get('/regulation-toolkit');

export const getRecommendation = (params = {}) => api.get('/regulation-toolkit/recommendation', { params });

export default { listCategories, getRecommendation };
