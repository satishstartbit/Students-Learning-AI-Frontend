import test from 'node:test';
import assert from 'node:assert/strict';
import { hasErrors, initialWorkValues, toIntakeFields, toOwnTaskValues, workFormErrors } from './workForm.js';

test('values start empty, from a default due date, or from a saved task', () => {
  assert.equal(initialWorkValues({ defaultDueDate: '2026-10-20' }).dueDate, '2026-10-20');
  const v = initialWorkValues({ task: { title: 'Essay', estimatedMinutes: 45, priority: 'high', startDate: '2026-10-14', dueDate: '2026-10-20' } });
  assert.deepEqual([v.title, v.minutes, v.priority, v.startDate], ['Essay', '45', 'high', '2026-10-14']);
});

test('problems: title, whole minutes in range, start on or before due', () => {
  const v = { ...initialWorkValues(), minutes: '2.5', startDate: '2026-10-21', dueDate: '2026-10-20' };
  assert.deepEqual(workFormErrors(v), { title: 'Give the work a title', minutes: 'Whole minutes, 1 to 1440', startDate: 'On or before the due date' });
  assert.equal(workFormErrors({ ...v, minutes: '700' }, { maxMinutes: 600 }).minutes, 'Whole minutes, 1 to 600');
  const ok = { ...initialWorkValues(), title: 'Read', minutes: '30', startDate: '2026-10-20', dueDate: '2026-10-20' };
  assert.equal(hasErrors(workFormErrors(ok)), false);
  assert.equal(workFormErrors({ ...ok, title: '' }, { titleRequired: false }).title, null);
});

test('API bodies: typed intake sends nulls, an own task sends blanks to clear', () => {
  const v = { ...initialWorkValues(), title: ' Read ch. 4 ', minutes: '30', priority: 'low', workType: 'Reading' };
  assert.deepEqual(toIntakeFields(v), { title: 'Read ch. 4', description: null, priority: 'low', subject: null, taskType: 'Reading', estimatedMinutes: 30, startDate: null, dueDate: null });
  assert.deepEqual(toOwnTaskValues({ ...v, minutes: '' }), { title: 'Read ch. 4', description: '', priority: 'low', subject: '', workType: 'Reading', estimatedMinutes: '', startDate: '', dueDate: '' });
});
