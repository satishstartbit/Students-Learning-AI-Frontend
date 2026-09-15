import api from '../../../utils/apiClient';

/** Daily check-ins (backend: /check-ins). */

/** The signed-in student's own status today: { date, checkedIn, checkIn }. */
export const getToday = () => api.get('/check-ins/today');

/** Creates today's check-in, or updates it. @param {{ mood, energy, availableMinutes? }} payload */
export const submitCheckIn = (payload) => api.post('/check-ins', payload);

/** @param {{ studentId?, from?, to?, page?, limit? }} params */
export const getHistory = (params = {}) => api.get('/check-ins/history', { params });

export default { getToday, submitCheckIn, getHistory };
