import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_WAIT_MS, mergeDelivered, reminderHeading, reminderPickProblem, reminderStatus, waitBeforeNextCheck } from './noteReminders.js';

const NOW = Date.parse('2026-10-08T19:00:00Z');

test('waits until just after the next reminder, at most an hour, never negative', () => {
  assert.equal(waitBeforeNextCheck({ remindAt: '2026-10-08T19:10:00Z' }, NOW), 10 * 60 * 1000 + 1000);
  assert.equal(waitBeforeNextCheck({ remindAt: '2026-10-09T19:00:00Z' }, NOW), MAX_WAIT_MS);
  assert.equal(waitBeforeNextCheck({ remindAt: '2026-10-08T18:00:00Z' }, NOW), 0);
  assert.equal(waitBeforeNextCheck(null, NOW), MAX_WAIT_MS);
});

test('reminder status: none, upcoming, due, done', () => {
  assert.equal(reminderStatus({ remindAt: null }, NOW), 'none');
  assert.equal(reminderStatus({ remindAt: '2026-10-08T20:00:00Z' }, NOW), 'upcoming');
  assert.equal(reminderStatus({ remindAt: '2026-10-08T18:00:00Z' }, NOW), 'due');
  assert.equal(reminderStatus({ remindAt: '2026-10-08T18:00:00Z', done: true }, NOW), 'done');
  assert.equal(reminderStatus({ remindAt: '2026-10-08T18:00:00Z', status: 'done' }, NOW), 'done');
});

test('heading: title first, else the start of the note, shortened', () => {
  assert.equal(reminderHeading({ title: 'Library book', content: 'Back by Thursday' }), 'Library book');
  assert.equal(reminderHeading({ title: '', content: '  Pack   PE kit ' }), 'Pack PE kit');
  assert.equal(reminderHeading({ content: 'x'.repeat(80) }).length, 60);
});

test('picking a reminder: needs a time, must not be past, unchanged is always fine', () => {
  const pick = (over) => reminderPickProblem({ dateKey: '2026-10-08', time: '15:30', iso: '2026-10-08T19:30:00Z', changed: true, ...over }, NOW);
  assert.equal(pick({ iso: '2026-10-08T20:00:00Z' }), null);
  assert.equal(pick({ time: '', iso: '' }), 'Pick a time for the reminder.');
  assert.equal(pick({ iso: '2026-10-08T18:00:00Z' }), "Pick a time that hasn't passed yet.");
  // 20 seconds ago still counts as now.
  assert.equal(pick({ iso: '2026-10-08T18:59:40Z' }), null);
  assert.equal(pick({ iso: '2026-10-08T18:00:00Z', changed: false }), null);
  assert.equal(pick({ dateKey: '', time: '', iso: '' }), null);
});

test('delivered reminders merge once each, oldest first', () => {
  const a = { id: 'a', remindAt: '2026-10-08T15:00:00Z' };
  const b = { id: 'b', remindAt: '2026-10-08T18:00:00Z' };
  assert.deepEqual(mergeDelivered([b], [a, b]).map((n) => n.id), ['a', 'b']);
  assert.deepEqual(mergeDelivered([], []), []);
});
