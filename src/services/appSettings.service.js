import api from '../utils/apiClient';

/**
 * Colour theme and appearance for whoever is signed in (backend:
 * /app-settings) - the same two settings for a teacher, parent or student.
 *
 * For a student this is the very same stored value their "Make it yours" page
 * writes, so the two can never disagree; the backend decides which store the
 * signed-in role uses.
 */
export const getAppSettings = () => api.get('/app-settings');

export const updateAppSettings = (patch) => api.patch('/app-settings', patch);

export default { getAppSettings, updateAppSettings };
