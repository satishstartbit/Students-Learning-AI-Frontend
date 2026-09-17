import api from '../../../utils/apiClient';

/** Reward dedicated masters: Reward Activities (points_rules), Student Rewards. */

function clean(params = {}) {
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined));
}

// --- reward activities -------------------------------------------------------

export const listActivities = (params = {}) => api.get('/admin/master/reward-activities', { params: clean(params) });
export const getActivity = (id) => api.get(`/admin/master/reward-activities/${id}`);
export const createActivity = (payload) => api.post('/admin/master/reward-activities', payload);
export const updateActivity = (id, payload) => api.patch(`/admin/master/reward-activities/${id}`, payload);
export const activateActivity = (id) => api.post(`/admin/master/reward-activities/${id}/activate`);
export const deactivateActivity = (id) => api.post(`/admin/master/reward-activities/${id}/deactivate`);
export const deleteActivity = (id) => api.delete(`/admin/master/reward-activities/${id}`);

// --- student rewards -----------------------------------------------------------

export const listRewards = (params = {}) => api.get('/admin/master/student-rewards', { params: clean(params) });
export const getReward = (id) => api.get(`/admin/master/student-rewards/${id}`);
/**
 * Plain JSON, or multipart when `imageFile` (an uploaded picture) is present -
 * every other field then travels as a string the backend validator converts back.
 */
function buildRewardBody({ imageFile, ...fields }) {
  if (!imageFile) return fields;
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, String(value));
  });
  formData.append('image', imageFile);
  return formData;
}

export const createReward = (payload) => api.post('/admin/master/student-rewards', buildRewardBody(payload));
export const updateReward = (id, payload) => api.patch(`/admin/master/student-rewards/${id}`, buildRewardBody(payload));
export const activateReward = (id) => api.post(`/admin/master/student-rewards/${id}/activate`);
export const deactivateReward = (id) => api.post(`/admin/master/student-rewards/${id}/deactivate`);
export const deleteReward = (id) => api.delete(`/admin/master/student-rewards/${id}`);

export default {
  listActivities,
  getActivity,
  createActivity,
  updateActivity,
  activateActivity,
  deactivateActivity,
  deleteActivity,
  listRewards,
  getReward,
  createReward,
  updateReward,
  activateReward,
  deactivateReward,
  deleteReward,
};
