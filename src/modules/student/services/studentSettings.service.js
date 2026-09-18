import api from '../../../utils/apiClient';

/** A student's own Settings and "Make it yours" choices (backend: /student-settings). */

export const getSettings = () => api.get('/student-settings');

/**
 * Any subset: { preferredName, defaultFocusMinutes, backgroundSound, appearance,
 * largerText, reduceMotion, accent, noteStyle, cardStyle, avatarId, reminders: {...} }.
 */
export const updateSettings = (patch) => api.patch('/student-settings', patch);

/** The avatars a student can pick from - the active rows of the Avatars master. */
export const listAvatars = () => api.get('/student-settings/avatars');

export default { getSettings, updateSettings, listAvatars };
