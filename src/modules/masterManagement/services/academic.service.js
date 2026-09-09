import api from '../../../utils/apiClient';

/** Academic dedicated masters: Academic Years, Schools. */

function clean(params = {}) {
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined));
}

// --- academic years ---------------------------------------------------------

export const listAcademicYears = (params = {}) => api.get('/admin/master/academic-years', { params: clean(params) });
export const getAcademicYear = (id) => api.get(`/admin/master/academic-years/${id}`);
export const createAcademicYear = (payload) => api.post('/admin/master/academic-years', payload);
export const updateAcademicYear = (id, payload) => api.patch(`/admin/master/academic-years/${id}`, payload);
export const activateAcademicYear = (id) => api.post(`/admin/master/academic-years/${id}/activate`);
export const deactivateAcademicYear = (id) => api.post(`/admin/master/academic-years/${id}/deactivate`);
export const deleteAcademicYear = (id) => api.delete(`/admin/master/academic-years/${id}`);

// --- schools -----------------------------------------------------------------

export const listSchools = (params = {}) => api.get('/admin/master/schools', { params: clean(params) });
export const getSchool = (id) => api.get(`/admin/master/schools/${id}`);
export const createSchool = (payload) => api.post('/admin/master/schools', payload);
export const updateSchool = (id, payload) => api.patch(`/admin/master/schools/${id}`, payload);
export const activateSchool = (id) => api.post(`/admin/master/schools/${id}/activate`);
export const deactivateSchool = (id) => api.post(`/admin/master/schools/${id}/deactivate`);
export const deleteSchool = (id) => api.delete(`/admin/master/schools/${id}`);

export default {
  listAcademicYears,
  getAcademicYear,
  createAcademicYear,
  updateAcademicYear,
  activateAcademicYear,
  deactivateAcademicYear,
  deleteAcademicYear,
  listSchools,
  getSchool,
  createSchool,
  updateSchool,
  activateSchool,
  deactivateSchool,
  deleteSchool,
};
