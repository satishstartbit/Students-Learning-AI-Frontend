/**
 * How the K-5 Home lays out the student's to-do work - pure (no React, no
 * locale config), so node:test can check it. The page passes today's day key
 * in the student's own timezone and a function that turns a due date into a
 * day key (utils/date.js), so nothing here reads a clock.
 *
 * The order is useMyTasks' (soonest due first), unchanged: the first task is
 * "Your next task", exactly as before. The rest is only grouped for the
 * mockup's two lists.
 */

const ADD_DAY = 86_400_000;

/** Day key `n` days after `key` - plain calendar arithmetic, no timezone. */
export function addDaysToDayKey(key, n) {
  const [y, m, d] = String(key ?? '').slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return '';
  return new Date(Date.UTC(y, m - 1, d) + n * ADD_DAY).toISOString().slice(0, 10);
}

/** 0 = Monday ... 6 = Sunday. */
function weekdayOf(key) {
  const [y, m, d] = key.split('-').map(Number);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

/**
 * Why a task is "still to finish" rather than a fresh one for today:
 *   'returned'  the teacher sent it back
 *   'started'   the student already began it
 *   'yesterday' it was due yesterday
 *   'earlier'   it was due before that
 * null for everything else.
 */
export function carriedReason(task, { todayKey, dueKeyOf }) {
  if (task?.status === 'returned') return 'returned';
  const due = dueKeyOf(task?.assignment?.dueDate);
  if (due && due < todayKey) return due === addDaysToDayKey(todayKey, -1) ? 'yesterday' : 'earlier';
  if (task?.status === 'in_progress') return 'started';
  return null;
}

/**
 * The Home's lists from the to-do work (already in useMyTasks' order).
 *
 * @returns {{
 *   next: object|null,         Your next task (the first, as always)
 *   still: Array<{ task, reason }>,  Still to finish (at most `maxStill`)
 *   others: object[],          Other tasks (at most `maxOthers`)
 *   othersAllToday: boolean,   every one of `others` is due today
 *   moreCount: number,         to-do work not shown on the page
 *   tomorrowTask: object|null, a task due tomorrow that isn't shown
 * }}
 */
export function groupHomeTasks(toDo, { todayKey, dueKeyOf, maxStill = 2, maxOthers = 4 }) {
  const [next = null, ...later] = Array.isArray(toDo) ? toDo : [];
  const still = [];
  const fresh = [];
  for (const task of later) {
    const reason = carriedReason(task, { todayKey, dueKeyOf });
    if (reason && still.length < maxStill) still.push({ task, reason });
    else fresh.push(task);
  }
  const others = fresh.slice(0, maxOthers);
  const hidden = fresh.slice(maxOthers);
  const tomorrowKey = addDaysToDayKey(todayKey, 1);

  return {
    next,
    still,
    others,
    othersAllToday: others.length > 0 && others.every((t) => dueKeyOf(t.assignment?.dueDate) === todayKey),
    moreCount: hidden.length,
    tomorrowTask: hidden.find((t) => dueKeyOf(t.assignment?.dueDate) === tomorrowKey) ?? null,
  };
}

/**
 * "This week": Monday to Friday of this school week (next week's on a
 * weekend), how much is due each day, and what comes next after today.
 *
 * @returns {{
 *   days: Array<{ key, isToday, isPast, due: number }>,
 *   nextWeek: boolean,
 *   upcoming: { key, task, tomorrow: boolean } | null
 * }}
 */
export function weekAtAGlance(toDo, { todayKey, dueKeyOf }) {
  const weekday = weekdayOf(todayKey);
  const nextWeek = weekday > 4;
  const monday = addDaysToDayKey(todayKey, nextWeek ? 7 - weekday : -weekday);
  const dueOn = new Map();
  for (const task of toDo ?? []) {
    const key = dueKeyOf(task.assignment?.dueDate);
    if (key) dueOn.set(key, (dueOn.get(key) ?? 0) + 1);
  }
  const days = Array.from({ length: 5 }, (_, i) => {
    const key = addDaysToDayKey(monday, i);
    return { key, isToday: key === todayKey, isPast: key < todayKey, due: dueOn.get(key) ?? 0 };
  });

  const tomorrowKey = addDaysToDayKey(todayKey, 1);
  const upcomingTask = (toDo ?? [])
    .filter((t) => (dueKeyOf(t.assignment?.dueDate) ?? '') > todayKey)
    .sort((a, b) => dueKeyOf(a.assignment.dueDate).localeCompare(dueKeyOf(b.assignment.dueDate)))[0];
  const upcomingKey = upcomingTask ? dueKeyOf(upcomingTask.assignment.dueDate) : null;

  return {
    days,
    nextWeek,
    upcoming: upcomingTask ? { key: upcomingKey, task: upcomingTask, tomorrow: upcomingKey === tomorrowKey } : null,
  };
}
