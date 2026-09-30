import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LuArrowLeft, LuCalendar } from 'react-icons/lu';
import { ConfirmationModal, StatusBadge } from '../../../../components/common';
import { subjectPaint } from '../../../../components/subjects/subjectColor';
import { useSubjectColors } from '../../../../components/subjects/useSubjectColors';
import { useApi } from '../../../../hooks/useApi';
import { toast } from '../../../../hooks/useToast';
import { daysUntilDateKey, formatDateKey } from '../../../../utils/date';
import { getErrorMessage } from '../../../../utils/errorHandler';
import focusService from '../../services/focus.service';
import noteService from '../../services/note.service';
import { useFocusSteps } from '../../hooks/useFocusSteps';
import NoteEditorModal from '../NoteEditorModal';
import SubjectIcon from '../SubjectIcon';
import { getSubjectVisual } from '../subjectVisual';
import TaskBreakdown from './TaskBreakdown';
import { DetailsCard, NextStepCard, NotesCard, OverviewCard, ResourcesCard } from './AssignmentRail';
import './assignmentDetail.css';

/**
 * The Grade 6+ assignment page, built to the assignment mockup: header with
 * overall progress, the student's own task breakdown, their work, and a rail
 * with the overview, next step, resources, notes and details.
 *
 * The steps are the same plan the Focus page uses (/focus/steps), so ticking
 * one here or finishing it in a focus session both show up in the other
 * place. K-5 keeps the simpler page (AssignmentDetailPage).
 */

/** "Friday, 23 May · 9 days left" - due dates are calendar days, not instants. */
function dueLabel(dueDate) {
  if (!dueDate) return { text: 'No due date', overdue: false };
  const days = daysUntilDateKey(dueDate);
  const date = formatDateKey(dueDate, { weekday: 'long', month: 'long', day: 'numeric', year: undefined });
  if (days === null) return { text: date, overdue: false };
  if (days < 0) return { text: `${date} · ${Math.abs(days)} ${Math.abs(days) === 1 ? 'day' : 'days'} overdue`, overdue: true };
  if (days === 0) return { text: `${date} · due today`, overdue: false };
  if (days === 1) return { text: `${date} · 1 day left`, overdue: false };
  return { text: `${date} · ${days} days left`, overdue: false };
}

export function StandardAssignmentView({ item, assignmentId, reload, children }) {
  const a = item.assignment;
  const steps = useFocusSteps(assignmentId);
  const active = useApi(focusService.getActiveSession, { immediate: true });
  const notesApi = useApi(noteService.list, { immediate: true, args: [{ assignmentId }] });

  // undefined = closed, null = add, a note = edit.
  const [editingNote, setEditingNote] = useState(undefined);
  const [noteToDelete, setNoteToDelete] = useState(null);

  const activeStepId = active.data?.assignmentId === assignmentId ? active.data?.stepId ?? null : null;
  const total = steps.steps.length;
  const percent = total ? Math.round((steps.doneCount / total) * 100) : 0;
  const nextStep = steps.steps.find((s) => !s.done) ?? null;
  const due = dueLabel(a.dueDate);
  const tone = getSubjectVisual(a.subject).tone;
  const { colorOf } = useSubjectColors();

  const notes = (notesApi.data ?? []).map((n) => ({
    id: n.id,
    tone: n.tone,
    title: n.title,
    content: n.content,
    text: n.content,
    done: n.status === 'done',
  }));
  const reloadNotes = () => notesApi.run({ assignmentId }).catch(() => {});

  const saveNote = async (values) => {
    try {
      if (editingNote) await noteService.update(editingNote.id, values);
      else await noteService.create({ ...values, assignmentId });
    } catch (err) {
      toast.error(getErrorMessage(err));
      return;
    }
    setEditingNote(undefined);
    reloadNotes();
  };

  // Deleting always asks first, through the app's own dialog (never the browser's).
  const confirmDeleteNote = async () => {
    const note = noteToDelete;
    setNoteToDelete(null);
    setEditingNote(undefined);
    try {
      await noteService.remove(note.id);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
    reloadNotes();
  };

  return (
    <div className="ad-page">
      <Link to="/student/assignments" className="ad-back">
        <LuArrowLeft size={15} aria-hidden="true" /> Back to Assignments
      </Link>

      <div className="ad-grid">
        <div className="ad-col">
          <section className="ad-card ad-header" aria-label="Assignment">
            <div className="ad-header__main">
              <span className="ad-subject" data-tone={tone} {...subjectPaint(colorOf(a.subject))} aria-hidden="true">
                <SubjectIcon subject={a.subject} size="md" />
              </span>
              <div style={{ minWidth: 0 }}>
                <h1 className="ad-title">{a.title}</h1>
                <p className="ad-due" data-overdue={due.overdue || undefined}>
                  {/* The text in its own span, so on a phone it wraps beside the icon instead of under it. */}
                  <LuCalendar size={13} aria-hidden="true" style={{ flex: 'none' }} />
                  <span>Due {due.text}</span>
                </p>
              </div>
            </div>

            {total > 0 ? (
              <div className="ad-progress">
                <p className="ad-progress__label">Overall progress</p>
                <p className="ad-progress__value">{percent}%</p>
                <div className="ad-progress__track" role="progressbar" aria-label="Steps done" aria-valuemin={0} aria-valuemax={total} aria-valuenow={steps.doneCount}>
                  <div className="ad-progress__fill" style={{ width: `${percent}%` }} />
                </div>
                <p className="ad-progress__sub">
                  {steps.doneCount} of {total} steps done
                </p>
              </div>
            ) : (
              <div className="ad-progress">
                <p className="ad-progress__label">Status</p>
                <div style={{ marginTop: 6 }}>
                  <StatusBadge status={due.overdue && ['assigned', 'in_progress'].includes(item.status) ? 'overdue' : item.status} />
                </div>
              </div>
            )}
          </section>

          <TaskBreakdown steps={steps} activeStepId={activeStepId} />

          {children}
        </div>

        <div className="ad-col">
          <OverviewCard assignment={a} />
          <NextStepCard assignmentId={assignmentId} step={nextStep} hasSteps={total > 0} allDone={total > 0 && !nextStep} />
          <ResourcesCard
            assignmentId={assignmentId}
            teacherFiles={a.files ?? []}
            myFiles={item.submission?.attachments ?? []}
            canAttach={Boolean(item.submission)}
            onUploaded={reload}
          />
          <NotesCard notes={notes} onAdd={() => setEditingNote(null)} onOpen={(note) => setEditingNote(note)} />
          <DetailsCard assignment={a} />
        </div>
      </div>

      <NoteEditorModal
        isOpen={editingNote !== undefined}
        note={editingNote}
        onClose={() => setEditingNote(undefined)}
        onSave={saveNote}
        onDelete={(note) => setNoteToDelete(note)}
      />

      <ConfirmationModal
        isOpen={Boolean(noteToDelete)}
        onClose={() => setNoteToDelete(null)}
        onConfirm={confirmDeleteNote}
        variant="danger"
        title="Delete this note?"
        message="This note will be gone for good."
        confirmLabel="Delete note"
      />
    </div>
  );
}

export default StandardAssignmentView;
