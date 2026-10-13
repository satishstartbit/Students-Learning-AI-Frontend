import test from 'node:test';
import assert from 'node:assert/strict';
import { zonedWallTimeToDate } from './zonedTime.js';

const iso = (...args) => zonedWallTimeToDate(...args)?.toISOString() ?? null;

test('the same wall time is a different instant in each Canadian zone', () => {
  assert.equal(iso('2026-10-09', '15:30', 'America/Toronto'), '2026-10-09T19:30:00.000Z');
  assert.equal(iso('2026-10-09', '15:30', 'America/Vancouver'), '2026-10-09T22:30:00.000Z');
  // Saskatchewan keeps standard time all year.
  assert.equal(iso('2026-10-09', '15:30', 'America/Regina'), '2026-10-09T21:30:00.000Z');
  assert.equal(iso('2026-10-09', '15:30', 'America/St_Johns'), '2026-10-09T18:00:00.000Z');
});

test('winter time after the autumn change', () => {
  assert.equal(iso('2026-11-10', '08:00', 'America/Toronto'), '2026-11-10T13:00:00.000Z');
});

test('daylight-time edges: repeated hour takes the first, skipped hour moves on', () => {
  // Toronto falls back 2026-11-01 02:00 -> 01:00; 01:30 happens twice.
  assert.equal(iso('2026-11-01', '01:30', 'America/Toronto'), '2026-11-01T05:30:00.000Z');
  // Toronto springs forward 2026-03-08 02:00 -> 03:00; 02:30 doesn't exist.
  const skipped = zonedWallTimeToDate('2026-03-08', '02:30', 'America/Toronto');
  assert.ok(skipped && skipped.toISOString() >= '2026-03-08T06:30:00.000Z' && skipped.toISOString() <= '2026-03-08T07:30:00.000Z');
});

test('bad input gives null', () => {
  assert.equal(zonedWallTimeToDate('', '10:00', 'America/Toronto'), null);
  assert.equal(zonedWallTimeToDate('2026-10-09', '', 'America/Toronto'), null);
  assert.equal(zonedWallTimeToDate('2026-13-09', '10:00', 'America/Toronto'), null);
  assert.equal(zonedWallTimeToDate('2026-10-09', '25:00', 'America/Toronto'), null);
});
