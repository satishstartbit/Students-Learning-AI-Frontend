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

/**
 * Starts checkout. `data.mode`: 'payment' (a PaymentIntent's client secret for
 * Stripe Elements), 'setup' (a free trial: a SetupIntent that saves the card
 * without charging it) or 'none' (nothing to pay - `data.subscription` is
 * already active).
 */
export const startCheckout = ({ planId, code }) =>
  api.post('/subscriptions/checkout', { planId, code });

/**
 * Tells the server Stripe reported success: `{ paymentIntentId }` for a
 * payment (checkout or plan change), `{ setupIntentId }` for a free trial.
 * The server re-reads the intent from Stripe itself, so this only makes
 * activation instant - it can't fake it.
 */
export const confirmCheckout = ({ paymentIntentId, setupIntentId }) =>
  api.post('/subscriptions/checkout/confirm', paymentIntentId ? { paymentIntentId } : { setupIntentId });

/** What moving to another plan costs today: { credit, dueToday, total, periodEnd, coupon, couponDropped, trial, ... } */
export const getPlanChangeQuote = (planId) => api.post('/subscriptions/me/change/quote', { planId });

/** Changes plan: `data.mode` 'payment' (pay the difference at checkout) or 'none' (changed now, `data.subscription`). */
export const startPlanChange = (planId) => api.post('/subscriptions/me/change', { planId });

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

/**
 * A refund. `reasonCode` is required (duplicate | parent_request |
 * service_problem | other); `requestKey` is the dialog's idempotency key, so a
 * repeated click refunds once; `cancelSubscription: false` keeps the family
 * subscribed after a full refund. `data.refundOutcome.status` is
 * refunded | pending | failed.
 */
export const adminRefundPayment = (id, { amount, reasonCode, note, requestKey, cancelSubscription }) =>
  api.post(`/subscriptions/admin/payments/${id}/refund`, clean({ amount, reasonCode, note, requestKey, cancelSubscription }));

/** One payment for the refund dialog / View Details: card (brand, last 4, expiry), refunds with who and why, `refundable`, its subscription. */
export const adminGetPayment = (id) => api.get(`/subscriptions/admin/payments/${id}`);

/** Past-due row: charge the saved card now (`data.outcome` renewed | failed). */
export const adminRetryPayment = (id, requestKey) =>
  api.post(`/subscriptions/admin/subscriptions/${id}/retry-payment`, { requestKey });

/** Past-due row: email the parent to update their card (once an hour at most). */
export const adminRemindCard = (id) => api.post(`/subscriptions/admin/subscriptions/${id}/remind-card`);

/** "Apply discount code": every active code with { available, reason, nextPayment } for this subscription. */
export const adminGetCouponOptions = (id) => api.get(`/subscriptions/admin/subscriptions/${id}/coupons`);

/** Puts a code on the subscription from its next payment; rejects with the reason when it can't be used. */
export const adminApplyCoupon = (id, { discountCodeId, note }) =>
  api.post(`/subscriptions/admin/subscriptions/${id}/coupon`, { discountCodeId, note: note || null });

/** The Subscriptions list as CSV text (same filters). */
export const adminExportSubscriptions = (params = {}) =>
  api.get('/subscriptions/admin/subscriptions/export', { params: clean(params), responseType: 'text' });

/** Revenue: by plan, totals vs the previous period, over time, MRR, trials, discounts. `from`/`to` are day keys. */
export const adminGetStats = (params = {}) =>
  api.get('/subscriptions/admin/stats', { params: clean(params) });

/** Sales tax per charge and refund with totals (CSV) - for the GST/HST return. */
export const adminExportTax = (params = {}) =>
  api.get('/subscriptions/admin/stats/tax-export', { params: clean(params), responseType: 'text' });

export const adminListCouponRedemptions = (couponId) =>
  api.get(`/subscriptions/admin/coupons/${couponId}/redemptions`);

export default {
  listPlans,
  validateCoupon,
  startCheckout,
  confirmCheckout,
  getPlanChangeQuote,
  startPlanChange,
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
  adminGetPayment,
  adminRetryPayment,
  adminRemindCard,
  adminGetCouponOptions,
  adminApplyCoupon,
  adminExportSubscriptions,
  adminGetStats,
  adminExportTax,
  adminListCouponRedemptions,
};
