/**
 * Pure helpers for the Super Admin billing pages (refund dialog, ledger,
 * subscriptions, revenue). Tested in adminBilling.test.js. Money is worked
 * in cents so 0.1 + 0.2 never shows up on a refund.
 */

/** Why a refund was made - the server's REFUND_REASONS codes (reports group by them). */
export const REFUND_REASON_OPTIONS = [
  { value: 'duplicate', label: 'Duplicate charge' },
  { value: 'parent_request', label: 'Parent asked' },
  { value: 'service_problem', label: 'Service problem' },
  { value: 'other', label: 'Other' },
];

export const refundReasonLabel = (code) => REFUND_REASON_OPTIONS.find((o) => o.value === code)?.label ?? null;

/** What a full refund asks the admin to type, besides the exact amount. */
export const CONFIRM_WORD = 'REFUND';

export const toCents = (value) => Math.round(Number(value || 0) * 100);
export const fromCents = (cents) => Math.round(cents) / 100;

/** "12.50" for an input, from a number of dollars. */
export const amountText = (value) => fromCents(toCents(value)).toFixed(2);

/**
 * The refund's tax share: the payment's tax in the same proportion as the
 * refund (the server records the same split). `{ preTax, tax, lines }`.
 */
export function refundTaxSplit(payment, refundAmount) {
  const paid = toCents(payment?.amount);
  const refund = Math.max(0, Math.min(toCents(refundAmount), paid));
  const taxPaid = toCents(payment?.taxAmount);
  if (!paid || !refund || !taxPaid) return { preTax: fromCents(refund), tax: 0, lines: [] };
  const share = refund / paid;
  const tax = Math.round(taxPaid * share);
  const source = (payment.taxLines ?? []).filter((l) => Number(l?.amount) > 0);
  let left = tax;
  const lines = source.map((line, i) => {
    const cents = i === source.length - 1 ? left : Math.round(toCents(line.amount) * share);
    left -= cents;
    return { name: line.name, rate: Number(line.rate ?? 0), amount: fromCents(cents) };
  });
  return { preTax: fromCents(refund - tax), tax: fromCents(tax), lines };
}

/** Still refundable on a payment (amount - refunded so far; pending refunds count, failed ones don't). */
export const refundableOf = (payment) =>
  payment?.refundable != null ? Number(payment.refundable) : fromCents(Math.max(0, toCents(payment?.amount) - toCents(payment?.refundAmount)));

/** Whether `amount` takes everything that is left (so the subscription question applies). */
export const isFullRefund = (payment, amount) => {
  const left = toCents(refundableOf(payment));
  return left > 0 && toCents(amount) >= left;
};

/** The typed confirmation for a full refund: the word REFUND, or the exact amount ("15" or "15.00"). */
export function confirmMatches(typed, amount) {
  const text = String(typed ?? '').trim();
  if (!text) return false;
  if (text.toUpperCase() === CONFIRM_WORD) return true;
  const asNumber = Number(text.replace(/[$,\s]|CAD/gi, ''));
  return Number.isFinite(asNumber) && toCents(asNumber) === toCents(amount);
}

/** Problems with a typed refund amount, or null. */
export function refundAmountProblem(amount, payment) {
  const cents = toCents(amount);
  if (!(Number(amount) > 0) || cents <= 0) return 'Enter a refund amount greater than zero.';
  if (String(amount).includes('.') && String(amount).split('.')[1].length > 2) return 'Use dollars and cents, for example 12.50.';
  const left = toCents(refundableOf(payment));
  if (cents > left) return `That is more than the ${fromCents(left).toFixed(2)} still refundable.`;
  return null;
}

/** "Visa •••• 4242" (+ ", 08/28" when the expiry is known). Never more than brand, last four and expiry. */
export function cardLabel(card, { expiry = true } = {}) {
  if (!card?.last4) return '';
  const brand = card.brand ? card.brand.charAt(0).toUpperCase() + card.brand.slice(1) : 'Card';
  const label = `${brand} •••• ${card.last4}`;
  return expiry && card.expiryLabel ? `${label}, ${card.expiryLabel}` : label;
}

/** A ledger row's status words: a refund row can be pending or failed as well as done. */
export function paymentStatusLabel(row) {
  if (row?.transactionType === 'refund') {
    if (row.status === 'pending') return 'Refund pending';
    if (row.status === 'failed') return 'Refund failed';
    return 'Refunded';
  }
  return null; // StatusBadge's own words
}

/** StatusBadge status for a ledger row: a failed refund reads as an error, a pending one as a warning. */
export function paymentStatusTone(row) {
  if (row?.transactionType === 'refund' && row.status === 'pending') return 'pending';
  return row?.status;
}

/**
 * The Stripe dashboard page for a PaymentIntent - test-mode keys open the
 * test dashboard. Only a link for the admin to click; no Stripe API call.
 */
export function stripeDashboardUrl(paymentIntentId, publishableKey = '') {
  if (!/^pi_[A-Za-z0-9]+$/.test(String(paymentIntentId ?? ''))) return null;
  if (/^pi_fake/.test(paymentIntentId)) return null; // test fixtures
  const test = String(publishableKey).startsWith('pk_test_');
  return `https://dashboard.stripe.com/${test ? 'test/' : ''}payments/${paymentIntentId}`;
}

/** A fresh idempotency key per refund / retry dialog. */
export function newRequestKey() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `k${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

/** { direction, value } for StatCard from a % change (null = nothing to compare against). */
export function trendOf(changePercent, { invert = false } = {}) {
  if (changePercent === null || changePercent === undefined) return undefined;
  const rounded = Math.round(changePercent * 10) / 10;
  // For cancellations and refunds, up is bad: show the arrow as it is but let the caller colour it.
  return { direction: rounded >= 0 ? 'up' : 'down', value: `${rounded >= 0 ? '+' : ''}${rounded}%`, invert };
}

/** Day keys for the Revenue presets, from today's key ("2026-10-12"). */
export function presetRange(preset, todayKey) {
  const [y, m] = todayKey.split('-').map(Number);
  const key = (date) => date.toISOString().slice(0, 10);
  const day = (offset) => key(new Date(Date.UTC(y, m - 1, Number(todayKey.slice(8)) + offset)));
  switch (preset) {
    case '30d':
      return { from: day(-29), to: todayKey };
    case '90d':
      return { from: day(-89), to: todayKey };
    case 'month':
      return { from: key(new Date(Date.UTC(y, m - 1, 1))), to: todayKey };
    case 'lastMonth':
      return { from: key(new Date(Date.UTC(y, m - 2, 1))), to: key(new Date(Date.UTC(y, m - 1, 0))) };
    case '12m':
      return { from: key(new Date(Date.UTC(y - 1, m - 1, Number(todayKey.slice(8)) + 1))), to: todayKey };
    case 'all':
      return { from: '', to: '' };
    default:
      return null; // custom
  }
}

export const REVENUE_PRESETS = [
  { value: '30d', label: 'Last 30 days' },
  { value: 'month', label: 'This month' },
  { value: 'lastMonth', label: 'Last month' },
  { value: '90d', label: 'Last 90 days' },
  { value: '12m', label: 'Last 12 months' },
  { value: 'all', label: 'All time' },
  { value: 'custom', label: 'Custom dates' },
];
