import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addDaysToDayKey, carriedReason, groupHomeTasks, weekAtAGlance } from './homeTasks.js';

const TODAY = '2026-10-07'; // a Wednesday
const dueKeyOf = (d) => (d ? String(d).slice(0, 10) : null);
const opts = { todayKey: TODAY, dueKeyOf };
const t = (id, status, due) => ({ recipientId: id, status, assignment: { id, title: id, dueDate: due } });

test('day keys add up across months', () => {
  assert.equal(addDaysToDayKey('2026-10-31', 1), '2026-11-01');
  assert.equal(addDaysToDayKey('2026-03-01', -1), '2026-02-28');
  assert.equal(addDaysToDayKey('nope', 1), '');
});

test('why a task is still to finish', () => {
  assert.equal(carriedReason(t('a', 'assigned', '2026-10-06'), opts), 'yesterday');
  assert.equal(carriedReason(t('a', 'assigned', '2026-10-01'), opts), 'earlier');
  assert.equal(carriedReason(t('a', 'in_progress', '2026-10-09'), opts), 'started');
  assert.equal(carriedReason(t('a', 'returned', '2026-10-09'), opts), 'returned');
  assert.equal(carriedReason(t('a', 'assigned', TODAY), opts), null);
  assert.equal(carriedReason(t('a', 'assigned', null), opts), null);
});

test('the next task is still the first one, and the rest are grouped', () => {
  const toDo = [
    t('next', 'assigned', TODAY),
    t('maths', 'in_progress', '2026-10-08'),
    t('sci', 'assigned', TODAY),
    t('spa', 'assigned', TODAY),
  ];
  const g = groupHomeTasks(toDo, opts);
  assert.equal(g.next.recipientId, 'next');
  assert.deepEqual(g.still.map((s) => [s.task.recipientId, s.reason]), [['maths', 'started']]);
  assert.deepEqual(g.others.map((x) => x.recipientId), ['sci', 'spa']);
  assert.equal(g.othersAllToday, true);
  assert.equal(g.moreCount, 0);
});

test('nothing to do: no next task, empty lists', () => {
  const g = groupHomeTasks([], opts);
  assert.equal(g.next, null);
  assert.deepEqual([g.still, g.others, g.moreCount, g.tomorrowTask], [[], [], 0, null]);
});

test('lists are capped; what does not fit is counted, and a hidden task due tomorrow is offered', () => {
  const toDo = [
    t('n', 'assigned', TODAY),
    t('s1', 'returned', TODAY),
    t('s2', 'in_progress', TODAY),
    t('s3', 'in_progress', TODAY), // a third carried task waits in the other list
    t('o1', 'assigned', TODAY),
    t('o2', 'assigned', TODAY),
    t('o3', 'assigned', TODAY),
    t('tm', 'assigned', '2026-10-08'),
  ];
  const g = groupHomeTasks(toDo, opts);
  assert.equal(g.still.length, 2);
  assert.deepEqual(g.others.map((x) => x.recipientId), ['s3', 'o1', 'o2', 'o3']);
  assert.equal(g.moreCount, 1);
  assert.equal(g.tomorrowTask.recipientId, 'tm');
});

test('this week: Monday to Friday, today marked, work counted per day, what comes next', () => {
  const toDo = [t('a', 'assigned', TODAY), t('b', 'assigned', '2026-10-08'), t('c', 'assigned', '2026-10-09'), t('d', 'assigned', '2026-10-09')];
  const w = weekAtAGlance(toDo, opts);
  assert.deepEqual(w.days.map((d) => d.key), ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09']);
  assert.deepEqual(w.days.map((d) => d.isToday), [false, false, true, false, false]);
  assert.deepEqual(w.days.map((d) => d.due), [0, 0, 1, 1, 2]);
  assert.deepEqual(w.days.map((d) => d.isPast), [true, true, false, false, false]);
  assert.equal(w.nextWeek, false);
  assert.equal(w.upcoming.task.recipientId, 'b');
  assert.equal(w.upcoming.tomorrow, true);
});

test('on a weekend the coming school week is shown', () => {
  const w = weekAtAGlance([], { todayKey: '2026-10-10', dueKeyOf }); // Saturday
  assert.equal(w.nextWeek, true);
  assert.equal(w.days[0].key, '2026-10-12');
  assert.equal(w.upcoming, null);
});
