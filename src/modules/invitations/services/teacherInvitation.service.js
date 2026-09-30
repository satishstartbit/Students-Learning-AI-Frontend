import api from '../../../utils/apiClient';

/**
 * Parent -> teacher invitations (backend: services/teacherInvitation.service.js).
 * A parent invites a teacher for one child and 1+ subjects; the teacher
 * accepts or declines; only an accepted invitation links them.
 */

// ---- the invitation link (works signed in or out)
export const getByToken = (token) => api.get(`/teacher-invitations/${encodeURIComponent(token)}`);
export const acceptByToken = (token) => api.post(`/teacher-invitations/${encodeURIComponent(token)}/accept`);
/**
 * Decline (PDF Q7): `reason` is PRIVATE feedback for Growing Focus - the
 * family never sees it; `sharedMessage` is what the teacher chooses to share.
 */
const declineBody = ({ reason, sharedMessage } = {}) => ({
  reason: reason?.trim() || null,
  sharedMessage: sharedMessage?.trim() || null,
});
export const declineByToken = (token, answer) =>
  api.post(`/teacher-invitations/${encodeURIComponent(token)}/decline`, declineBody(answer));

/**
 * Query string with repeated keys (subject=A&subject=B). axios would send an
 * array as subject[]=..., which the API doesn't read as `subject`.
 */
function query(params) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    [].concat(value ?? []).forEach((v) => {
      if (v !== '' && v !== null && v !== undefined) qs.append(key, v);
    });
  });
  return qs;
}

// ---- parent
/** Teachers matching every chosen subject + the grade, searchable by name/email: [{ id, firstName, lastName, email }]. */
export const teacherDirectory = ({ subjects, grade, search } = {}) =>
  api.get('/parent/teacher-directory', { params: query({ subject: subjects, grade, search, limit: 50 }) });
export const listForChild = (childId) => api.get(`/parent/children/${childId}/teacher-invitations`);
/** Either { teacherId } (picked) or { teacherName, teacherEmail } (not on the platform yet), plus subjects/grade. */
export const invite = (childId, payload) => api.post(`/parent/children/${childId}/teacher-invitations`, payload);
export const resend = (invitationId) => api.post(`/parent/teacher-invitations/${invitationId}/resend`);
export const cancel = (invitationId) => api.post(`/parent/teacher-invitations/${invitationId}/cancel`);

// ---- teacher (signed in)
export const listMine = (params = {}) => api.get('/teacher/invitations', { params });
export const accept = (invitationId) => api.post(`/teacher/invitations/${invitationId}/accept`);
export const decline = (invitationId, answer) => api.post(`/teacher/invitations/${invitationId}/decline`, declineBody(answer));

// ---- Super Admin
/** Every teacher chosen x every student chosen: { teacherIds, studentIds, subjects, grade, academicYearId }. */
export const adminInvite = (payload) => api.post('/admin/teacher-invitations', payload);
/** Active teachers who teach every chosen subject and the grade, searchable by name/email. */
export const adminTeachers = ({ subjects, grade, search } = {}) =>
  api.get('/admin/users', { params: query({ role: 'TEACHER', status: 'active', subject: subjects, grade, search, limit: 100 }) });
/** Active students in the grade, searchable by name/email. */
export const adminStudents = ({ grade, search } = {}) =>
  api.get('/admin/users', { params: query({ role: 'STUDENT', status: 'active', grade, search, limit: 100 }) });

export const adminList = (params = {}) =>
  api.get('/admin/teacher-invitations', {
    params: Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null)),
  });
export const adminResend = (invitationId) => api.post(`/admin/teacher-invitations/${invitationId}/resend`);
export const adminCancel = (invitationId) => api.post(`/admin/teacher-invitations/${invitationId}/cancel`);

export default {
  getByToken,
  acceptByToken,
  declineByToken,
  teacherDirectory,
  listForChild,
  invite,
  adminInvite,
  adminTeachers,
  adminStudents,
  resend,
  cancel,
  listMine,
  accept,
  decline,
  adminList,
  adminResend,
  adminCancel,
};
