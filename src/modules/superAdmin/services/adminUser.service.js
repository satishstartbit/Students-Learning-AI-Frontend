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

/** Emails the user a reset link; the admin never sees a password. */
export const resetUserPassword = (id) => api.post(`/admin/users/${id}/reset-password`);

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

/** @param {object} payload - { relationshipType, userId, relatedUserId } */
export const createRelationship = (payload) => api.post('/admin/relationships', payload);

/**
 * Assigns every teacher in teacherIds to every student in studentIds for one
 * subject/grade/academic year - the teacher <-> student many-to-many form.
 * @param {object} payload - { subject, grade, academicYearId, status, teacherIds, studentIds }
 */
export const bulkAssignRelationships = (payload) =>
  api.post('/admin/relationships/bulk-assign', payload);

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
  listRoles,
  listSubjects,
  listParentChildren,
  createParentChild,
  listRelationships,
  listRelationshipsGrouped,
  createRelationship,
  bulkAssignRelationships,
  updateRelationship,
  deleteRelationship,
};
