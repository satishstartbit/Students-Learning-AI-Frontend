import api from '../../../utils/apiClient';

/**
 * Super Admin's assisted teacher-student connections (backend:
 * /admin/teacher-connections). The parent's invitation is the normal path;
 * these are for when a family needs help, so every write carries a `reason`
 * that the backend records in the audit log - and refuses without.
 */

const clean = (params) => Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null));

/** One entry per teacher, student and academic year, with every subject. */
export const listConnections = (params = {}) => api.get('/admin/teacher-connections', { params: clean(params) });

/** { teacherId, studentId, subjects, grade, academicYearId, reason } */
export const createConnection = (payload) => api.post('/admin/teacher-connections', payload);

/** { teacherId, studentId, academicYearId, subjects?, grade?, newAcademicYearId?, reason } */
export const updateConnection = (payload) => api.patch('/admin/teacher-connections', payload);

/** { studentId, fromTeacherId, toTeacherId, academicYearId, subjects?, grade?, newAcademicYearId?, reason } */
export const moveConnection = (payload) => api.post('/admin/teacher-connections/move', payload);

/** { teacherId, studentId, academicYearId, reason } */
export const removeConnection = (payload) => api.post('/admin/teacher-connections/remove', payload);

// --- parents' requests: reviewed here before any teacher is emailed

/** Parents' requests waiting for review. */
export const listRequests = (params = {}) =>
  api.get('/admin/teacher-invitations', { params: clean({ status: 'awaiting_approval', limit: 100, ...params }) });

/** Approve a parent's request: the client-written invitation is emailed to the teacher. */
export const approveRequest = (invitationId) => api.post(`/admin/teacher-invitations/${invitationId}/approve`);

/** Turn a parent's request down; `reason` is the note the family sees. */
export const rejectRequest = (invitationId, reason) =>
  api.post(`/admin/teacher-invitations/${invitationId}/reject`, { reason });

/** Accept a SENT invitation on the teacher's behalf - assistance only, with a reason. */
export const acceptForTeacher = (invitationId, reason) =>
  api.post(`/admin/teacher-invitations/${invitationId}/accept-for-teacher`, { reason });

/** Every assisted change, with who made it and why. */
export const listAssistedChanges = (params = {}) =>
  api.get('/admin/teacher-connections/changes', { params: clean(params) });

// --- client-written email wording

export const listEditableEmails = () => api.get('/admin/email-copy');
export const getEmailCopy = (name) => api.get(`/admin/email-copy/${name}`);
export const saveEmailCopy = (name, content) => api.put(`/admin/email-copy/${name}`, { content });
export const resetEmailCopy = (name) => api.delete(`/admin/email-copy/${name}`);
export const previewEmailCopy = (name, content) => api.post(`/admin/email-copy/${name}/preview`, { content });

export default {
  listConnections,
  createConnection,
  updateConnection,
  moveConnection,
  removeConnection,
  listRequests,
  approveRequest,
  rejectRequest,
  acceptForTeacher,
  listAssistedChanges,
  listEditableEmails,
  getEmailCopy,
  saveEmailCopy,
  resetEmailCopy,
  previewEmailCopy,
};
