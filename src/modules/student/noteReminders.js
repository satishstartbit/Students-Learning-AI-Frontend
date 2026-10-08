/**
 * Note reminders on the student's side (backend: POST /notes/reminders/deliver,
 * services/stickyNote.service.js#deliverDueReminders).
 *
 * The student picks a date and time on a note. While the app is open,
 * `useNoteReminders` (mounted once in StudentLayout) asks the server at that
 * moment and the reminder pops up; when the student wasn't here at the time,
 * it pops up the next time the app opens or comes back online, marked
 * "Missed". The server delivers each reminder once (in-app notification too).
 */

/** Fired after a note is saved/changed, so the reminder clock re-reads the next time. */
export const NOTES_CHANGED_EVENT = 'notes:changed';
/** Fired after reminders were delivered, so lists showing notes can refresh. */
export const NOTE_REMINDERS_DELIVERED_EVENT = 'notes:reminders-delivered';

/** Even with nothing coming up, look again within the hour (a note set on another device). */
export const MAX_WAIT_MS = 60 * 60 * 1000;
/** After a failed ask (server busy), try again sooner. */
export const RETRY_WAIT_MS = 5 * 60 * 1000;
/** Ask a moment after the time, so the server agrees it has come. */
const WAKE_BUFFER_MS = 1000;

/** How long to wait before asking again, given the next reminder (`{ remindAt }`) or none. */
export function waitBeforeNextCheck(next, now = Date.now()) {
  const at = next?.remindAt ? new Date(next.remindAt).getTime() : NaN;
  if (Number.isNaN(at)) return MAX_WAIT_MS;
  return Math.min(Math.max(at - now + WAKE_BUFFER_MS, 0), MAX_WAIT_MS);
}

/**
 * Where a note's reminder stands: 'none', 'done' (the note is ticked off),
 * 'due' (its time has passed) or 'upcoming'.
 */
export function reminderStatus(note, now = Date.now()) {
  const at = note?.remindAt ? new Date(note.remindAt).getTime() : NaN;
  if (Number.isNaN(at)) return 'none';
  if (note.done || note.status === 'done') return 'done';
  return at <= now ? 'due' : 'upcoming';
}

/** A reminder may be set to "now" - a few seconds of typing shouldn't make it "in the past". */
const NOW_SLACK_MS = 30 * 1000;

/**
 * What's wrong with a reminder picked in the note dialog, or null: a date
 * with no time, or a moment already past. Only checked when the time changed
 * (an old reminder that went off can be saved back as it is).
 */
export function reminderPickProblem({ dateKey, time, iso, changed }, now = Date.now()) {
  if (!changed) return null;
  if (dateKey && !time) return 'Pick a time for the reminder.';
  if (iso && Date.parse(iso) < now - NOW_SLACK_MS) return "Pick a time that hasn't passed yet.";
  return null;
}

/** The words a reminder leads with: the title, else the start of the note. */
export function reminderHeading(note, max = 60) {
  const text = String(note?.title || note?.content || '').replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/** Adds newly delivered reminders to the ones still showing - once each, oldest first. */
export function mergeDelivered(current, delivered) {
  const byId = new Map(current.map((n) => [n.id, n]));
  for (const note of delivered ?? []) byId.set(note.id, note);
  return [...byId.values()].sort((a, b) => new Date(a.remindAt) - new Date(b.remindAt));
}

const canNotifyDevice = () => typeof window !== 'undefined' && 'Notification' in window;

/**
 * Asks once (the browser's own prompt) whether reminders may also show as a
 * device notification when the tab isn't in view. Call from a click - saving
 * a note with a reminder. Saying no changes nothing in the app.
 */
export function askToShowReminders() {
  if (!canNotifyDevice() || window.Notification.permission !== 'default') return;
  try {
    window.Notification.requestPermission()?.catch?.(() => {});
  } catch {
    // An old browser without the promise form - the in-app pop-up still works.
  }
}

/** A device notification per reminder, only when allowed and the app isn't in view. */
export function showDeviceNotifications(notes) {
  if (!canNotifyDevice() || window.Notification.permission !== 'granted') return;
  if (document.visibilityState === 'visible') return;
  for (const note of notes) {
    try {
      const shown = new window.Notification(`Reminder: ${reminderHeading(note)}`, {
        body: note.title ? reminderHeading({ content: note.content }, 120) : '',
        tag: `note-reminder-${note.id}`,
      });
      shown.onclick = () => {
        window.focus();
        shown.close();
      };
    } catch {
      // Some browsers only allow these from a service worker - the pop-up is waiting in the app.
    }
  }
}
