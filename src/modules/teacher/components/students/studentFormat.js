import { LuFrown, LuMeh, LuSmile } from 'react-icons/lu';
import { daysUntilDateKey, formatDate, formatDateKey, formatTime, getDateKey, getHourInTimezone } from '../../../../utils/date';

/**
 * Display rules shared by My Students and a student's page. Dates are always
 * read in the teacher's own timezone (utils/date reads it); check-in days
 * are calendar keys, so they're compared as keys, never as instants.
 */

/**
 * A mood's face and colour from its intensity (the Emotional States master's
 * extra.intensity_level, 1 = settled ... 5 = overwhelmed). Decoration only -
 * the words beside it always name the mood.
 */
export function moodVisual(intensity) {
  const n = Number(intensity);
  if (!n) return { icon: LuSmile, tone: 'none' };
  if (n <= 1) return { icon: LuSmile, tone: 'green' };
  if (n === 2) return { icon: LuSmile, tone: 'blue' };
  if (n === 3) return { icon: LuMeh, tone: 'lavender' };
  if (n === 4) return { icon: LuFrown, tone: 'orange' };
  return { icon: LuFrown, tone: 'pink' };
}

/** "today" / "yesterday" / "3 days ago" / "Sep 12" for a check-in day key. */
export function relativeDay(dateKey) {
  const days = daysUntilDateKey(dateKey);
  if (days === null) return '';
  if (days === 0) return 'today';
  if (days === -1) return 'yesterday';
  if (days < 0 && days > -7) return `${-days} days ago`;
  return formatDateKey(dateKey, { year: undefined });
}

/** "Today, 9:40 am" / "Yesterday" / "Sep 16, 2026" / "Never" for an instant. */
export function lastActiveLabel(value) {
  if (!value) return 'Never';
  const key = getDateKey(new Date(value));
  const today = getDateKey();
  if (key === today) return `Today, ${formatTime(value)}`;
  if (daysUntilDateKey(key) === -1) return 'Yesterday';
  return formatDate(value);
}

/**
 * The phone card's short line (the My Students mobile mockup): "Active
 * today" / "Active yesterday" / "Active Sep 16", or "Invited, not signed in".
 */
export function activeDayLabel(student) {
  if (student?.state === 'invited' || !student?.lastActiveAt) return 'Invited, not signed in';
  const key = getDateKey(new Date(student.lastActiveAt));
  const days = daysUntilDateKey(key);
  if (days === 0) return 'Active today';
  if (days === -1) return 'Active yesterday';
  return `Active ${formatDateKey(key, { year: undefined })}`;
}

/** "Today, 8:52 am" / "Thu, 8:40 am" (this week) / "Sep 12, 8:40 am" for a check-in time. */
export function checkInWhen(value) {
  if (!value) return '';
  const key = getDateKey(new Date(value));
  const days = daysUntilDateKey(key);
  if (days === 0) return `Today, ${formatTime(value)}`;
  if (days === -1) return `Yesterday, ${formatTime(value)}`;
  if (days > -7) return `${formatDate(value, { weekday: 'short', month: undefined, day: undefined, year: undefined })}, ${formatTime(value)}`;
  return `${formatDate(value, { year: undefined })}, ${formatTime(value)}`;
}

/** "this morning's" / "this afternoon's" / "Tuesday's" - which check-in something came from. */
export function partOfDayPhrase(at) {
  const key = getDateKey(new Date(at));
  if (daysUntilDateKey(key) !== 0) return `${formatDate(at, { weekday: 'long', month: undefined, day: undefined, year: undefined })}'s`;
  const hour = getHourInTimezone(new Date(at));
  if (hour < 12) return "this morning's";
  if (hour < 17) return "this afternoon's";
  return "this evening's";
}

export const initialsOf = (first, last) => `${(first ?? '').trim()[0] ?? ''}${(last ?? '').trim()[0] ?? ''}`.toUpperCase() || '?';

export const fullName = (s) => [s?.firstName, s?.lastName].filter(Boolean).join(' ');

/** Short hours/minutes: 80 -> "1h 20m", 35 -> "35m". */
export function focusLabel(minutes) {
  const m = Math.max(0, Math.round(Number(minutes) || 0));
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return m % 60 ? `${h}h ${m % 60}m` : `${h}h`;
}
