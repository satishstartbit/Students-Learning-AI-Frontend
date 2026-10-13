import api from '../../../utils/apiClient';

/**
 * Super Admin user-management API calls.
 *
 * Listing is server-side paginated, filtered and searched - the browser never
 * receives the full user table.
 */

/** @param {object} params - { page, limit, search, role, status, emailVerified, sortBy, sortOrder } */
export function listUsers(params = {}) {
  // Drop empty filters so they are not sent as blank query values.
  const query = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  );

  return api.get('/admin/users', { params: query });
}

export const getUser = (id) => api.get(`/admin/users/${id}`);

export const createUser = (payload) => api.post('/admin/users', payload);

/**
 * Builds the request body for endpoints that may carry a profile photo.
 * With a photo, the request must be multipart/form-data - `profile` travels
 * as a JSON string field that the backend parses back into an object (see
 * middlewares/parseMultipartJson.middleware.js). Without one, plain JSON.
 */
function buildUserBody({ profile, photoFile, ...rest }) {
  if (!photoFile) return { ...rest, profile };

  const formData = new FormData();
  Object.entries(rest).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, value);
  });
  formData.append('profile', JSON.stringify(profile ?? {}));
  formData.append('profileImage', photoFile);
  return formData;
}

export const updateUser = (id, payload) => api.patch(`/admin/users/${id}`, buildUserBody(payload));

export const suspendUser = (id) => api.post(`/admin/users/${id}/suspend`);
export const reactivateUser = (id) => api.post(`/admin/users/${id}/reactivate`);

/** Permanent and irreversible. */
export const deleteUser = (id) => api.delete(`/admin/users/${id}`);

/** Emails the user a reset link; the admin never sees a password. Not for students (no email). */
export const resetUserPassword = (id) => api.post(`/admin/users/${id}/reset-password`);

/** Students only: they have no email, so the password is set directly. Signs them out everywhere. */
export const setStudentPassword = (id, { password, confirmPassword }) =>
  api.patch(`/admin/users/${id}/password`, { password, confirmPassword });

/** Teacher/parent whose code never arrived: a fresh code + link. `data.emailSent` says if it went out. */
export const resendVerification = (id) => api.post(`/admin/users/${id}/resend-verification`);

/** Teacher/parent: the Super Admin vouches for the address (audited). */
export const markEmailVerified = (id) => api.post(`/admin/users/${id}/mark-email-verified`);

export const listRoles = () => api.get('/admin/roles');

/**
 * Subjects available to filter teachers by.
 *
 * Derived server-side from teacher profiles - this schema has no subjects
 * table, so the list reflects the subjects teachers actually record.
 */
export const listSubjects = () => api.get('/admin/subjects');

// --- A parent's children ---------------------------------------------------

/** Children of one parent, managed from that parent's record. */
export const listParentChildren = (parentId, params = {}) =>
  api.get(`/admin/users/${parentId}/children`, { params });

/**
 * Creates a student account and its parent_child link together.
 * The API forces the role to STUDENT and takes the parent from the URL.
 */
export const createParentChild = (parentId, payload) =>
  api.post(`/admin/users/${parentId}/children`, buildUserBody(payload));

// --- A parent's family (same rules as the parent's My Children) -------------

/** { isAccountHolder, accountHolder, plan, planInForce, subscription, children, parents, members } */
export const getParentFamily = (parentId) => api.get(`/admin/users/${parentId}/family`);

/** Another parent in the family (needs a plan in force with a free place). */
export const addFamilyParent = (parentId, payload) => api.post(`/admin/users/${parentId}/family/parents`, payload);

/** Off: no place on the plan and no access (always allowed). On: needs a free place. */
export const setFamilyParentActive = (parentId, memberId, active) =>
  api.post(`/admin/users/${parentId}/family/parents/${memberId}/${active ? 'activate' : 'deactivate'}`);

/** Off: kept with all their history, no place on the plan. On: needs a free place. */
export const setChildActive = (parentId, childId, active) =>
  api.post(`/admin/users/${parentId}/children/${childId}/${active ? 'activate' : 'deactivate'}`);

// --- Relationships ---------------------------------------------------------

export function listRelationships(params = {}) {
  const query = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  );

  return api.get('/admin/relationships', { params: query });
}

/** The same filtered set, grouped by teacher or student for the grouped views. */
export function listRelationshipsGrouped(params = {}) {
  const query = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  );

  return api.get('/admin/relationships/grouped', { params: query });
}

/** @param {object} payload - { relationshipType: 'parent_child', userId, relatedUserId } - teachers are linked by invitation. */
export const createRelationship = (payload) => api.post('/admin/relationships', payload);

// Teacher <-> student links are made only by invitation
// (modules/invitations - teacherInvitation.service.js#adminInvite).

/** Status is the only editable field once a relationship exists. */
export const updateRelationship = (id, payload) => api.patch(`/admin/relationships/${id}`, payload);

export const deleteRelationship = (id) => api.delete(`/admin/relationships/${id}`);

export default {
  listUsers,
  getUser,
  createUser,
  updateUser,
  suspendUser,
  reactivateUser,
  deleteUser,
  resetUserPassword,
  setStudentPassword,
  resendVerification,
  markEmailVerified,
  listRoles,
  listSubjects,
  listParentChildren,
  createParentChild,
  getParentFamily,
  addFamilyParent,
  setFamilyParentActive,
  setChildActive,
  listRelationships,
  listRelationshipsGrouped,
  createRelationship,
  updateRelationship,
  deleteRelationship,
};
