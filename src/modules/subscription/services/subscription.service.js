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

/** { subscription (in force or null), latestSubscription, access: { hasAccess, reason } } */
export const getMySubscription = () => api.get('/subscriptions/me');
export const listMyPayments = () => api.get('/subscriptions/me/payments');
export const cancelMySubscription = (reason) => api.post('/subscriptions/me/cancel', { reason });
export const setAutoRenew = (enabled) => api.patch('/subscriptions/me/auto-renew', { enabled });

/** Parent or student: { role, hasAccess, reason } - drives the redirect / lock screens. */
export const getAccess = () => api.get('/subscriptions/access');

// --- saved card (card numbers only ever go browser -> Stripe) ----------------

/** { card: { paymentMethodId, brand, last4, expMonth, expYear } | null } */
export const getPaymentMethod = () => api.get('/subscriptions/me/payment-method');

/** A SetupIntent client secret for Stripe Elements. */
export const createSetupIntent = () => api.post('/subscriptions/me/payment-method/setup-intent');

/** The server re-reads the SetupIntent from Stripe before saving anything. */
export const confirmSetupIntent = (setupIntentId) =>
  api.post('/subscriptions/me/payment-method/confirm', { setupIntentId });

export const removePaymentMethod = () => api.delete('/subscriptions/me/payment-method');

// --- super admin ------------------------------------------------------------

export const adminListSubscriptions = (params = {}) =>
  api.get('/subscriptions/admin/subscriptions', { params: clean(params) });

export const adminGetSubscription = (id) => api.get(`/subscriptions/admin/subscriptions/${id}`);

export const adminCancelSubscription = (id, { reason, immediate = false }) =>
  api.post(`/subscriptions/admin/subscriptions/${id}/cancel`, { reason, immediate });

export const adminListPayments = (params = {}) =>
  api.get('/subscriptions/admin/payments', { params: clean(params) });

/** The 4 Payments & Refunds KPI tiles - real ledger sums/counts for the given { from, to }, plus % change vs the previous period of the same length. */
export const adminGetPaymentStats = (params = {}) =>
  api.get('/subscriptions/admin/payments/stats', { params: clean(params) });

/** A CSV of every payment matching the given filters (same shape as adminListPayments, unpaginated). Returns the raw CSV text - hand it to utils/file.js#downloadTextFile. */
export const adminExportPayments = (params = {}) =>
  api.get('/subscriptions/admin/payments/export', { params: clean(params), responseType: 'text' });

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
  setAutoRenew,
  getAccess,
  getPaymentMethod,
  createSetupIntent,
  confirmSetupIntent,
  removePaymentMethod,
  adminListSubscriptions,
  adminGetSubscription,
  adminCancelSubscription,
  adminListPayments,
  adminGetPaymentStats,
  adminExportPayments,
  adminRefundPayment,
  adminGetStats,
  adminListCouponRedemptions,
};
