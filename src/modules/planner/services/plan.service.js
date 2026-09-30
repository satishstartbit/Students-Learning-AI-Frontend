import api from '../../../utils/apiClient';

/**
 * A student's plan (backend: /students/:studentId/*, routes/planning.routes.js).
 * `studentId` is 'me' for the signed-in student, or a child's id for their
 * parent. Teachers have no access.
 */
const base = (studentId = 'me') => `/students/${encodeURIComponent(studentId)}`;

/** Blocks, next actions, priorities, conflicts. `params`: { from, to } as 'YYYY-MM-DD'. */
export const getPlan = (studentId, params = {}) => api.get(`${base(studentId)}/plan`, { params });

export const replan = (studentId) => api.post(`${base(studentId)}/replan`);

/** Every open piece of work, all sources, with provenance and progress. */
export const listWork = (studentId, params = {}) => api.get(`${base(studentId)}/work`, { params });

export const getAvailability = (studentId) => api.get(`${base(studentId)}/availability`);

/** Replaces the weekly study times: [{ weekday 1-7 (Mon-Sun), start 'HH:MM', end 'HH:MM' }]. */
export const setWindows = (studentId, windows) => api.put(`${base(studentId)}/availability`, { windows });

export const addCommitment = (studentId, values) => api.post(`${base(studentId)}/commitments`, values);

export const updateCommitment = (studentId, id, values) => api.patch(`${base(studentId)}/commitments/${id}`, values);

export const deleteCommitment = (studentId, id) => api.delete(`${base(studentId)}/commitments/${id}`);

/** Move / resize / pin one study time. `expectedVersion` refuses a stale edit. */
export const updateBlock = (studentId, id, values) => api.patch(`${base(studentId)}/blocks/${id}`, values);

export default {
  getPlan,
  replan,
  listWork,
  getAvailability,
  setWindows,
  addCommitment,
  updateCommitment,
  deleteCommitment,
  updateBlock,
};
