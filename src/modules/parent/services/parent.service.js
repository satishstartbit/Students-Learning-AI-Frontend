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

/**
 * Overview page (/parent): each child today, the week's work, alerts and what
 * needs the parent - one aggregate, scoped to the signed-in parent.
 */
export const getDashboard = () => api.get('/parent/dashboard');

/**
 * Overview page (/parent) for the child picked in the sidebar: today's
 * check-in, tasks and focus, the latest alert, coming up, what needs the
 * parent, the week's check-ins and recent activity - that child only.
 */
export const getChildOverview = (childId) => api.get(`/parent/children/${childId}/overview`);

/**
 * One child's own notes, read-only - the same filters as the student's Notes
 * page (`range`, `from`/`to`, `status`, `search`, `page`, `limit`), plus
 * `generalOnly` for the Overview card (their Home board: `range: 'home'`).
 */
export const listChildNotes = (childId, params = {}) => api.get(`/parent/children/${childId}/notes`, { params });

/** Marks a child's check-in alert as seen by this parent (teachers keep their own). */
export const markAlertSeen = (childId, alertId) => api.post(`/parent/children/${childId}/alerts/${alertId}/seen`);

/** Progress page: one summary per child (today's check-in + task counts). */
export const getProgress = () => api.get('/parent/progress');

/** One child's full progress: tasks, today's check-in, recent check-ins. */
export const getChildProgress = (id) => api.get(`/parent/children/${id}/progress`);

/** Detaches by default; pass permanent: true to delete the account outright. */
export const removeChild = (id, { permanent = false } = {}) =>
  api.delete(`/parent/children/${id}`, { params: { permanent } });

/** Archive (PDF Q12): everything saved is kept and readable; the child no longer takes a seat. */
export const archiveChild = (id) => api.post(`/parent/children/${id}/archive`);

/** The same child back - same account and history - with a fresh plan. */
export const restoreChild = (id) => api.post(`/parent/children/${id}/restore`);

// --- family -----------------------------------------------------------------
// The family's parents and the plan's limits: { isAccountHolder, accountHolder,
// plan, children: { used, max, canAdd }, parents: { used, max, canAdd }, members }.
// A null `max` means the plan sets no limit.

export const getFamily = () => api.get('/parent/family');

/** Account holder only: creates the parent's account and links them to every child. */
export const addFamilyParent = (payload) => api.post('/parent/family/parents', payload);

/** Account holder only: the parent loses the family's children and plan; their account is kept. */
export const removeFamilyParent = (id) => api.delete(`/parent/family/parents/${id}`);

// --- teachers ---------------------------------------------------------------
// Teachers are connected by invitation (modules/invitations - the teacher has
// to accept); a parent can remove a connected teacher here.

export const removeTeacherAssignment = (childId, relationshipId) =>
  api.delete(`/parent/children/${childId}/teachers/${relationshipId}`);

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
 * dropdowns the Invite Teacher modal and the Super Admin forms use.
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
  getDashboard,
  getChildOverview,
  listChildNotes,
  markAlertSeen,
  getProgress,
  getChildProgress,
  removeChild,
  archiveChild,
  restoreChild,
  getFamily,
  addFamilyParent,
  removeFamilyParent,
  removeTeacherAssignment,
  listMasterOptions,
  masterOptionsFetcher,
  listSubjects,
  listGrades,
  listAcademicYears,
};
