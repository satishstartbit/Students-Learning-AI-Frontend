import api from '../../../utils/apiClient';

/** The signed-in student's own focus timer sessions (Grade 6+ only - gated by FOCUS_READ/FOCUS_CREATE). */

export const getActiveSession = () => api.get('/focus/active');

export const getTodayMinutes = () => api.get('/focus/today-minutes');

export const startSession = (payload = {}) => api.post('/focus', payload);

export const pauseSession = (id) => api.patch(`/focus/${id}/pause`);

export const resumeSession = (id) => api.patch(`/focus/${id}/resume`);

export const completeSession = (id) => api.patch(`/focus/${id}/complete`);

export const abandonSession = (id) => api.patch(`/focus/${id}/abandon`);

export const listHistory = (params = {}) => api.get('/focus', { params });

export default {
  getActiveSession,
  getTodayMinutes,
  startSession,
  pauseSession,
  resumeSession,
  completeSession,
  abandonSession,
  listHistory,
};
