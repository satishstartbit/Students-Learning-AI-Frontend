import { useMemo } from 'react';
import { useMyTasks } from './useMyTasks';
import { addDays, getDateKey, isDateKey } from '../../../utils/date';

/**
 * The calendar day a task is due. `due_date` is a DATE column, so the API
 * sends a day key ("2026-10-07") - used as it is. Reading it through
 * getDateKey would parse it as midnight UTC, which is still the day before
 * everywhere in Canada, and file every task a day early. A full timestamp
 * (should one ever come) is read in the student's own timezone.
 */
const dueDayOf = (dueDate) => (isDateKey(dueDate) ? dueDate : getDateKey(dueDate));

/**
 * A calendar day as a fixed UTC-noon instant, from its "YYYY-MM-DD" key -
 * the same anchor formatDateKey uses. Safe to read back with plain
 * local-time Date methods (getDay, setDate, ...): noon UTC falls within the
 * same local calendar day for every real-world negative UTC offset this
 * app's six Canadian timezones use, so day-of-week and day-arithmetic on it
 * agree with the active timezone instead of the browser's own.
 */
function anchorFromKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

/**
 * The Monday on or before `date`, in the *active user's* timezone - not the
 * browser's. Computing this from `date.getDay()` directly (local time)
 * drifts a day whenever the device's own timezone differs from the user's
 * profile timezone (confirmed: it put Sunday first for a Toronto user on a
 * UTC-clocked device) - the same class of bug utils/timezone.js#getUtcRangeFor
 * exists to avoid on the backend.
 */
export function startOfWeek(date = new Date()) {
  const today = anchorFromKey(getDateKey(date));
  const day = today.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(today, diff);
}

/**
 * One assignment per calendar day - Monday through Sunday - bucketed by
 * `assignment.dueDate`, for the K-5 "My Week" page and the Grade 6+ "Plan"
 * page. Both read the same data (useMyTasks, already fetched for the Home
 * page's "today" view) and just group it differently, so this needed no new
 * endpoint - a task belongs on the day it's due.
 */
export function useWeekPlan(weekStart) {
  const tasks = useMyTasks();

  const all = useMemo(() => [...tasks.toDo, ...tasks.sent, ...tasks.done], [tasks.toDo, tasks.sent, tasks.done]);

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      const key = getDateKey(date);
      const items = all
        .filter((t) => t.assignment?.dueDate && dueDayOf(t.assignment.dueDate) === key)
        .sort((a, b) => (a.assignment?.title ?? '').localeCompare(b.assignment?.title ?? ''));
      return { date, key, items };
    });
  }, [all, weekStart]);

  return { days, isLoading: tasks.isLoading, error: tasks.error, reload: tasks.reload };
}

export default useWeekPlan;
