import api from '../../../utils/apiClient';

/** Regulation Toolkit dedicated master: Regulation Activities. */

function clean(params = {}) {
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined));
}

export const listActivities = (params = {}) => api.get('/admin/master/regulation-activities', { params: clean(params) });
export const getActivity = (id) => api.get(`/admin/master/regulation-activities/${id}`);
export const createActivity = (payload) => api.post('/admin/master/regulation-activities', payload);
export const updateActivity = (id, payload) => api.patch(`/admin/master/regulation-activities/${id}`, payload);
export const activateActivity = (id) => api.post(`/admin/master/regulation-activities/${id}/activate`);
export const deactivateActivity = (id) => api.post(`/admin/master/regulation-activities/${id}/deactivate`);
export const deleteActivity = (id) => api.delete(`/admin/master/regulation-activities/${id}`);

export default {
  listActivities,
  getActivity,
  createActivity,
  updateActivity,
  activateActivity,
  deactivateActivity,
  deleteActivity,
};
