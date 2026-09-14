/**
 * Date helpers built on Intl - no date library dependency.
 *
 * The API returns TIMESTAMPTZ (UTC, ISO 8601); these render it in the
 * signed-in user's own locale and timezone (utils/locale.js), not the
 * browser's - Canada spans six timezones, so "the browser's local time" is
 * not a safe stand-in for "the user's timezone" the way it might be for a
 * single-timezone country. Pass `timeZone`/`locale` in `options` to override
 * per call; every function here defaults to the active user preference.
 */
import { getActiveLocale, getActiveTimezone } from './locale';

export function toDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export const isValidDate = (value) => toDate(value) !== null;

export function formatDate(value, { locale, timeZone, ...options } = {}) {
  const d = toDate(value);
  if (!d) return '';
  return new Intl.DateTimeFormat(locale ?? getActiveLocale(), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: timeZone ?? getActiveTimezone(),
    ...options,
  }).format(d);
}

export function formatDateTime(value, { locale, timeZone, ...options } = {}) {
  const d = toDate(value);
  if (!d) return '';
  return new Intl.DateTimeFormat(locale ?? getActiveLocale(), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timeZone ?? getActiveTimezone(),
    ...options,
  }).format(d);
}

export function formatTime(value, { locale, timeZone, ...options } = {}) {
  const d = toDate(value);
  if (!d) return '';
  return new Intl.DateTimeFormat(locale ?? getActiveLocale(), {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timeZone ?? getActiveTimezone(),
    ...options,
  }).format(d);
}

/** The parts of `value` as a wall clock in the active (or given) timezone shows them. */
function zonedParts(value, timeZone) {
  const d = toDate(value);
  if (!d) return null;
  const parts = new Intl.DateTimeFormat(getActiveLocale(), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    numberingSystem: 'latn',
    timeZone: timeZone ?? getActiveTimezone(),
  }).formatToParts(d);
  return Object.fromEntries(parts.map((p) => [p.type, p.value]));
}

/** Hour of the day (0-23) in the user's timezone - e.g. for "Good morning". */
export function getHourInTimezone(value = new Date(), { timeZone } = {}) {
  const parts = zonedParts(value, timeZone);
  return parts ? Number(parts.hour) % 24 : null;
}

/** "2026-09-11" for the calendar day `value` falls on in the user's timezone. */
export function getDateKey(value = new Date(), { timeZone } = {}) {
  const parts = zonedParts(value, timeZone);
  return parts ? `${parts.year}-${parts.month}-${parts.day}` : '';
}

/**
 * Formats a calendar day key ("2026-10-14", as getDateKey returns). A day
 * is not an instant, so there is no timezone to convert through: parsing
 * "2026-10-14" as a timestamp would land on Oct 13 anywhere west of UTC.
 * Use this for calendar and planner cells.
 */
export function formatDateKey(dateKey, { locale, ...options } = {}) {
  const [year, month, day] = String(dateKey ?? '').split('-').map(Number);
  if (!year || !month || !day) return '';
  return new Intl.DateTimeFormat(locale ?? getActiveLocale(), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

/** Long-form Canadian date: "September 10, 2026". */
export function formatLongDate(value, options = {}) {
  return formatDate(value, { month: 'long', ...options });
}

/**
 * YYYY-MM-DD in the active (or given) user timezone - the format
 * `<input type="date">` and DATE columns expect.
 *
 * Reads the wall-clock date via `zonedParts` rather than `Date#getFullYear`
 * etc., which read the *browser's* local timezone - since Canada is
 * entirely UTC-negative, that rolls a UTC-midnight value back a day (see
 * `formatDateKey` above for the same class of bug on calendar-day keys).
 */
export function toDateInputValue(value, { timeZone } = {}) {
  const parts = zonedParts(value, timeZone);
  if (!parts) return '';
  return `${parts.year}-${parts.month}-${parts.day}`;
}

/** HH:MM in the active (or given) user timezone. */
export function toTimeInputValue(value, { timeZone } = {}) {
  const parts = zonedParts(value, timeZone);
  if (!parts) return '';
  return `${parts.hour}:${parts.minute}`;
}

export const startOfDay = (value = new Date()) => {
  const d = toDate(value);
  if (!d) return null;
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

export const addDays = (value, days) => {
  const d = toDate(value);
  if (!d) return null;
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
};

/** Whole days from today to `value`. Negative means overdue. */
export function daysUntil(value) {
  const target = startOfDay(value);
  if (!target) return null;
  const today = startOfDay(new Date());
  return Math.round((target - today) / 86400000);
}

export const isPast = (value) => {
  const d = toDate(value);
  return d ? d.getTime() < Date.now() : false;
};

export const isToday = (value) => daysUntil(value) === 0;

export const isOverdue = (dueDate) => {
  const days = daysUntil(dueDate);
  return days !== null && days < 0;
};

export function compareDates(a, b) {
  const da = toDate(a);
  const db = toDate(b);
  if (!da && !db) return 0;
  if (!da) return 1;
  if (!db) return -1;
  return da - db;
}

/** "in 3 days", "yesterday", "2 weeks ago" */
export function formatRelative(value) {
  const days = daysUntil(value);
  if (days === null) return '';

  const rtf = new Intl.RelativeTimeFormat(getActiveLocale(), { numeric: 'auto' });
  if (Math.abs(days) < 7) return rtf.format(days, 'day');
  if (Math.abs(days) < 30) return rtf.format(Math.round(days / 7), 'week');
  return rtf.format(Math.round(days / 30), 'month');
}

/** Human label for a due date - what assignment cards show. */
export function formatDueDate(dueDate) {
  const days = daysUntil(dueDate);
  if (days === null) return 'No due date';
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days < 0) return `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}`;
  if (days <= 7) return `Due in ${days} days`;
  return `Due ${formatDate(dueDate)}`;
}

/** Minutes -> "1h 25m" */
export function formatDuration(minutes) {
  const total = Number(minutes);
  if (!Number.isFinite(total) || total < 0) return '';
  const h = Math.floor(total / 60);
  const m = Math.round(total % 60);
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default {
  toDate,
  isValidDate,
  formatDate,
  formatDateTime,
  formatTime,
  formatLongDate,
  getHourInTimezone,
  getDateKey,
  formatDateKey,
  toDateInputValue,
  toTimeInputValue,
  daysUntil,
  isOverdue,
  isToday,
  compareDates,
  formatRelative,
  formatDueDate,
  formatDuration,
};
