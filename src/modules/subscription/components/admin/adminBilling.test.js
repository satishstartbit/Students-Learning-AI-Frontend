import test from 'node:test';
import assert from 'node:assert/strict';
import {
  refundTaxSplit,
  refundableOf,
  isFullRefund,
  confirmMatches,
  refundAmountProblem,
  cardLabel,
  paymentStatusLabel,
  stripeDashboardUrl,
  presetRange,
  trendOf,
  refundReasonLabel,
} from './adminBilling.js';

const taxed = { amount: 22.6, taxAmount: 2.6, taxLines: [{ name: 'HST', rate: 13, amount: 2.6 }], refundAmount: 0 };

test('tax share of a refund: same proportion as the price, as the server records it', () => {
  assert.deepEqual(refundTaxSplit(taxed, 11.3), { preTax: 10, tax: 1.3, lines: [{ name: 'HST', rate: 13, amount: 1.3 }] });
  assert.deepEqual(refundTaxSplit({ amount: 20, taxAmount: 0 }, 5), { preTax: 5, tax: 0, lines: [] });
  const qc = refundTaxSplit({ amount: 11.5, taxAmount: 1.5, taxLines: [{ name: 'GST', amount: 0.5 }, { name: 'QST', amount: 1 }] }, 3.33);
  assert.equal(Math.round((qc.lines[0].amount + qc.lines[1].amount) * 100) / 100, qc.tax);
});

test('full refund = everything still refundable; the typed confirmation takes REFUND or the amount', () => {
  assert.equal(refundableOf({ amount: 20, refundAmount: 5 }), 15);
  assert.equal(refundableOf({ amount: 20, refundable: 12 }), 12);
  assert.equal(isFullRefund({ amount: 20, refundAmount: 5 }, '15'), true);
  assert.equal(isFullRefund({ amount: 20, refundAmount: 5 }, 14.99), false);
  assert.equal(confirmMatches('refund', 15), true);
  assert.equal(confirmMatches('15', 15), true);
  assert.equal(confirmMatches('$15.00', 15), true);
  assert.equal(confirmMatches('14', 15), false);
  assert.equal(confirmMatches('', 15), false);
});

test('refund amount checks', () => {
  const p = { amount: 20, refundAmount: 5 };
  assert.match(refundAmountProblem('0', p), /greater than zero/);
  assert.match(refundAmountProblem('16', p), /15\.00 still refundable/);
  assert.match(refundAmountProblem('1.234', p), /dollars and cents/);
  assert.equal(refundAmountProblem('15', p), null);
});

test('card: brand, last four and expiry only', () => {
  assert.equal(cardLabel({ brand: 'visa', last4: '4242', expiryLabel: '08/28' }), 'Visa •••• 4242, 08/28');
  assert.equal(cardLabel({ brand: 'visa', last4: '4242', expiryLabel: '08/28' }, { expiry: false }), 'Visa •••• 4242');
  assert.equal(cardLabel(null), '');
});

test('ledger words: pending and failed refunds say so', () => {
  assert.equal(paymentStatusLabel({ transactionType: 'refund', status: 'pending' }), 'Refund pending');
  assert.equal(paymentStatusLabel({ transactionType: 'refund', status: 'failed' }), 'Refund failed');
  assert.equal(paymentStatusLabel({ transactionType: 'payment', status: 'succeeded' }), null);
  assert.equal(refundReasonLabel('parent_request'), 'Parent asked');
});

test('Open in Stripe: test keys open the test dashboard; fixtures and junk get no link', () => {
  assert.equal(stripeDashboardUrl('pi_123abc', 'pk_test_x'), 'https://dashboard.stripe.com/test/payments/pi_123abc');
  assert.equal(stripeDashboardUrl('pi_123abc', 'pk_live_x'), 'https://dashboard.stripe.com/payments/pi_123abc');
  assert.equal(stripeDashboardUrl('pi_fake123', 'pk_test_x'), null);
  assert.equal(stripeDashboardUrl('javascript:alert(1)'), null);
});

test('revenue presets are calendar days', () => {
  assert.deepEqual(presetRange('30d', '2026-10-12'), { from: '2026-09-13', to: '2026-10-12' });
  assert.deepEqual(presetRange('month', '2026-10-12'), { from: '2026-10-01', to: '2026-10-12' });
  assert.deepEqual(presetRange('lastMonth', '2026-10-12'), { from: '2026-09-01', to: '2026-09-30' });
  assert.deepEqual(presetRange('lastMonth', '2026-01-05'), { from: '2025-12-01', to: '2025-12-31' });
  assert.deepEqual(presetRange('12m', '2026-10-12'), { from: '2025-10-13', to: '2026-10-12' });
  assert.deepEqual(presetRange('all', '2026-10-12'), { from: '', to: '' });
  assert.equal(presetRange('custom', '2026-10-12'), null);
});

test('trend arrows from % change', () => {
  assert.deepEqual(trendOf(12.34), { direction: 'up', value: '+12.3%', invert: false });
  assert.equal(trendOf(null), undefined);
  assert.equal(trendOf(-5, { invert: true }).direction, 'down');
});
