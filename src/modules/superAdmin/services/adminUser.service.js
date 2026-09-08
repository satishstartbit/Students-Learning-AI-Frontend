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

export const updateUser = (id, payload) => api.patch(`/admin/users/${id}`, payload);

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
  api.post(`/admin/users/${parentId}/children`, payload);

// --- Relationships ---------------------------------------------------------

export function listRelationships(params = {}) {
  const query = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  );

  return api.get('/admin/relationships', { params: query });
}

/** @param {object} payload - { relationshipType, userId, relatedUserId } */
export const createRelationship = (payload) => api.post('/admin/relationships', payload);

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
  createRelationship,
  deleteRelationship,
};
