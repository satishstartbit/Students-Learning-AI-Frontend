import { ASSIGNMENT_RECIPIENT_STATUS as STATUS } from '../../../../utils/constants';
import { daysUntil, daysUntilDateKey, formatDate, formatDateKey, isDateKey } from '../../../../utils/date';

/**
 * "Opens Friday" / "Opens Oct 20" when work's start day is still ahead (a
 * teacher can schedule work to start later); null once it has opened.
 */
export function opensLabel(startDate) {
  if (!isDateKey(startDate)) return null;
  const days = daysUntilDateKey(startDate);
  if (days === null || days <= 0) return null;
  return days < 7
    ? `Opens ${formatDateKey(startDate, { weekday: 'long', month: undefined, day: undefined, year: undefined })}`
    : `Opens ${formatDateKey(startDate, { year: undefined })}`;
}

/**
 * Wording for young readers. "Overdue by 3 days" and "In progress" are
 * adult vocabulary; these say the same thing in words a Grade 1 student
 * knows. Dates still go through utils/date.js (the student's own timezone).
 */

const TODO_STATUSES = [STATUS.ASSIGNED, STATUS.IN_PROGRESS, STATUS.RETURNED];

/**
 * Due-date chip text and tone.
 * @returns {{ label: string, tone: 'late'|'today'|'soon'|'later' } | null}
 */
export function getDueInfo(dueDate, status) {
  const days = daysUntil(dueDate);
  if (days === null) return null;

  if (days < 0) {
    // Only nag about lateness while the work is still the student's to do.
    return TODO_STATUSES.includes(status) ? { label: 'Late', tone: 'late' } : null;
  }
  if (days === 0) return { label: 'Due today', tone: 'today' };
  if (days === 1) return { label: 'Due tomorrow', tone: 'soon' };
  if (days < 7) return { label: `Due ${formatDate(dueDate, { weekday: 'long', year: undefined, month: undefined, day: undefined })}`, tone: 'later' };
  return { label: `Due ${formatDate(dueDate, { year: undefined })}`, tone: 'later' };
}

/** Plain-language status, used as the accessible name of the status circle. */
export const STATUS_WORDS = {
  [STATUS.ASSIGNED]: 'Not started yet',
  [STATUS.IN_PROGRESS]: 'Started',
  [STATUS.RETURNED]: 'Your teacher sent it back to fix',
  [STATUS.SUBMITTED]: 'Sent to your teacher',
  [STATUS.REVIEWED]: 'Done!',
  [STATUS.COMPLETED]: 'Done!',
};

/** The call to action on a task, by status. */
export function getStartLabel(status) {
  if (status === STATUS.IN_PROGRESS) return 'Keep going!';
  if (status === STATUS.RETURNED) return "Let's fix it!";
  return "Let's go!";
}

/**
 * A rough "how big is this" indicator (1-3 stars) for the My Week cards,
 * from estimated minutes - there's no stored difficulty/effort field, so
 * this stands in for one using the one size-ish signal already on every
 * assignment, rather than inventing a fake field.
 */
export function starsForMinutes(minutes) {
  const n = Number(minutes);
  if (!Number.isFinite(n) || n <= 0) return 1;
  if (n <= 15) return 1;
  if (n <= 25) return 2;
  return 3;
}

/** "25 min" - estimated minutes as a short, readable duration. */
export function formatMinutes(minutes) {
  const n = Number(minutes);
  if (!Number.isFinite(n) || n <= 0) return '';
  if (n < 60) return `${Math.round(n)} min`;
  const h = Math.floor(n / 60);
  const m = Math.round(n % 60);
  return m ? `${h} hr ${m} min` : `${h} hr`;
}
