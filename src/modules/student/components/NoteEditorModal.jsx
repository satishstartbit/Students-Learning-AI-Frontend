import { useState } from 'react';
import { LuAlarmClock } from 'react-icons/lu';
import { Modal, Input, Textarea, Button, StickyNoteColorPicker, DatePicker, TimePicker } from '../../../components/common';
import { formatNearDateTime, getDateKey, toDateInputValue, toTimeInputValue, zonedDateTimeToIso } from '../../../utils/date';
import { NOTES_CHANGED_EVENT, askToShowReminders, reminderPickProblem } from '../noteReminders';
import './noteReminder.css';

const isoOf = (value) => (value ? new Date(value).toISOString() : '');

/**
 * Add/edit dialog for one sticky note - the Home board's "My Notes" and an
 * assignment's Notes panel. Create when `note` is null, edit in place otherwise.
 *
 * Title, the note itself, a colour, and an optional reminder: a date and time
 * on the student's own clock (their time zone, utils/date.js), sent as UTC.
 * At that time the app pops the note up (NoteReminderHost); if they're away,
 * it pops up when they're back. Only a new or changed time is sent, so an old
 * reminder that already went off can be saved back unchanged.
 */
export function NoteEditorModal({ isOpen, note, onClose, onSave, onDelete }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tone, setTone] = useState('yellow');
  const [remindDate, setRemindDate] = useState('');
  const [remindTime, setRemindTime] = useState('');
  const [reminderError, setReminderError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [wasOpen, setWasOpen] = useState(isOpen);

  // Reset the form to whichever note (or blank, for "add") each time the
  // dialog opens - adjusted during render, not in an effect, so it lands
  // before this paint instead of one render late.
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setTitle(note?.title ?? '');
      setContent(note?.text ?? '');
      setTone(note?.tone ?? 'yellow');
      setRemindDate(note?.remindAt ? toDateInputValue(note.remindAt) : '');
      setRemindTime(note?.remindAt ? toTimeInputValue(note.remindAt) : '');
      setReminderError(null);
    }
  }

  const today = getDateKey();
  const originalIso = isoOf(note?.remindAt);
  // A time with no date means today.
  const pickedIso = remindTime ? zonedDateTimeToIso(remindDate || today, remindTime) : '';
  const reminderChanged = pickedIso !== originalIso || (Boolean(remindDate) && !remindTime);

  const changeReminder = (setter) => (event) => {
    setter(event.target.value);
    setReminderError(null);
  };
  const clearReminder = () => {
    setRemindDate('');
    setRemindTime('');
    setReminderError(null);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!content.trim()) return;
    const problem = reminderPickProblem({ dateKey: remindDate, time: remindTime, iso: pickedIso, changed: reminderChanged });
    if (problem) {
      setReminderError(problem);
      return;
    }
    // Asked while this click still counts as the student's own action.
    if (pickedIso && reminderChanged) askToShowReminders();

    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        content: content.trim(),
        tone,
        ...(reminderChanged ? { remindAt: pickedIso || null } : {}),
      });
    } finally {
      setSaving(false);
      // The reminder clock re-reads the next time (NoteReminderHost).
      window.dispatchEvent(new Event(NOTES_CHANGED_EVENT));
    }
  };

  let reminderHint = 'Pick a date and time to get a reminder.';
  if (pickedIso && !reminderChanged && note?.remindedAt) reminderHint = `Reminded ${formatNearDateTime(note.remindedAt)}.`;
  else if (pickedIso) reminderHint = `We'll remind you ${formatNearDateTime(pickedIso)} - or as soon as you're back, if you're away then.`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={note ? 'Edit note' : 'Add a note'} size="sm">
      <form onSubmit={handleSave} noValidate>
        <Input label="Title" hint="Optional" value={title} maxLength={255} onChange={(e) => setTitle(e.target.value)} />
        <Textarea
          label="Note"
          required
          rows={4}
          maxLength={2000}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <StickyNoteColorPicker value={tone} onChange={setTone} />

        <fieldset className="nr-when">
          <legend className="nr-when__label">
            <LuAlarmClock size={15} aria-hidden="true" />
            Remind me
          </legend>
          <div className="nr-when__fields">
            <DatePicker
              label="Date"
              name="remindDate"
              value={remindDate}
              min={today}
              onChange={changeReminder(setRemindDate)}
              reserveHelper={false}
            />
            <TimePicker
              label="Time"
              name="remindTime"
              value={remindTime}
              onChange={changeReminder(setRemindTime)}
              reserveHelper={false}
            />
          </div>
          <div className="nr-when__foot">
            {reminderError ? (
              <p className="nr-when__error" role="alert">
                {reminderError}
              </p>
            ) : (
              <p className="ui-hint nr-when__hint">{reminderHint}</p>
            )}
            {(remindDate || remindTime) && (
              <Button type="button" variant="ghost" size="sm" onClick={clearReminder}>
                No reminder
              </Button>
            )}
          </div>
        </fieldset>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-lg)' }}>
          <div>
            {note && onDelete && (
              <Button type="button" variant="danger" size="sm" onClick={() => onDelete(note)}>
                Delete
              </Button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={saving} disabled={!content.trim()}>
              {note ? 'Save' : 'Add note'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default NoteEditorModal;
