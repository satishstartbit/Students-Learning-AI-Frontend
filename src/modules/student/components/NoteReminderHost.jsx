import { useState } from 'react';
import { LuAlarmClock, LuCheck } from 'react-icons/lu';
import { Badge, Button, Modal } from '../../../components/common';
import { toast } from '../../../hooks/useToast';
import { formatNearDateTime } from '../../../utils/date';
import { getErrorMessage } from '../../../utils/errorHandler';
import { useNoteReminders } from '../hooks/useNoteReminders';
import './noteReminder.css';

/**
 * The note-reminder pop-up, mounted once for every student page
 * (StudentLayout). Shows each note whose reminder time has come - or came
 * while the student was away ("Missed") - with Mark done, and Got it to
 * close. The reminder is also in their notifications.
 */
export function NoteReminderHost() {
  const { due, dismiss, markDone } = useNoteReminders();
  const [finishing, setFinishing] = useState(null);

  if (!due.length) return null;

  const missedAny = due.some((note) => note.missed);
  const finish = async (note) => {
    setFinishing(note.id);
    try {
      await markDone(note);
      toast.success('Marked done.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setFinishing(null);
    }
  };

  return (
    <Modal
      isOpen
      onClose={dismiss}
      size="sm"
      title={due.length === 1 ? 'Reminder' : `Reminders (${due.length})`}
      description={missedAny ? "Here's what came up while you were away." : undefined}
      closeOnOverlayClick={false}
      footer={
        <Button type="button" onClick={dismiss}>
          Got it
        </Button>
      }
    >
      <ul className="nr-list">
        {due.map((note) => (
          <li key={note.id} className="nr-item" data-tone={note.tone || 'yellow'}>
            <p className="nr-item__when">
              <LuAlarmClock size={14} aria-hidden="true" />
              {formatNearDateTime(note.remindAt)}
              {note.missed && <Badge variant="warning">Missed</Badge>}
            </p>
            {note.title && <p className="nr-item__title">{note.title}</p>}
            <p className="nr-item__text">{note.content}</p>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              loading={finishing === note.id}
              onClick={() => finish(note)}
              startIcon={<LuCheck />}
            >
              Mark done
            </Button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}

export default NoteReminderHost;
