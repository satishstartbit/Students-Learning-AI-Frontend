import { formatClockTime, formatDateKey } from '../../../../utils/date';
import { dueInfo } from '../../schoolwork';

/**
 * Display text for the schoolwork views. Due dates are day keys (the
 * student's own days); busy times are wall-clock HH:MM - neither goes
 * through `new Date` in the viewer's zone.
 */

const short = { weekday: 'short', month: 'short', day: 'numeric', year: undefined };

/** "Due today", "Due Monday", "Due Oct 3", "Overdue · was due Mon, Sep 23", "No due date". */
export function dueText(dueDate, today) {
  const info = dueInfo(dueDate, today);
  switch (info.kind) {
    case 'none':
      return 'No due date';
    case 'overdue':
      return `Overdue · was due ${formatDateKey(dueDate, short)}`;
    case 'today':
      return 'Due today';
    case 'tomorrow':
      return 'Due tomorrow';
    case 'soon':
      return `Due ${formatDateKey(dueDate, { weekday: 'long', month: undefined, day: undefined, year: undefined })}`;
    default:
      return `Due ${formatDateKey(dueDate, { month: 'short', day: 'numeric', year: undefined })}`;
  }
}

/** The Plan mockup's due line: "Due today", "Due tomorrow", "Due in 4 days", "Overdue"; null without a date. */
export function dueInText(dueDate, today) {
  const info = dueInfo(dueDate, today);
  switch (info.kind) {
    case 'none':
      return null;
    case 'overdue':
      return info.days === 1 ? 'Overdue · 1 day' : `Overdue · ${info.days} days`;
    case 'today':
      return 'Due today';
    case 'tomorrow':
      return 'Due tomorrow';
    default:
      return `Due in ${info.days} days`;
  }
}

/** K-4's day chip: "Today", "Tomorrow", "Thursday" (this week), "Oct 20" (later), "Late"; null without a date. */
export function kidDayText(dueDate, today) {
  const info = dueInfo(dueDate, today);
  switch (info.kind) {
    case 'none':
      return null;
    case 'overdue':
      return 'Late';
    case 'today':
      return 'Today';
    case 'tomorrow':
      return 'Tomorrow';
    case 'soon':
      return formatDateKey(dueDate, { weekday: 'long', month: undefined, day: undefined, year: undefined });
    default:
      return formatDateKey(dueDate, { month: 'short', day: 'numeric', year: undefined });
  }
}

/** "40 min", "1 hr 20 min", "4 hr" - the mockups' short duration; '' for nothing. */
export function shortMinutes(minutes) {
  const total = Math.round(Number(minutes) || 0);
  if (total <= 0) return '';
  if (total < 60) return `${total} min`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

/** The time a piece of work should take: its estimate, else what its steps have left. */
export function estimateOf(work) {
  const minutes = Number(work?.estimatedMinutes) || Number(work?.remainingMinutes) || 0;
  return minutes > 0 ? minutes : null;
}

/** "4:15 p.m.–6:00 p.m." or "All day". */
export function eventTime(event) {
  if (event.allDay) return 'All day';
  const start = formatClockTime(event.start);
  return event.end ? `${start}–${formatClockTime(event.end)}` : start;
}

/** "Mon, Sep 28" for a day key. */
export const shortDay = (key) => formatDateKey(key, short);
