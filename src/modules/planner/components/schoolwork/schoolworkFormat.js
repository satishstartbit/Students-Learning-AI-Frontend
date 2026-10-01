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
