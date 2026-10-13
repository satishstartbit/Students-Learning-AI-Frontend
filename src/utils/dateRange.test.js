import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DATE_RANGE_MESSAGE, dateRangeLimits, dateRangeProblem } from './dateRange.js';

test('a To date before the From date is a problem; the same day or later is fine', () => {
  assert.equal(dateRangeProblem('2026-10-20', '2026-10-12'), DATE_RANGE_MESSAGE);
  assert.equal(dateRangeProblem('2026-10-12', '2026-10-12'), null);
  assert.equal(dateRangeProblem('2026-10-12', '2026-11-01'), null);
  assert.equal(dateRangeProblem('2026-12-31', '2027-01-01'), null, 'across a year end');
});

test('either side may be empty', () => {
  assert.equal(dateRangeProblem('', '2026-10-12'), null);
  assert.equal(dateRangeProblem('2026-10-12', ''), null);
  assert.equal(dateRangeProblem(null, undefined), null);
});

test('the pickers are limited by the other side', () => {
  assert.deepEqual(dateRangeLimits('2026-10-01', '2026-10-31'), { fromMax: '2026-10-31', toMin: '2026-10-01' });
  assert.deepEqual(dateRangeLimits('', ''), { fromMax: undefined, toMin: undefined });
});
