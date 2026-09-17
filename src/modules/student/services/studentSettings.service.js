import api from '../../../utils/apiClient';

/** A Grade 6+ student's own Settings page (backend: /student-settings). */

export const getSettings = () => api.get('/student-settings');

/** Any subset: { preferredName, defaultFocusMinutes, backgroundSound, appearance, largerText, reduceMotion, reminders: {...} }. */
export const updateSettings = (patch) => api.patch('/student-settings', patch);

export default { getSettings, updateSettings };
