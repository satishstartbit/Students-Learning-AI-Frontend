/**
 * Pure grouping for the plan screens (no React, no dates through `new Date`
 * for calendar days - they are 'YYYY-MM-DD' keys, compared as strings).
 * Tested in planView.test.js.
 */

const parseKey = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

/** Days from `fromKey` to `toKey` (both 'YYYY-MM-DD'). */
export const daysBetween = (fromKey, toKey) => Math.round((parseKey(toKey) - parseKey(fromKey)) / 86_400_000);

export const addDaysKey = (key, n) => new Date(parseKey(key) + n * 86_400_000).toISOString().slice(0, 10);

/**
 * Today / Next / Later (PDF Q5, Q9): each piece of work goes where its first
 * scheduled study time is - today (or overdue) → Today, within `nextDays` →
 * Next, anything further or not yet scheduled → Later. Order inside a group
 * is the server's priority order.
 */
export function groupPriorities(priorities = [], blocks = [], today, { nextDays = 7 } = {}) {
  const firstBlock = new Map();
  for (const b of blocks) {
    if (b.status !== 'scheduled' || !b.assignmentId) continue;
    const seen = firstBlock.get(b.assignmentId);
    if (!seen || b.date < seen) firstBlock.set(b.assignmentId, b.date);
  }
  const groups = { today: [], next: [], later: [] };
  priorities.forEach((p, i) => {
    const item = { ...p, rank: i + 1, firstDate: firstBlock.get(p.assignmentId) ?? null };
    const overdue = p.dueDate && p.dueDate < today;
    if (overdue || (item.firstDate && item.firstDate <= today)) groups.today.push(item);
    else if (item.firstDate && daysBetween(today, item.firstDate) <= nextDays) groups.next.push(item);
    else groups.later.push(item);
  });
  return groups;
}

/** Work by due date: Overdue, Today, This week, Later, No due date. */
export function groupWorkByDue(work = [], today) {
  const order = ['overdue', 'today', 'week', 'later', 'none'];
  const buckets = Object.fromEntries(order.map((k) => [k, []]));
  for (const w of work) {
    if (!w.dueDate) buckets.none.push(w);
    else if (w.dueDate < today) buckets.overdue.push(w);
    else if (w.dueDate === today) buckets.today.push(w);
    else if (daysBetween(today, w.dueDate) <= 7) buckets.week.push(w);
    else buckets.later.push(w);
  }
  const byDue = (a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? '') || a.title.localeCompare(b.title);
  return order.filter((k) => buckets[k].length).map((k) => ({ key: k, items: buckets[k].sort(byDue) }));
}

/** Work by subject, A-Z, with "no subject" last. */
export function groupWorkBySubject(work = []) {
  const map = new Map();
  for (const w of work) {
    const key = w.subject || '';
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(w);
  }
  return [...map.entries()]
    .sort(([a], [b]) => (a === '' ? 1 : b === '' ? -1 : a.localeCompare(b)))
    .map(([subject, items]) => ({
      key: subject || 'none',
      subject: subject || null,
      items: items.sort((x, y) => (x.dueDate ?? '9999').localeCompare(y.dueDate ?? '9999') || x.title.localeCompare(y.title)),
    }));
}

/** Study times per local day, in time order. */
export function blocksByDay(blocks = []) {
  const map = new Map();
  for (const b of blocks) {
    if (!map.has(b.date)) map.set(b.date, []);
    map.get(b.date).push(b);
  }
  map.forEach((list) => list.sort((a, b) => String(a.startAt).localeCompare(String(b.startAt))));
  return map;
}

/**
 * Who added a piece of work, from the viewer's side (PDF Q13, Q15). Never
 * says "teacher" unless the work really came from a teacher.
 */
export function sourceLabel(source, viewer = 'student') {
  if (source === 'teacher') return 'From a teacher';
  if (source === 'parent') return viewer === 'parent' ? 'Added by a parent' : 'Added by your parent';
  if (source === 'student') return viewer === 'parent' ? 'Added by your child' : 'Added by you';
  return 'Added';
}

/** Minutes as "1 h 15 min" / "40 min". */
export function minutesLabel(minutes) {
  const m = Math.max(0, Math.round(Number(minutes) || 0));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h} h ${rest} min` : `${h} h`;
}

/** Sort key for Home's task list: the student's own order first, then the plan's priority, then due date. */
export function planRankMap(priorities = []) {
  return new Map(priorities.map((p, i) => [p.assignmentId, i]));
}

/** "HH:MM" → minutes since midnight. */
export const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + m;
};

/** Validates a day's study times: each ends after it starts, none overlap. Returns an error message or null. */
export function windowProblem(windows = []) {
  const sorted = [...windows].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  for (const [i, w] of sorted.entries()) {
    if (!w.start || !w.end) return 'Choose a start and end time';
    if (toMinutes(w.end) <= toMinutes(w.start)) return 'Each study time must end after it starts';
    if (i > 0 && toMinutes(w.start) < toMinutes(sorted[i - 1].end)) return 'Study times on the same day overlap';
  }
  return null;
}
