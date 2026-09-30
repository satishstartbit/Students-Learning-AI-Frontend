import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addDaysKey,
  blocksByDay,
  daysBetween,
  groupPriorities,
  groupWorkByDue,
  groupWorkBySubject,
  minutesLabel,
  planRankMap,
  sourceLabel,
  windowProblem,
} from './planView.js';

const today = '2026-09-29';

test('day keys: arithmetic without the device clock', () => {
  assert.equal(addDaysKey('2026-10-31', 1), '2026-11-01');
  assert.equal(daysBetween('2026-09-29', '2026-10-06'), 7);
});

test('Today / Next / Later follows the first scheduled study time, in priority order', () => {
  const priorities = [
    { assignmentId: 'late', dueDate: '2026-09-20' },
    { assignmentId: 'a', dueDate: '2026-10-02' },
    { assignmentId: 'b', dueDate: '2026-10-20' },
    { assignmentId: 'c', dueDate: null },
  ];
  const blocks = [
    { assignmentId: 'a', date: '2026-09-29', status: 'scheduled' },
    { assignmentId: 'b', date: '2026-10-03', status: 'scheduled' },
    { assignmentId: 'b', date: '2026-09-29', status: 'done' },
  ];
  const g = groupPriorities(priorities, blocks, today);
  assert.deepEqual(g.today.map((p) => p.assignmentId), ['late', 'a']);
  assert.deepEqual(g.next.map((p) => p.assignmentId), ['b']);
  assert.deepEqual(g.later.map((p) => p.assignmentId), ['c']);
  assert.equal(g.next[0].rank, 3);
});

test('work by due date and by subject', () => {
  const work = [
    { title: 'x', dueDate: '2026-09-28' },
    { title: 'y', dueDate: today, subject: 'Science' },
    { title: 'z', dueDate: '2026-10-02', subject: 'Art' },
    { title: 'w', dueDate: null, subject: 'Science' },
  ];
  assert.deepEqual(groupWorkByDue(work, today).map((g) => g.key), ['overdue', 'today', 'week', 'none']);
  assert.deepEqual(groupWorkBySubject(work).map((g) => g.subject), ['Art', 'Science', null]);
  assert.deepEqual(groupWorkBySubject(work)[1].items.map((w) => w.title), ['y', 'w']);
});

test('blocks by day are in time order', () => {
  const map = blocksByDay([
    { date: today, startAt: '2026-09-29T22:00:00Z' },
    { date: today, startAt: '2026-09-29T20:00:00Z' },
  ]);
  assert.deepEqual(map.get(today).map((b) => b.startAt), ['2026-09-29T20:00:00Z', '2026-09-29T22:00:00Z']);
});

test('provenance labels never claim a teacher', () => {
  assert.equal(sourceLabel('parent', 'student'), 'Added by your parent');
  assert.equal(sourceLabel('student', 'parent'), 'Added by your child');
  assert.equal(sourceLabel('teacher'), 'From a teacher');
});

test('labels and checks', () => {
  assert.equal(minutesLabel(75), '1 h 15 min');
  assert.equal(minutesLabel(40), '40 min');
  assert.equal(planRankMap([{ assignmentId: 'a' }, { assignmentId: 'b' }]).get('b'), 1);
  assert.equal(windowProblem([{ start: '16:00', end: '17:00' }, { start: '16:30', end: '18:00' }]), 'Study times on the same day overlap');
  assert.equal(windowProblem([{ start: '16:00', end: '15:00' }]), 'Each study time must end after it starts');
  assert.equal(windowProblem([{ start: '16:00', end: '17:00' }, { start: '18:00', end: '19:00' }]), null);
});
