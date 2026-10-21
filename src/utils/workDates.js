/**
 * No work on a day that has already gone (user decision 2026-10-21): a due
 * date, start date or checkpoint must be today or later - teacher
 * assignments, added work (typed, voice, photo, PDF), a student's own tasks
 * and the calendars' "+ Add". The server refuses the same
 * (backend utils/workDates.js), so this is about saying so before Save.
 *
 * Day keys ('YYYY-MM-DD') compare as text, never through new Date().
 * `today` is the caller's: getDateKey() (the signed-in person's zone), or a
 * child's plan `today` on their calendar.
 *
 * A date that was already saved is never an error by itself, so older work
 * stays editable - only a date being set or changed is checked.
 */
export const PAST_DATE_MESSAGES = {
  dueDate: 'The due date has already passed. Choose today or a later date.',
  startDate: 'The start date has already passed. Choose today or a later date.',
};
export const PAST_DAY_MESSAGE = 'That day has already passed. Choose today or a later date.';
export const DUE_TIME_PASSED_MESSAGE = 'That time has already passed today. Choose a later time or another day.';

/** True for a day key before `today`. */
export const isPastDay = (dateKey, today) => Boolean(dateKey && today) && String(dateKey).slice(0, 10) < String(today);

/**
 * { field: message } for each date in `values` that is set, differs from
 * `saved`, and is before `today`. Empty when all is well.
 */
export function pastDateErrors(values, { today, saved = {}, fields = ['startDate', 'dueDate'] } = {}) {
  const errors = {};
  for (const field of fields) {
    const value = values?.[field];
    if (!value) continue;
    const day = String(value).slice(0, 10);
    if (saved?.[field] && String(saved[field]).slice(0, 10) === day) continue;
    if (isPastDay(day, today)) errors[field] = PAST_DATE_MESSAGES[field] ?? PAST_DAY_MESSAGE;
  }
  return errors;
}

/**
 * True when a deadline is today at a time that has gone. `nowMinutes` is the
 * wall clock now (minutes past midnight in the same zone as `today`);
 * `dueTime` is 'HH:MM'.
 */
export function dueTimePassed({ dueDate, dueTime, today, nowMinutes }) {
  if (!dueDate || !dueTime || String(dueDate).slice(0, 10) !== today || nowMinutes == null) return false;
  const match = /^(\d{1,2}):(\d{2})/.exec(String(dueTime));
  return Boolean(match) && Number(match[1]) * 60 + Number(match[2]) <= nowMinutes;
}
