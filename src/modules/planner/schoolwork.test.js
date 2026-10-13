import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COLUMNS,
  VIEW_OPTIONS,
  agendaItems,
  blockStats,
  boardColumns,
  canTick,
  dueInfo,
  eventsByDay,
  listSections,
  moveActions,
  orderByPlan,
  planSections,
  sortBlocks,
  sortOptionsFor,
  sortWork,
  upcomingEvents,
  weekKeys,
  workByDueDay,
} from './schoolwork.js';

const TODAY = '2026-09-25';
const w = (id, extra = {}) => ({ id, title: `Work ${id}`, progress: 'todo', moves: ['doing', 'done'], kind: 'own', dueDate: null, ...extra });

test('three views, in the settings order, and three board columns', () => {
  assert.deepEqual(
    VIEW_OPTIONS.map((v) => v.label),
    ['Sticky notes', 'List', 'Calendar']
  );
  assert.deepEqual(
    COLUMNS.map((c) => c.label),
    ['To Do', 'Doing', 'Done']
  );
});

test('plan order: the server rank, then the soonest due date, then the title', () => {
  const work = [w('c', { dueDate: '2026-09-30' }), w('b', { dueDate: '2026-09-26' }), w('a'), w('d', { dueDate: '2026-09-26', title: 'A first' })];
  const ordered = orderByPlan(work, [{ assignmentId: 'a' }]);
  assert.deepEqual(
    ordered.map((x) => x.id),
    ['a', 'd', 'b', 'c'],
    'ranked first; unranked by due date, ties by title'
  );
});

test('board: each piece of work in its column, done most-recent first', () => {
  const work = [
    w('t1'),
    w('d1', { progress: 'doing' }),
    w('x1', { progress: 'done', completedAt: '2026-09-20T10:00:00Z' }),
    w('x2', { progress: 'done', completedAt: '2026-09-24T10:00:00Z' }),
    w('odd', { progress: 'mystery' }),
  ];
  const cols = boardColumns(work, []);
  assert.deepEqual(cols.todo.map((x) => x.id), ['odd', 't1']);
  assert.deepEqual(cols.doing.map((x) => x.id), ['d1']);
  assert.deepEqual(cols.done.map((x) => x.id), ['x2', 'x1']);
});

test('list: priority keeps open work in plan order with done work last; Next 3 is the top three open', () => {
  const work = [w('a'), w('b'), w('c'), w('d'), w('z', { progress: 'done' })];
  const priorities = ['d', 'c', 'b', 'a'].map((id) => ({ assignmentId: id }));
  const sections = listSections(work, priorities, 'priority', TODAY);
  assert.deepEqual(sections.map((s) => s.key), ['priority', 'done']);
  assert.deepEqual(sections[0].items.map((x) => x.id), ['d', 'c', 'b', 'a']);
  const next = listSections(work, priorities, 'next3', TODAY);
  assert.equal(next.length, 1);
  assert.deepEqual(next[0].items.map((x) => x.id), ['d', 'c', 'b']);
});

test('list: by due date and by subject group the open work', () => {
  const work = [w('a', { dueDate: TODAY }), w('b', { dueDate: '2026-09-20' }), w('c', { subject: 'Science' }), w('d', { subject: 'Math', dueDate: '2026-10-30' })];
  assert.deepEqual(
    listSections(work, [], 'due', TODAY).map((s) => s.key),
    ['overdue', 'today', 'later', 'none']
  );
  const bySubject = listSections(work, [], 'subject', TODAY);
  assert.deepEqual(bySubject.map((s) => s.key), ['subject:Math', 'subject:Science', 'subject:']);
});

test('due labels relative to today', () => {
  assert.deepEqual(dueInfo(null, TODAY), { kind: 'none' });
  assert.deepEqual(dueInfo('2026-09-23', TODAY), { kind: 'overdue', days: 2 });
  assert.equal(dueInfo(TODAY, TODAY).kind, 'today');
  assert.equal(dueInfo('2026-09-26', TODAY).kind, 'tomorrow');
  assert.equal(dueInfo('2026-09-28', TODAY).kind, 'soon');
  assert.equal(dueInfo('2026-10-02', TODAY).kind, 'later');
  assert.equal(dueInfo('2026-09-28T00:00:00.000Z', TODAY).kind, 'soon', 'a stray timestamp is read as its day');
});

test('personal events by day (all-day first, then by time) and the week ahead', () => {
  const events = [
    { id: 'b', date: '2026-09-29', start: '18:00', allDay: false },
    { id: 'a', date: '2026-09-29', start: '16:15', allDay: false },
    { id: 'c', date: '2026-09-29', start: null, allDay: true },
    { id: 'old', date: '2026-09-24', start: '10:00', allDay: false },
    { id: 'far', date: '2026-10-05', start: '10:00', allDay: false },
  ];
  assert.deepEqual(eventsByDay(events).get('2026-09-29').map((e) => e.id), ['c', 'a', 'b']);
  assert.deepEqual(upcomingEvents(events, TODAY).map((e) => e.id).sort(), ['a', 'b', 'c']);
});

test('note actions follow the moves the server allows', () => {
  assert.deepEqual(moveActions(w('a')).map((m) => m.label), ['Start', 'Done']);
  assert.deepEqual(moveActions(w('a', { progress: 'doing', moves: ['todo', 'done'] })).map((m) => m.label), ['Done', 'Back to To Do']);
  assert.deepEqual(moveActions(w('a', { progress: 'done', moves: ['todo', 'doing'] })).map((m) => m.label), ['Not done yet', 'Back to To Do']);
  assert.deepEqual(moveActions(w('t', { kind: 'teacher', moves: ['doing'] })).map((m) => m.to), ['doing']);
  assert.deepEqual(moveActions(w('t', { kind: 'teacher', progress: 'doing', moves: [] })).map((m) => m.to), ['handIn']);
  assert.deepEqual(moveActions(w('t', { kind: 'teacher', progress: 'done', moves: [] })), []);
});

test('the tick circle works for own work only', () => {
  assert.equal(canTick(w('a')), true);
  assert.equal(canTick(w('a', { progress: 'done', moves: ['todo', 'doing'] })), true);
  assert.equal(canTick(w('t', { kind: 'teacher', moves: ['doing'] })), false);
});

test('the full calendar day: study times and personal events in time order (the PDF Tuesday)', () => {
  const blocks = [
    { id: 'math', start: 15 * 60 + 30 },
    { id: 'science', start: 19 * 60 },
  ];
  const events = [
    { id: 'call', start: '19:45', allDay: false },
    { id: 'soccer', start: '16:15', allDay: false },
    { id: 'dinner', start: '18:00', allDay: false },
    { id: 'trip', start: null, allDay: true },
  ];
  const items = agendaItems(blocks, events, (b) => b.start);
  assert.deepEqual(
    items.map((i) => i.item.id),
    ['trip', 'math', 'soccer', 'dinner', 'science', 'call']
  );
  assert.equal(items[1].kind, 'study');
  assert.equal(items[2].kind, 'event');
});

test('a week of day keys', () => {
  assert.deepEqual(weekKeys('2026-09-28', 3), ['2026-09-28', '2026-09-29', '2026-09-30']);
});

// --- The Sort menu (Plan page, both bands) -------------------------------------------------
const SORTABLE = [
  w('m', { title: 'Map quiz', subject: 'History', dueDate: '2026-10-07' }),
  w('b', { title: 'Book response', subject: 'English', dueDate: '2026-09-26' }),
  w('k', { title: 'Worksheet 12', subject: 'Mathematics', dueDate: '2026-09-25', progress: 'doing' }),
  w('n', { title: 'No subject yet', subject: null, dueDate: null }),
  w('s', { title: 'Spanish vocabulary', subject: 'Languages', progress: 'done', completedAt: '2026-09-24T10:00:00Z' }),
  w('p', { title: 'Poetry response', subject: 'English', progress: 'done', completedAt: '2026-09-25T10:00:00Z' }),
];
const RANK = [{ assignmentId: 'b' }, { assignmentId: 'm' }, { assignmentId: 'k' }];

test('sort options: Grade 6+ words, K-4 words, "next 3" on the 6+ list only', () => {
  assert.deepEqual(sortOptionsFor('board').map((o) => o.label), ['Recommended', 'Due date', 'Subject']);
  assert.deepEqual(sortOptionsFor('list').map((o) => o.key), ['plan', 'due', 'subject', 'next3']);
  assert.deepEqual(sortOptionsFor('list', { kid: true }).map((o) => o.label), ['What’s next', 'Due first', 'Subject']);
});

test('sortWork: the plan, due date (undated last), subject (none last) - ties keep the plan order', () => {
  assert.deepEqual(sortWork(SORTABLE, RANK, 'plan').map((x) => x.id), ['b', 'm', 'k', 'n', 'p', 's'], 'unranked and undated: by title');
  assert.deepEqual(sortWork(SORTABLE, RANK, 'due').map((x) => x.id), ['k', 'b', 'm', 'n', 'p', 's']);
  assert.deepEqual(sortWork(SORTABLE, RANK, 'subject').map((x) => x.id), ['b', 'p', 'm', 's', 'k', 'n']);
});

test('board columns follow the sort; Done stays most recently finished first', () => {
  const cols = boardColumns(SORTABLE, RANK, 'due');
  assert.deepEqual(cols.todo.map((x) => x.id), ['b', 'm', 'n']);
  assert.deepEqual(cols.doing.map((x) => x.id), ['k']);
  assert.deepEqual(cols.done.map((x) => x.id), ['p', 's']);
});

test('plan sections: open in the sort order (three for next3), finished apart', () => {
  const plan = planSections(SORTABLE, RANK, 'plan');
  assert.deepEqual(plan.open.map((x) => x.id), ['b', 'm', 'k', 'n']);
  assert.deepEqual(plan.done.map((x) => x.id), ['p', 's']);
  assert.deepEqual(planSections(SORTABLE, RANK, 'next3').open.map((x) => x.id), ['b', 'm', 'k']);
});

test('a day of study times: by time, by the work due soonest, or by subject', () => {
  const blocks = [
    { id: 1, assignmentId: 'm', subject: 'History', startAt: '2026-09-25T19:00:00Z', minutes: 20, status: 'scheduled' },
    { id: 2, assignmentId: 'k', subject: 'Mathematics', startAt: '2026-09-25T20:00:00Z', minutes: 20, status: 'done' },
    { id: 3, assignmentId: 'b', subject: 'English', startAt: '2026-09-25T21:00:00Z', minutes: 25, status: 'missed' },
  ];
  const due = { m: '2026-10-07', k: '2026-09-25', b: '2026-09-26' };
  assert.deepEqual(sortBlocks(blocks, 'plan').map((b) => b.id), [1, 2, 3]);
  assert.deepEqual(sortBlocks(blocks, 'due', (id) => due[id]).map((b) => b.id), [2, 3, 1]);
  assert.deepEqual(sortBlocks(blocks, 'subject').map((b) => b.id), [3, 1, 2]);
  assert.deepEqual(blockStats(blocks), { total: 3, done: 1, minutes: 40 }, 'a missed time is not planned time');
  assert.deepEqual(blockStats([]), { total: 0, done: 0, minutes: 0 });
});

test('work by its due day, in the sort order; undated work is left out', () => {
  const map = workByDueDay(SORTABLE, RANK, 'plan');
  assert.deepEqual([...map.keys()].sort(), ['2026-09-25', '2026-09-26', '2026-10-07']);
  assert.deepEqual(map.get('2026-09-25').map((x) => x.id), ['k']);
});
