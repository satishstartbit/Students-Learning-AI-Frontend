import api from '../../../utils/apiClient';

/** Billing dedicated masters: Subscription Plans, Discount Codes. */

function clean(params = {}) {
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined));
}

// --- subscription plans -------------------------------------------------------

export const listPlans = (params = {}) => api.get('/admin/master/subscription-plans', { params: clean(params) });
export const getPlan = (id) => api.get(`/admin/master/subscription-plans/${id}`);
export const createPlan = (payload) => api.post('/admin/master/subscription-plans', payload);
export const updatePlan = (id, payload) => api.patch(`/admin/master/subscription-plans/${id}`, payload);
export const activatePlan = (id) => api.post(`/admin/master/subscription-plans/${id}/activate`);
export const deactivatePlan = (id) => api.post(`/admin/master/subscription-plans/${id}/deactivate`);
export const deletePlan = (id) => api.delete(`/admin/master/subscription-plans/${id}`);

// --- discount codes -------------------------------------------------------------

export const listDiscountCodes = (params = {}) => api.get('/admin/master/discount-codes', { params: clean(params) });
export const getDiscountCode = (id) => api.get(`/admin/master/discount-codes/${id}`);
export const createDiscountCode = (payload) => api.post('/admin/master/discount-codes', payload);
export const updateDiscountCode = (id, payload) => api.patch(`/admin/master/discount-codes/${id}`, payload);
export const activateDiscountCode = (id) => api.post(`/admin/master/discount-codes/${id}/activate`);
export const deactivateDiscountCode = (id) => api.post(`/admin/master/discount-codes/${id}/deactivate`);
export const deleteDiscountCode = (id) => api.delete(`/admin/master/discount-codes/${id}`);

export default {
  listPlans,
  getPlan,
  createPlan,
  updatePlan,
  activatePlan,
  deactivatePlan,
  deletePlan,
  listDiscountCodes,
  getDiscountCode,
  createDiscountCode,
  updateDiscountCode,
  activateDiscountCode,
  deactivateDiscountCode,
  deleteDiscountCode,
};
