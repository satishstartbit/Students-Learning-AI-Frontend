import { useEffect, useState } from 'react';
import '@fontsource/patrick-hand/400.css';
import { ConfirmationModal } from '../../../components/common';
import { useAuth } from '../../../hooks/useAuth';
import { useApi } from '../../../hooks/useApi';
import { toast } from '../../../hooks/useToast';
import { getErrorMessage } from '../../../utils/errorHandler';
import AddWorkDialog from '../../planner/components/AddWorkDialog';
import NeedHelpDialog from '../../planner/components/NeedHelpDialog';
import NextActionsCard from '../../planner/components/NextActionsCard';
import PendingIntakes from '../../planner/components/PendingIntakes';
import PlanNotices from '../../planner/components/PlanNotices';
import SupportCheckBack from '../../planner/components/SupportCheckBack';
import '../../planner/planner.css';
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
import { NOTES_CHANGED_EVENT, NOTE_REMINDERS_DELIVERED_EVENT } from '../noteReminders';
import { HOME_RANGE, toBoardNote } from '../notesQuery';
import { useTodayTasks } from '../hooks/useTodayTasks';
import focusService from '../services/focus.service';
import noteService from '../services/note.service';
import rewardService from '../services/reward.service';
import DashboardStickers from '../components/stickers/DashboardStickers';

/** The Home board: the student's own (non-assignment) notes, yesterday onwards. */
const BOARD_QUERY = { generalOnly: true, range: HOME_RANGE };

/**
 * "My Day" - the Grade 6+ student Home, built to the student dashboard
 * mockup. Every section reads and writes real data:
 *
 *   Next up / plan notices              /students/me/plan (useTodayTasks().schedule)
 *   Today's Tasks / Upcoming Deadlines  /assignments + /my-tasks, in the plan's priority order
 *   Waiting for you                     /work-intakes (added work with a question)
 *   Today's check-in                    /check-ins (TodayCheckInProvider)
 *   Your progress                       /rewards/summary + /rewards/catalog
 *   Start Focus                         /focus/today-minutes
 *   Add assignment                      /work-intakes (AddWorkDialog: type, say, photo, PDF)
 *   Own task details                    /my-tasks (OwnTaskModal)
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
  // The board shows the student's general notes from yesterday onwards (a note's
  // date = its reminder, else when it was written); older ones are on the Notes
  // page, and notes tied to an assignment live on that assignment's page.
  const notes = useApi(noteService.list, { immediate: true, args: [BOARD_QUERY] });

  // Own-task details: null = closed, else { mode: 'edit', task }.
  const [taskDialog, setTaskDialog] = useState(null);
  // Add work: null = closed, else the way in ('quick' | 'voice' | 'photo' | 'document').
  const [adding, setAdding] = useState(null);
  // "Need help?" for one planned step: null = closed.
  const [helpFor, setHelpFor] = useState(null);
  // Note dialog: undefined = closed, null = add, a note = edit.
  const [editingNote, setEditingNote] = useState(undefined);
  const [noteToDelete, setNoteToDelete] = useState(null);
  // Done is final, so ticking a note off asks first.
  const [noteToFinish, setNoteToFinish] = useState(null);

  const noteItems = (notes.data ?? []).map(toBoardNote);

  const reloadNotes = () => notes.run(BOARD_QUERY).catch(() => {});

  // A reminder went off (NoteReminderHost) or a note was ticked off from its
  // pop-up: show the board as it is now.
  const { run: runNotes } = notes;
  useEffect(() => {
    const refresh = () => runNotes(BOARD_QUERY).catch(() => {});
    window.addEventListener(NOTE_REMINDERS_DELIVERED_EVENT, refresh);
    window.addEventListener(NOTES_CHANGED_EVENT, refresh);
    return () => {
      window.removeEventListener(NOTE_REMINDERS_DELIVERED_EVENT, refresh);
      window.removeEventListener(NOTES_CHANGED_EVENT, refresh);
    };
  }, [runNotes]);

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

  const confirmFinishNote = async () => {
    const note = noteToFinish;
    setNoteToFinish(null);
    await noteAction(() => noteService.update(note.id, { status: 'done' }));
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
          <NextActionsCard
            plan={plan.schedule}
            isLoading={plan.scheduleLoading}
            error={plan.scheduleError}
            onRetry={plan.reloadSchedule}
            planHref="/student/calendar"
            onHelp={(a) =>
              setHelpFor({ assignmentId: a.assignmentId, stepId: a.stepId, title: a.assignmentTitle ?? a.title, canRemove: a.workSource === 'student' })
            }
          />
          <SupportCheckBack />
          <PlanNotices plan={plan.schedule} studyTimesHref="/student/study-times" />
          <PendingIntakes onChanged={plan.reload} />
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
          {/* The collected stickers they chose to show (Make it yours). */}
          <DashboardStickers />
          <ProgressCard
            totalPoints={summary.data?.totalPoints ?? 0}
            rewards={catalog.data ?? []}
            isLoading={summary.isLoading && !summary.data}
          />
          <StartFocusCard minutesToday={todayMinutes.data?.minutes ?? 0} />
          <BrainBoostersTeaser />
          <AddTaskCard onAdd={setAdding} />
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
        onToggleDone={(note) => setNoteToFinish(note)}
        allNotesTo="/student/notes"
        onDelete={handleDeleteNote}
      />

      <OwnTaskModal
        mode={taskDialog?.mode ?? null}
        task={taskDialog?.task ?? null}
        onClose={() => setTaskDialog(null)}
        onChanged={plan.reload}
      />

      <AddWorkDialog key={adding ?? 'closed'} isOpen={Boolean(adding)} method={adding} onClose={() => setAdding(null)} onAdded={plan.reload} />
      <NeedHelpDialog target={helpFor} onClose={() => setHelpFor(null)} onChanged={plan.reload} />

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

      <ConfirmationModal
        isOpen={Boolean(noteToFinish)}
        onClose={() => setNoteToFinish(null)}
        onConfirm={confirmFinishNote}
        title="Mark this note done?"
        message="A note that's done stays done - you can't undo this."
        confirmLabel="Mark done"
      />
    </div>
  );
}
