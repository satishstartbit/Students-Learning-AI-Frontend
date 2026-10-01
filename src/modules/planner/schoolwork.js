/**
 * The three ways to see schoolwork (sticky notes, list, calendar) - pure
 * grouping and ordering, no React, no `new Date` for calendar days (they are
 * 'YYYY-MM-DD' keys). Tested in schoolwork.test.js.
 *
 * Every view shows the same server plan: the same work (GET /students/:id/work),
 * the same priority order (plan.priorities), the same deadlines, subject
 * colours and task details. Only the layout changes.
 */
import { addDaysKey, daysBetween, groupWorkByDue, groupWorkBySubject, toMinutes } from './planView.js';

/** The views a student (or their parent) can choose, in the order the settings screen shows them. */
export const VIEW_OPTIONS = Object.freeze([
  { key: 'board', label: 'Sticky notes', hint: 'Visual' },
  { key: 'list', label: 'List', hint: 'Checklist' },
  { key: 'calendar', label: 'Calendar', hint: 'Schedule' },
]);

export const VIEW_KEYS = VIEW_OPTIONS.map((v) => v.key);

/** Sticky-note board columns. `progress` on each piece of work comes from its real status (server). */
export const COLUMNS = Object.freeze([
  { key: 'todo', label: 'To Do' },
  { key: 'doing', label: 'Doing' },
  { key: 'done', label: 'Done' },
]);

/** How the list can be ordered. "Priority" is the plan's own order: due date and urgency. */
export const LIST_ORDERS = Object.freeze([
  { key: 'priority', label: 'Priority' },
  { key: 'next3', label: 'Next 3' },
  { key: 'due', label: 'Due date' },
  { key: 'subject', label: 'Subject' },
]);

const byTitle = (a, b) => String(a.title ?? '').localeCompare(String(b.title ?? ''));
const dueKey = (w) => w.dueDate ?? '9999-12-31';

/**
 * The plan's order: the server's priority rank first (deadline, effort left,
 * carry-over, checkpoints), then the soonest due date, then the title. Work
 * the planner hasn't ranked (e.g. just added) follows the ranked work.
 */
export function orderByPlan(work = [], priorities = []) {
  const rank = new Map((priorities ?? []).map((p, i) => [p.assignmentId, i]));
  const r = (w) => (rank.has(w.id) ? rank.get(w.id) : Number.MAX_SAFE_INTEGER);
  return [...work].sort((a, b) => r(a) - r(b) || dueKey(a).localeCompare(dueKey(b)) || byTitle(a, b));
}

/** Most recently finished first. */
const byFinished = (a, b) => String(b.completedAt ?? '').localeCompare(String(a.completedAt ?? '')) || byTitle(a, b);

/** { todo, doing, done } in plan order (Done: most recently finished first). */
export function boardColumns(work = [], priorities = []) {
  const columns = { todo: [], doing: [], done: [] };
  for (const w of orderByPlan(work, priorities)) (columns[w.progress] ?? columns.todo).push(w);
  columns.done.sort(byFinished);
  return columns;
}

/**
 * The list's sections for an order ('priority' | 'next3' | 'due' | 'subject').
 * Open work only, except that finished work gathers in a last 'done' section
 * (not for Next 3). Section keys: priority · next3 · overdue/today/week/later/none
 * (by due date) · subject:<name> · done.
 */
export function listSections(work = [], priorities = [], order = 'priority', today) {
  const open = work.filter((w) => w.progress !== 'done');
  const done = work.filter((w) => w.progress === 'done').sort(byFinished);
  const tail = done.length ? [{ key: 'done', items: done }] : [];
  if (order === 'next3') return [{ key: 'next3', items: orderByPlan(open, priorities).slice(0, 3) }];
  if (order === 'due') return [...groupWorkByDue(open, today).map((g) => ({ key: g.key, items: g.items })), ...tail];
  if (order === 'subject') {
    return [...groupWorkBySubject(open).map((g) => ({ key: `subject:${g.subject ?? ''}`, subject: g.subject, items: g.items })), ...tail];
  }
  return [{ key: 'priority', items: orderByPlan(open, priorities) }, ...tail];
}

/**
 * When something is due, relative to `today`, for the label under a note:
 *   none · overdue (days late) · today · tomorrow · soon (2-6 days: say the
 *   weekday) · later (say the date)
 */
export function dueInfo(dueDate, today) {
  if (!dueDate) return { kind: 'none' };
  const days = daysBetween(today, String(dueDate).slice(0, 10));
  if (days < 0) return { kind: 'overdue', days: -days };
  if (days === 0) return { kind: 'today', days };
  if (days === 1) return { kind: 'tomorrow', days };
  if (days <= 6) return { kind: 'soon', days };
  return { kind: 'later', days };
}

/** Personal events grouped by day key, each day in time order (all-day first). */
export function eventsByDay(events = []) {
  const map = new Map();
  for (const e of events) {
    if (!map.has(e.date)) map.set(e.date, []);
    map.get(e.date).push(e);
  }
  map.forEach((list) => list.sort((a, b) => Number(b.allDay) - Number(a.allDay) || String(a.start ?? '').localeCompare(String(b.start ?? ''))));
  return map;
}

/** Personal events from `today` through `days - 1` days ahead (for the board / list when shown there). */
export function upcomingEvents(events = [], today, days = 7) {
  const last = addDaysKey(today, days - 1);
  return events.filter((e) => e.date >= today && e.date <= last);
}

/**
 * The buttons under a sticky note / on a list row for the moves the server
 * allows (`work.moves`): Start (→ Doing), Done (→ Done), Back to To Do, Not
 * done yet (Done → Doing). Teacher work in Doing gets "Hand in" instead, which
 * opens the assignment - handing in happens there.
 */
export function moveActions(work) {
  const moves = work?.moves ?? [];
  const actions = [];
  if (moves.includes('doing')) actions.push({ to: 'doing', label: work.progress === 'done' ? 'Not done yet' : 'Start' });
  if (moves.includes('done')) actions.push({ to: 'done', label: 'Done' });
  if (moves.includes('todo')) actions.push({ to: 'todo', label: 'Back to To Do' });
  if (work?.kind === 'teacher' && work.progress === 'doing') actions.push({ to: 'handIn', label: 'Hand in' });
  return actions;
}

/** Whether the list's tick circle can finish or reopen this work right there (own and parent-added work). */
export function canTick(work) {
  const moves = work?.moves ?? [];
  return work?.progress === 'done' ? moves.includes('todo') : moves.includes('done');
}

/**
 * One day of the full calendar: the planner's study times and the student's
 * personal events (practice, dinner, plans) in time order - all-day events
 * first, an event before a study time that starts at the same minute.
 * `minutesOf(block)` gives a study time's local start (minutes past midnight
 * in the student's zone); events already carry local 'HH:MM'.
 */
export function agendaItems(blocks = [], events = [], minutesOf = () => 0) {
  const items = [
    ...blocks.map((b) => ({ kind: 'study', key: `study:${b.id}`, at: minutesOf(b) ?? 0, item: b })),
    ...events.map((e) => ({ kind: 'event', key: `event:${e.id}`, at: e.allDay || !e.start ? -1 : toMinutes(e.start), item: e })),
  ];
  return items.sort((a, b) => a.at - b.at || (a.kind === b.kind ? 0 : a.kind === 'event' ? -1 : 1));
}

/** 7 day keys from `startKey`. */
export function weekKeys(startKey, count = 7) {
  return Array.from({ length: count }, (_, i) => addDaysKey(startKey, i));
}
