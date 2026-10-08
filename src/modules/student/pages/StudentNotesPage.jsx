import { useEffect, useState } from 'react';
import { LuPlus } from 'react-icons/lu';
import { Button, ConfirmationModal, PageHeader } from '../../../components/common';
import { toast } from '../../../hooks/useToast';
import { getErrorMessage } from '../../../utils/errorHandler';
import NoteEditorModal from '../components/NoteEditorModal';
import NotesListView from '../components/notes/NotesListView';
import { NOTES_CHANGED_EVENT, NOTE_REMINDERS_DELIVERED_EVENT } from '../noteReminders';
import noteService from '../services/note.service';

const CONFIRM_COPY = {
  done: {
    title: 'Mark this note done?',
    message: "A note that's done stays done - you can't undo this.",
    confirmLabel: 'Mark done',
    variant: 'primary',
  },
  delete: {
    title: 'Delete this note?',
    message: 'This note will be gone for good.',
    confirmLabel: 'Delete note',
    variant: 'danger',
  },
};

/**
 * "My notes" (/student/notes) - every note the student has written, Home and
 * assignment ones, with filters (search, when, status) and pages. Home only
 * shows yesterday onwards; anything older is found here. Add, edit, mark done
 * (final, asked first) and delete.
 */
export default function StudentNotesPage() {
  // Note dialog: undefined = closed, null = add, a note = edit.
  const [editing, setEditing] = useState(undefined);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  // Saved here or elsewhere (the reminder pop-up, another tab): fetch again.
  useEffect(() => {
    const reload = () => setReloadToken((n) => n + 1);
    window.addEventListener(NOTES_CHANGED_EVENT, reload);
    window.addEventListener(NOTE_REMINDERS_DELIVERED_EVENT, reload);
    return () => {
      window.removeEventListener(NOTES_CHANGED_EVENT, reload);
      window.removeEventListener(NOTE_REMINDERS_DELIVERED_EVENT, reload);
    };
  }, []);

  const save = async (values) => {
    // On failure the dialog stays open with the student's text intact.
    try {
      if (editing) await noteService.update(editing.id, values);
      else await noteService.create(values);
    } catch (err) {
      toast.error(getErrorMessage(err));
      return;
    }
    toast.success(editing ? 'Note saved.' : 'Note added.');
    setEditing(undefined);
  };

  const runConfirmed = async () => {
    const { type, note } = confirm;
    setBusy(true);
    try {
      if (type === 'done') await noteService.update(note.id, { status: 'done' });
      else await noteService.remove(note.id);
      toast.success(type === 'done' ? 'Marked done.' : 'Note deleted.');
      setConfirm(null);
      setEditing(undefined);
      window.dispatchEvent(new Event(NOTES_CHANGED_EVENT));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const copy = confirm ? CONFIRM_COPY[confirm.type] : null;

  return (
    <div className="td-page">
      <PageHeader
        title="My notes"
        description="Every note you've written. Home shows yesterday, today and what's coming up - use the filters to find older ones."
        actions={
          <Button type="button" startIcon={<LuPlus />} onClick={() => setEditing(null)}>
            Add a note
          </Button>
        }
      />

      <NotesListView
        load={noteService.list}
        reloadToken={reloadToken}
        assignmentPath={(note) => `/student/assignments/${note.assignment.id}`}
        onEdit={(note) => setEditing(note)}
        onMarkDone={(note) => setConfirm({ type: 'done', note })}
        onDelete={(note) => setConfirm({ type: 'delete', note })}
      />

      <NoteEditorModal
        isOpen={editing !== undefined}
        note={editing}
        onClose={() => setEditing(undefined)}
        onSave={save}
        onDelete={(note) => setConfirm({ type: 'delete', note })}
      />

      <ConfirmationModal
        isOpen={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={runConfirmed}
        loading={busy}
        variant={copy?.variant}
        title={copy?.title ?? ''}
        message={copy?.message ?? ''}
        confirmLabel={copy?.confirmLabel ?? ''}
      />
    </div>
  );
}
