import { getDateKey, isDateKey } from '../../../../../utils/date';

/**
 * A due date as the student's calendar day, for the Home's lists
 * (homeTasks.js): a DATE value ("2026-10-07") already is one; a timestamp is
 * read in the student's own timezone (utils/date.js), never the browser's.
 */
export const dueDayKey = (dueDate) => (!dueDate ? null : isDateKey(dueDate) ? dueDate : getDateKey(dueDate) || null);

/** Today, as the student's calendar day. */
export const todayDayKey = () => getDateKey();
