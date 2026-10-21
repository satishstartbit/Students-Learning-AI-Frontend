import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DUE_TIME_PASSED_MESSAGE, PAST_DATE_MESSAGES, dueTimePassed, isPastDay, pastDateErrors } from './workDates.js';

const today = '2026-10-21';

test('a day before today is past; today and later are not', () => {
  assert.equal(isPastDay('2026-10-20', today), true);
  assert.equal(isPastDay('2026-10-21', today), false);
  assert.equal(isPastDay('2026-11-01', today), false);
  assert.equal(isPastDay('', today), false);
  assert.equal(isPastDay('2025-12-31', '2026-01-01'), true);
});

test('past start and due dates are named, each with its own words', () => {
  assert.deepEqual(pastDateErrors({ startDate: '2026-10-19', dueDate: '2026-10-20' }, { today }), {
    startDate: PAST_DATE_MESSAGES.startDate,
    dueDate: PAST_DATE_MESSAGES.dueDate,
  });
  assert.deepEqual(pastDateErrors({ startDate: '2026-10-21', dueDate: '2026-10-25' }, { today }), {});
  assert.deepEqual(pastDateErrors({ startDate: '', dueDate: null }, { today }), {});
});

test('a date that was already saved is not an error - older work stays editable', () => {
  assert.deepEqual(pastDateErrors({ dueDate: '2026-10-01' }, { today, saved: { dueDate: '2026-10-01' } }), {});
  assert.deepEqual(pastDateErrors({ dueDate: '2026-10-02' }, { today, saved: { dueDate: '2026-10-01' } }), { dueDate: PAST_DATE_MESSAGES.dueDate });
});

test('only the fields asked for are checked', () => {
  assert.deepEqual(pastDateErrors({ startDate: '2026-10-01', dueDate: '2026-10-01' }, { today, fields: ['dueDate'] }), { dueDate: PAST_DATE_MESSAGES.dueDate });
});

test('a due time today that has gone by is caught; later today or another day is fine', () => {
  const at = (h, m) => h * 60 + m;
  assert.equal(dueTimePassed({ dueDate: today, dueTime: '15:00', today, nowMinutes: at(16, 0) }), true);
  assert.equal(dueTimePassed({ dueDate: today, dueTime: '16:00', today, nowMinutes: at(16, 0) }), true);
  assert.equal(dueTimePassed({ dueDate: today, dueTime: '17:30', today, nowMinutes: at(16, 0) }), false);
  assert.equal(dueTimePassed({ dueDate: '2026-10-22', dueTime: '08:00', today, nowMinutes: at(16, 0) }), false);
  assert.equal(dueTimePassed({ dueDate: today, dueTime: '', today, nowMinutes: at(16, 0) }), false);
  assert.ok(DUE_TIME_PASSED_MESSAGE.includes('already passed'));
});
