import test from 'node:test';
import assert from 'node:assert/strict';
import { attentionItems, donutArcs, niceCeil, percentLabel, periodPhrase, seriesMax } from './dashboardData.js';

test('niceCeil: round axis tops', () => {
  assert.equal(niceCeil(0), 1);
  assert.equal(niceCeil(3), 5);
  assert.equal(niceCeil(7), 10);
  assert.equal(niceCeil(12), 20);
  assert.equal(niceCeil(250), 500);
  assert.equal(niceCeil(1000), 1000);
});

test('seriesMax: stacked sums vs grouped peaks', () => {
  const points = [{ a: 2, b: 3 }, { a: 4, b: 0 }];
  assert.equal(seriesMax(points, ['a', 'b']), 5);
  assert.equal(seriesMax(points, ['a', 'b'], { stacked: false }), 4);
  assert.equal(seriesMax([], ['a']), 0);
});

test('donutArcs: fractions add up and start where the last ended', () => {
  const arcs = donutArcs([{ key: 's', value: 6 }, { key: 'p', value: 3 }, { key: 't', value: 1 }]);
  assert.deepEqual(arcs.map((a) => [a.key, a.fraction, a.start]), [['s', 0.6, 0], ['p', 0.3, 0.6], ['t', 0.1, 0.8999999999999999]]);
  assert.deepEqual(donutArcs([{ key: 'x', value: 0 }]).map((a) => a.fraction), [0]);
});

test('percentLabel and periodPhrase', () => {
  assert.equal(percentLabel(0.456), '46%');
  assert.equal(percentLabel(0.001), '<1%');
  assert.equal(percentLabel(0), '0%');
  assert.equal(periodPhrase(30), 'the last 30 days');
  assert.equal(periodPhrase('365'), 'the last 12 months');
});

test('attention: most serious first, with links; "All clear" when nothing', () => {
  const items = attentionItems({
    system: { ready: true, emailConfigured: false, failingSweeps: 0, lateSweeps: 1, lateWorkers: 0 },
    safety: { total: 2 },
    subscriptions: { pastDue: 1, endingAtPeriodEnd: 3 },
    accounts: { unverifiedEmails: 0, suspendedAll: 2, suspended: { student: 0, parent: 2, teacher: 0 } },
  });
  assert.deepEqual(items.map((i) => i.id), ['email', 'safety', 'pastDue', 'late', 'ending', 'suspended']);
  assert.equal(items.find((i) => i.id === 'pastDue').title, '1 payment past due');
  assert.equal(items.find((i) => i.id === 'suspended').to, '/admin/users/parents');
  assert.deepEqual(attentionItems({ system: { ready: true, emailConfigured: true }, subscriptions: {}, accounts: {}, safety: { total: 0 } }).map((i) => i.id), ['clear']);
  assert.deepEqual(attentionItems(null), []);
});
