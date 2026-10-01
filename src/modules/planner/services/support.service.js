import api from '../../../utils/apiClient';

/**
 * Help when work gets hard (backend: /students/:studentId/support/*,
 * services/support/support.service.js), "No longer required", and sharing
 * own work with a teacher.
 */
const base = (studentId = 'me') => `/students/${encodeURIComponent(studentId)}`;

/** Quick help buttons and wording (admin setting "Help when work gets hard"). */
export const getOptions = (studentId) => api.get(`${base(studentId)}/support/options`);

/** Records what's making it hard; returns ideas ranked for this student. */
export const reportBarrier = (studentId, { reasonCodes, assignmentId, stepId, shared = true }) =>
  api.post(`${base(studentId)}/support/barriers`, { reasonCodes, assignmentId, stepId, shared });

/** Does a quick action or an idea's action. */
export const act = (studentId, values) => api.post(`${base(studentId)}/support/actions`, values);

export const recordOutcome = (studentId, eventId, outcome) => api.patch(`${base(studentId)}/support/events/${eventId}/outcome`, { outcome });

export const pendingOutcomes = (studentId) => api.get(`${base(studentId)}/support/pending`);

/** Counts only - for a parent. */
export const getSummary = (studentId) => api.get(`${base(studentId)}/support/summary`);

export const withdrawWork = (studentId, id) => api.post(`${base(studentId)}/work/${id}/withdraw`);

export const restoreWork = (studentId, id) => api.post(`${base(studentId)}/work/${id}/restore`);

export const listTeachers = (studentId) => api.get(`${base(studentId)}/teachers`);

export const listShares = (studentId, workId) => api.get(`${base(studentId)}/work/${workId}/shares`);

export const shareWork = (studentId, workId, { teacherId, note }) => api.post(`${base(studentId)}/work/${workId}/shares`, { teacherId, note });

export const revokeShare = (studentId, workId, shareId) => api.delete(`${base(studentId)}/work/${workId}/shares/${shareId}`);

export default {
  getOptions,
  reportBarrier,
  act,
  recordOutcome,
  pendingOutcomes,
  getSummary,
  withdrawWork,
  restoreWork,
  listTeachers,
  listShares,
  shareWork,
  revokeShare,
};
