import api from '../../../utils/apiClient';

/**
 * The signed-in student's own focus sessions and the step plan for the
 * assignment a session works on (backend: /focus). Student-only.
 */

export const getActiveSession = () => api.get('/focus/active');

export const getTodayMinutes = () => api.get('/focus/today-minutes');

/** `{ assignmentId?, stepId?, plannedMinutes, audioOption? }` */
export const startSession = (payload = {}) => api.post('/focus', payload);

export const pauseSession = (id) => api.patch(`/focus/${id}/pause`);

export const resumeSession = (id) => api.patch(`/focus/${id}/resume`);

/** `completeStep` also ticks the session's step done (and earns step points the first time). */
export const completeSession = (id, { completeStep = false } = {}) => api.patch(`/focus/${id}/complete`, { completeStep });

export const abandonSession = (id) => api.patch(`/focus/${id}/abandon`);

/** "+5 min" when the planned time runs out. */
export const extendSession = (id, minutes = 5) => api.patch(`/focus/${id}/extend`, { minutes });

/** Switch which step (of the same assignment) the session works on. */
export const setSessionStep = (id, stepId) => api.patch(`/focus/${id}/step`, { stepId });

export const listHistory = (params = {}) => api.get('/focus', { params });

// --- steps ---------------------------------------------------------------------

export const listSteps = (assignmentId) => api.get('/focus/steps', { params: { assignmentId } });

export const addStep = (assignmentId, { title, estimatedMinutes }) => api.post('/focus/steps', { assignmentId, title, estimatedMinutes });

export const updateStep = (id, patch) => api.patch(`/focus/steps/${id}`, patch);

export const deleteStep = (id) => api.delete(`/focus/steps/${id}`);

export const reorderSteps = (assignmentId, stepIds) => api.put('/focus/steps/order', { assignmentId, stepIds });

export default {
  getActiveSession,
  getTodayMinutes,
  startSession,
  pauseSession,
  resumeSession,
  completeSession,
  abandonSession,
  extendSession,
  setSessionStep,
  listHistory,
  listSteps,
  addStep,
  updateStep,
  deleteStep,
  reorderSteps,
};
