import api from '../../../utils/apiClient';

/** First-login onboarding (backend: /onboarding) - always the signed-in user's own. */

/** { completed, completedAt, answers, gradeLocked? } for the current student or parent. */
export const getMyOnboarding = () => api.get('/onboarding/me');

export const saveStudentOnboarding = (payload) => api.put('/onboarding/student', payload);

export const saveParentOnboarding = (payload) => api.put('/onboarding/parent', payload);

/** Active Master Management items for one whitelisted type (subjects, focus_duration, ...). */
export const listLookup = (type) => api.get(`/onboarding/lookups/${type}`);

export default { getMyOnboarding, saveStudentOnboarding, saveParentOnboarding, listLookup };
