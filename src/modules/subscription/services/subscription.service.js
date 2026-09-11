import api from '../../../utils/apiClient';

/**
 * Subscriptions, checkout and billing.
 *
 * Split by audience to match the backend's own guards: the `/me` calls are
 * self-scoped (the parent is taken from the session, never passed in), and the
 * `admin*` calls are Super Admin only.
 */

function clean(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  );
}

// --- parent -----------------------------------------------------------------

export const listPlans = () => api.get('/subscriptions/plans');

/** Prices a plan with a coupon applied; rejects with the reason if invalid. */
export const validateCoupon = ({ planId, code }) =>
  api.post('/subscriptions/coupons/validate', { planId, code });

/** Opens a PaymentIntent and returns its client secret for Stripe Elements. */
export const startCheckout = ({ planId, code }) =>
  api.post('/subscriptions/checkout', { planId, code });

/**
 * Tells the server Stripe reported success. The server re-reads the intent
 * from Stripe itself, so this only makes activation instant - it can't fake it.
 */
export const confirmCheckout = (paymentIntentId) =>
  api.post('/subscriptions/checkout/confirm', { paymentIntentId });

export const getMySubscription = () => api.get('/subscriptions/me');
export const listMyPayments = () => api.get('/subscriptions/me/payments');
export const cancelMySubscription = (reason) => api.post('/subscriptions/me/cancel', { reason });

// --- super admin ------------------------------------------------------------

export const adminListSubscriptions = (params = {}) =>
  api.get('/subscriptions/admin/subscriptions', { params: clean(params) });

export const adminGetSubscription = (id) => api.get(`/subscriptions/admin/subscriptions/${id}`);

export const adminCancelSubscription = (id, { reason, immediate = false }) =>
  api.post(`/subscriptions/admin/subscriptions/${id}/cancel`, { reason, immediate });

export const adminListPayments = (params = {}) =>
  api.get('/subscriptions/admin/payments', { params: clean(params) });

export const adminRefundPayment = (id, { amount, reason }) =>
  api.post(`/subscriptions/admin/payments/${id}/refund`, clean({ amount, reason }));

export const adminGetStats = (params = {}) =>
  api.get('/subscriptions/admin/stats', { params: clean(params) });

export const adminListCouponRedemptions = (couponId) =>
  api.get(`/subscriptions/admin/coupons/${couponId}/redemptions`);

export default {
  listPlans,
  validateCoupon,
  startCheckout,
  confirmCheckout,
  getMySubscription,
  listMyPayments,
  cancelMySubscription,
  adminListSubscriptions,
  adminGetSubscription,
  adminCancelSubscription,
  adminListPayments,
  adminRefundPayment,
  adminGetStats,
  adminListCouponRedemptions,
};
