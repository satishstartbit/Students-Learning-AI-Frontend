import api from '../../../utils/apiClient';

/**
 * Parent self-service API calls - the parent's own "My Children" panel.
 *
 * Every call is scoped to the signed-in parent by the backend session; none
 * of these take a parentId, so a parent can never address another family's
 * children by passing a different id.
 */

function dropEmpty(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  );
}

/**
 * Builds the request body for add/update child.
 *
 * When a photo is attached, the request must be multipart/form-data - the
 * nested `profile` object travels as a JSON string field, which the backend
 * parses back into an object before validation (see
 * middlewares/parseMultipartJson.middleware.js). Without a photo, a plain
 * JSON object is sent, matching every other endpoint in the app.
 */
function buildChildBody({ profile, photoFile, ...rest }) {
  if (!photoFile) return { ...rest, profile };

  const formData = new FormData();
  Object.entries(rest).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, value);
  });
  formData.append('profile', JSON.stringify(profile ?? {}));
  formData.append('profileImage', photoFile);
  return formData;
}

export const listChildren = (params = {}) => api.get('/parent/children', { params: dropEmpty(params) });

export const getChild = (id) => api.get(`/parent/children/${id}`);

export const addChild = (payload) => api.post('/parent/children', buildChildBody(payload));

export const updateChild = (id, payload) => api.patch(`/parent/children/${id}`, buildChildBody(payload));

/**
 * Sets a new password directly for a child's account - a deliberate
 * exception to how every other password change in this app works (current-
 * password confirmation, or an emailed reset link); see
 * services/parent.service.js#setChildPassword on the backend for why.
 * Signs the child out of every session immediately.
 */
export const setChildPassword = (id, { password, confirmPassword }) =>
  api.patch(`/parent/children/${id}/password`, { password, confirmPassword });

/** Detaches by default; pass permanent: true to delete the account outright. */
export const removeChild = (id, { permanent = false } = {}) =>
  api.delete(`/parent/children/${id}`, { params: { permanent } });

// --- teacher assignment -----------------------------------------------------

/** @param {object} payload - { teacherIds, subject, grade, academicYearId, status } */
export const assignTeachers = (childId, payload) =>
  api.post(`/parent/children/${childId}/teachers`, payload);

export const updateTeacherAssignment = (childId, relationshipId, payload) =>
  api.patch(`/parent/children/${childId}/teachers/${relationshipId}`, payload);

export const removeTeacherAssignment = (childId, relationshipId) =>
  api.delete(`/parent/children/${childId}/teachers/${relationshipId}`);

/** Teacher directory for the assign-teacher picker. */
export const listTeachers = (params = {}) => api.get('/parent/teachers', { params: dropEmpty(params) });

// --- lookups (read-only, parent-safe master data) ---------------------------

/**
 * Whitelisted master data (subjects, grade_levels, strength_areas,
 * challenge_areas, interest_categories) for the family-portal forms. The
 * backend rejects any other `type`.
 */
export const listMasterOptions = (type, params = {}) =>
  api.get(`/parent/lookups/master/${type}`, { params: dropEmpty(params) });

/**
 * Master options shaped for RoleProfileFields' `lookupFetcher` prop
 * ({ value, label }[]). Add Child / Edit Child pass this so their Grade /
 * Subjects / Strengths / Challenges / Interests fields use the same
 * dropdowns the Assign Teacher modal and the Super Admin forms use.
 */
export const masterOptionsFetcher = (type) =>
  listMasterOptions(type).then((res) =>
    (res?.data ?? []).map((item) => ({ value: item.name, label: item.name }))
  );

export const listSubjects = (params = {}) => listMasterOptions('subjects', params);

export const listGrades = (params = {}) => listMasterOptions('grade_levels', params);

export const listAcademicYears = (params = {}) =>
  api.get('/parent/lookups/academic-years', { params: dropEmpty(params) });

export default {
  listChildren,
  getChild,
  addChild,
  updateChild,
  setChildPassword,
  removeChild,
  assignTeachers,
  updateTeacherAssignment,
  removeTeacherAssignment,
  listTeachers,
  listMasterOptions,
  masterOptionsFetcher,
  listSubjects,
  listGrades,
  listAcademicYears,
};
