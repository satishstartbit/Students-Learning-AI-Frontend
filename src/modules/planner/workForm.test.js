import test from 'node:test';
import assert from 'node:assert/strict';
import { hasErrors, initialWorkValues, pastOnly, toIntakeFields, toOwnTaskValues, workFormErrors } from './workForm.js';

test('values start empty, from a default due date, or from a saved task', () => {
  assert.equal(initialWorkValues({ defaultDueDate: '2026-10-20' }).dueDate, '2026-10-20');
  const v = initialWorkValues({ task: { title: 'Essay', estimatedMinutes: 45, priority: 'high', startDate: '2026-10-14', dueDate: '2026-10-20' } });
  assert.deepEqual([v.title, v.minutes, v.priority, v.startDate], ['Essay', '45', 'high', '2026-10-14']);
});

test('problems: title, whole minutes in range, start on or before due', () => {
  const v = { ...initialWorkValues(), minutes: '2.5', startDate: '2026-10-21', dueDate: '2026-10-20' };
  assert.deepEqual(workFormErrors(v), { title: 'Give the work a title', minutes: 'Whole minutes, 1 to 1440', startDate: 'On or before the due date', dueDate: null });
  assert.equal(workFormErrors({ ...v, minutes: '700' }, { maxMinutes: 600 }).minutes, 'Whole minutes, 1 to 600');
  const ok = { ...initialWorkValues(), title: 'Read', minutes: '30', startDate: '2026-10-20', dueDate: '2026-10-20' };
  assert.equal(hasErrors(workFormErrors(ok)), false);
  assert.equal(workFormErrors({ ...ok, title: '' }, { titleRequired: false }).title, null);
});

test('no start or due date that has already gone (2026-10-21), except one already saved on the task', () => {
  const today = '2026-10-21';
  const v = { ...initialWorkValues(), title: 'Read', startDate: '2026-10-19', dueDate: '2026-10-20' };
  const errors = workFormErrors(v, { today });
  assert.match(errors.startDate, /start date has already passed/);
  assert.match(errors.dueDate, /due date has already passed/);
  assert.deepEqual(pastOnly(errors), { startDate: errors.startDate, dueDate: errors.dueDate });
  assert.equal(hasErrors(workFormErrors({ ...v, startDate: today, dueDate: today }, { today })), false);
  // An older task keeps its dates when something else is edited.
  assert.equal(hasErrors(workFormErrors(v, { today, saved: { startDate: '2026-10-19', dueDate: '2026-10-20' } })), false);
  // The order rule is not a past-date problem.
  assert.equal(pastOnly(workFormErrors({ ...v, startDate: '2026-10-30', dueDate: '2026-10-25' }, { today })).startDate, null);
});

test('API bodies: typed intake sends nulls, an own task sends blanks to clear', () => {
  const v = { ...initialWorkValues(), title: ' Read ch. 4 ', minutes: '30', priority: 'low', workType: 'Reading' };
  assert.deepEqual(toIntakeFields(v), { title: 'Read ch. 4', description: null, priority: 'low', subject: null, taskType: 'Reading', estimatedMinutes: 30, startDate: null, dueDate: null });
  assert.deepEqual(toOwnTaskValues({ ...v, minutes: '' }), { title: 'Read ch. 4', description: '', priority: 'low', subject: '', workType: 'Reading', estimatedMinutes: '', startDate: '', dueDate: '' });
});
