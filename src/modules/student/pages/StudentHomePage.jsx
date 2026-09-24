import { useState } from 'react';
import '@fontsource/patrick-hand/400.css';
import { ConfirmationModal } from '../../../components/common';
import { useAuth } from '../../../hooks/useAuth';
import { useApi } from '../../../hooks/useApi';
import { toast } from '../../../hooks/useToast';
import { getErrorMessage } from '../../../utils/errorHandler';
import NoteEditorModal from '../components/NoteEditorModal';
import BrainBoostersTeaser from '../components/brainBoosters/BrainBoostersTeaser';
import AddTaskCard from '../components/home/AddTaskCard';
import HomeHero from '../components/home/HomeHero';
import NotesBoard from '../components/home/NotesBoard';
import OwnTaskModal from '../components/home/OwnTaskModal';
import ProgressCard from '../components/home/ProgressCard';
import StartFocusCard from '../components/home/StartFocusCard';
import TodayTasksCard from '../components/home/TodayTasksCard';
import UpcomingDeadlinesCard from '../components/home/UpcomingDeadlinesCard';
import '../components/home/studentHome.css';
import { useStudentSettings } from '../hooks/useStudentSettings';
import { useTodayTasks } from '../hooks/useTodayTasks';
import focusService from '../services/focus.service';
import noteService from '../services/note.service';
import rewardService from '../services/reward.service';

/**
 * "My Day" - the Grade 6+ student Home, built to the student dashboard
 * mockup. Every section reads and writes real data:
 *
 *   Today's Tasks / Upcoming Deadlines  /assignments + /my-tasks (useTodayTasks)
 *   Today's check-in                    /check-ins (TodayCheckInProvider)
 *   Your progress                       /rewards/summary + /rewards/catalog
 *   Start Focus                         /focus/today-minutes
 *   Add assignment                      /my-tasks (OwnTaskModal)
 *   My Notes                            /notes (NotesBoard + NoteEditorModal)
 */
export default function StudentHomePage() {
  const { user } = useAuth();
  // Settings -> Name: the name the student chose to be called, else their first name.
  const { settings } = useStudentSettings();
  const plan = useTodayTasks();
  const summary = useApi(rewardService.getSummary, { immediate: true });
  const catalog = useApi(rewardService.listCatalog, { immediate: true });
  const todayMinutes = useApi(focusService.getTodayMinutes, { immediate: true });
  // The board shows the student's general notes; notes tied to an assignment live on that assignment's page.
  const notes = useApi(noteService.list, { immediate: true, args: [{ generalOnly: true }] });

  // Own-task dialog: null = closed, else { mode: 'type' | 'photo' | 'edit', task? }.
  const [taskDialog, setTaskDialog] = useState(null);
  // Note dialog: undefined = closed, null = add, a note = edit.
  const [editingNote, setEditingNote] = useState(undefined);
  const [noteToDelete, setNoteToDelete] = useState(null);

  const noteItems = (notes.data ?? []).map((n) => ({
    id: n.id,
    tone: n.tone,
    title: n.title,
    content: n.content,
    // NoteEditorModal reads `text`.
    text: n.content,
    done: n.status === 'done',
  }));

  const reloadNotes = () => notes.run({ generalOnly: true }).catch(() => {});

  const noteAction = async (fn) => {
    try {
      await fn();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      reloadNotes();
    }
  };

  const handleSaveNote = async (values) => {
    // On failure the dialog stays open with the student's text intact.
    try {
      if (editingNote) await noteService.update(editingNote.id, values);
      else await noteService.create(values);
    } catch (err) {
      toast.error(getErrorMessage(err));
      return;
    }
    setEditingNote(undefined);
    reloadNotes();
  };

  // Deleting always asks first, through the app's own dialog (never the browser's).
  const handleDeleteNote = (note) => setNoteToDelete(note);

  const confirmDeleteNote = async () => {
    const note = noteToDelete;
    setNoteToDelete(null);
    setEditingNote(undefined);
    await noteAction(() => noteService.remove(note.id));
  };

  const openOwnTask = (task) => setTaskDialog({ mode: 'edit', task: task.raw });

  return (
    <div className="sh-page td-page">
      <HomeHero
        firstName={settings?.preferredName || user?.firstName}
        openCount={plan.openCount}
        minutesLeft={plan.minutesLeft}
        isLoading={plan.isLoading}
      />

      <div className="sh-grid">
        <div className="sh-col">
          <TodayTasksCard
            tasks={plan.tasks}
            openCount={plan.openCount}
            doneCount={plan.doneCount}
            isLoading={plan.isLoading}
            error={plan.error}
            onRetry={plan.reload}
            taskPoints={summary.data?.taskPoints ?? null}
            onMove={plan.move}
            onOpenOwn={openOwnTask}
            onToggleOwn={plan.setOwnDone}
          />
          <UpcomingDeadlinesCard upcoming={plan.upcoming} isLoading={plan.isLoading} onOpenOwn={openOwnTask} />
        </div>

        <div className="sh-col sh-col--side">
          <ProgressCard
            totalPoints={summary.data?.totalPoints ?? 0}
            rewards={catalog.data ?? []}
            isLoading={summary.isLoading && !summary.data}
          />
          <StartFocusCard minutesToday={todayMinutes.data?.minutes ?? 0} />
          <BrainBoostersTeaser />
          <AddTaskCard onAdd={(mode) => setTaskDialog({ mode })} />
        </div>
      </div>

      <NotesBoard
        noteStyle={settings?.noteStyle}
        notes={noteItems}
        isLoading={notes.isLoading && !notes.data}
        error={notes.error}
        onRetry={reloadNotes}
        onAdd={() => setEditingNote(null)}
        onOpen={(note) => setEditingNote(note)}
        onToggleDone={(note) => noteAction(() => noteService.update(note.id, { status: note.done ? 'active' : 'done' }))}
        onDelete={handleDeleteNote}
      />

      <OwnTaskModal
        mode={taskDialog?.mode ?? null}
        task={taskDialog?.task ?? null}
        onClose={() => setTaskDialog(null)}
        onChanged={plan.reload}
      />

      <NoteEditorModal
        isOpen={editingNote !== undefined}
        note={editingNote}
        onClose={() => setEditingNote(undefined)}
        onSave={handleSaveNote}
        onDelete={handleDeleteNote}
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
