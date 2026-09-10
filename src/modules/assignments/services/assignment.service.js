import api from '../../../utils/apiClient';

/**
 * Assignment Management API calls.
 *
 * One collection serves both teacher and student - the backend branches on
 * the signed-in user's role, so these are thin wrappers over `/assignments*`
 * with no role parameter, matching the pattern in adminUser.service.js.
 */

function dropEmpty(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  );
}

/**
 * Teacher: { page, limit, sortBy, sortOrder, search, subject, grade, status, dueBefore, dueAfter }
 * Student: { page, limit, status, subject }
 */
export const listAssignments = (params = {}) => api.get('/assignments', { params: dropEmpty(params) });

export const getAssignment = (id) => api.get(`/assignments/${id}`);

/** @param {object} payload - { title, description, subject, grade, academicYearId, startDate, dueDate, estimatedMinutes, status, studentIds } */
export const createAssignment = (payload) => api.post('/assignments', payload);

export const updateAssignment = (id, payload) => api.patch(`/assignments/${id}`, payload);

export const publishAssignment = (id) => api.patch(`/assignments/${id}/publish`);

export const archiveAssignment = (id) => api.patch(`/assignments/${id}/archive`);

/** Only a draft assignment may be deleted. */
export const deleteAssignment = (id) => api.delete(`/assignments/${id}`);

/**
 * Multipart upload, field name `files` (up to 10). Teacher uploads become
 * resource attachments; student uploads become their own submission's
 * attachments (student must have started the assignment first).
 */
export const addAssignmentFiles = (id, formData, options = {}) =>
  api.upload(`/assignments/${id}/files`, formData, options);

/** Teacher only, resource files only. */
export const removeAssignmentFile = (id, fileId) => api.delete(`/assignments/${id}/files/${fileId}`);

export const startAssignment = (id) => api.patch(`/assignments/${id}/start`);

export const saveAssignmentProgress = (id, payload) => api.put(`/assignments/${id}/progress`, payload);

export const submitAssignment = (id, payload = {}) => api.post(`/assignments/${id}/submit`, payload);

/** @param {object} payload - { decision: 'completed'|'returned', score, feedback } */
export const reviewSubmission = (submissionId, payload) =>
  api.patch(`/assignments/submissions/${submissionId}/review`, payload);

export default {
  listAssignments,
  getAssignment,
  createAssignment,
  updateAssignment,
  publishAssignment,
  archiveAssignment,
  deleteAssignment,
  addAssignmentFiles,
  removeAssignmentFile,
  startAssignment,
  saveAssignmentProgress,
  submitAssignment,
  reviewSubmission,
};
