import api from '../../../utils/apiClient';

/** Regulation toolkit content and suggestions (students only - gated by TOOLKIT_READ). */

export const listCategories = () => api.get('/regulation-toolkit');

/**
 * Suggestions matched to the student's check-in today, read server-side:
 * { checkedIn, checkIn, categories, suggestions, tool }.
 */
export const getRecommendation = () => api.get('/regulation-toolkit/recommendation');

export default { listCategories, getRecommendation };
