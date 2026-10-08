import { useCallback, useEffect, useState } from 'react';
import noteService from '../services/note.service';
import { NOTIFICATIONS_CHANGED_EVENT } from '../../notifications/notificationPath';
import {
  NOTES_CHANGED_EVENT,
  NOTE_REMINDERS_DELIVERED_EVENT,
  RETRY_WAIT_MS,
  mergeDelivered,
  showDeviceNotifications,
  waitBeforeNextCheck,
} from '../noteReminders';

/**
 * The student's note reminders, for the whole app (mounted once by
 * StudentLayout through NoteReminderHost). Asks the server:
 *  - as the app opens - anything whose time passed while away is shown now;
 *  - when the next reminder's time comes (a timer, re-armed after each ask);
 *  - when the tab comes back into view or the device back online (a sleeping
 *    laptop's timer runs late);
 *  - after a note is saved (NOTES_CHANGED_EVENT), so a new time is picked up.
 * Returns the reminders waiting to be read, and what to do with them.
 */
export function useNoteReminders() {
  const [due, setDue] = useState([]);

  useEffect(() => {
    let timer = null;
    let busy = false;
    let askAgain = false;
    let stopped = false;

    const check = async () => {
      if (stopped) return;
      if (busy) {
        // A note saved mid-ask: ask once more afterwards so its time is included.
        askAgain = true;
        return;
      }
      busy = true;
      clearTimeout(timer);
      let wait = RETRY_WAIT_MS;
      try {
        const { data } = await noteService.deliverReminders();
        const delivered = data?.delivered ?? [];
        wait = waitBeforeNextCheck(data?.next);
        if (delivered.length && !stopped) {
          setDue((current) => mergeDelivered(current, delivered));
          showDeviceNotifications(delivered);
          window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
          window.dispatchEvent(new Event(NOTE_REMINDERS_DELIVERED_EVENT));
        }
      } catch {
        // Offline or the server is busy - the 'online' event or the retry asks again.
      } finally {
        busy = false;
        if (!stopped) {
          timer = setTimeout(check, wait);
          if (askAgain) {
            askAgain = false;
            check();
          }
        }
      }
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };

    // Deferred a tick so the first ask isn't part of the mount itself.
    timer = setTimeout(check, 0);
    window.addEventListener('online', check);
    window.addEventListener(NOTES_CHANGED_EVENT, check);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      stopped = true;
      clearTimeout(timer);
      window.removeEventListener('online', check);
      window.removeEventListener(NOTES_CHANGED_EVENT, check);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const dismiss = useCallback(() => setDue([]), []);

  /** Ticks the note off from the pop-up; the note is then done everywhere. */
  const markDone = useCallback(async (note) => {
    await noteService.update(note.id, { status: 'done' });
    setDue((current) => current.filter((n) => n.id !== note.id));
    window.dispatchEvent(new Event(NOTES_CHANGED_EVENT));
  }, []);

  return { due, dismiss, markDone };
}

export default useNoteReminders;
