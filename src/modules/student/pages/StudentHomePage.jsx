import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, ProgressBar, StickyBoard, Loader, CircularProgress } from '../../../components/common';
import { useAuth } from '../../../hooks/useAuth';
import { useApi } from '../../../hooks/useApi';
import { toast } from '../../../hooks/useToast';
import { daysUntil, formatDate, formatDuration } from '../../../utils/date';
import { useMyTasks } from '../hooks/useMyTasks';
import { useStudentExperience } from '../hooks/useStudentExperience';
import StudentCheckInCard from '../components/StudentCheckInCard';
import NoteEditorModal from '../components/NoteEditorModal';
import rewardService from '../services/reward.service';
import focusService from '../services/focus.service';
import noteService from '../services/note.service';

function timeOfDayGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * "Adding your own tasks" has no backend of its own yet (see
 * StudentPlanPage.jsx's "Add assignment" button) - Home's quick-add tiles
 * show the same message for the same reason, rather than silently doing
 * nothing.
 */
const QUICK_ADD_MESSAGE =
  "Adding your own tasks is coming soon - for now this shows what your teachers assign.";

function UpcomingDeadlineRow({ task }) {
  const assignment = task.assignment ?? {};
  const days = daysUntil(assignment.dueDate);
  const label =
    days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : days > 1 ? `In ${days} days` : formatDate(assignment.dueDate);

  return (
    <Link
      to={`/student/assignments/${assignment.id}`}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 'var(--spacing-sm)',
        padding: 'var(--spacing-sm) 0',
        borderBottom: '1px solid var(--color-border)',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontWeight: 600, color: 'var(--color-text-primary)' }}>{assignment.title}</span>
        <span className="ui-hint">{assignment.subject}</span>
      </span>
      <span className="ui-hint" style={{ flex: 'none', whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </Link>
  );
}

/**
 * "My Day" for Grade 6+ - built around this session's Text Field / Sticky
 * Note design-system work and the Ocean brand tokens (theme/variables.css).
 *
 * My Notes is wired to the real /notes API (services/student/note.service.js)
 * - add/edit through NoteEditorModal, mark-done and delete inline via
 * StickyBoard's own affordances.
 */
export default function StudentHomePage() {
  const { user } = useAuth();
  const { profile } = useStudentExperience();
  const tasks = useMyTasks();
  const summary = useApi(rewardService.getSummary, { immediate: true });
  const catalog = useApi(rewardService.listCatalog, { immediate: true });
  const todayMinutes = useApi(focusService.getTodayMinutes, { immediate: true });
  const notes = useApi(noteService.list, { immediate: true });

  // undefined = closed, null = "add a note", a note object = "edit that note".
  const [editingNote, setEditingNote] = useState(undefined);

  const toDoCount = tasks.toDo.length;
  const doneToday = tasks.done.length;
  const totalToday = toDoCount + doneToday;

  const totalPoints = summary.data?.totalPoints ?? 0;
  const rewards = catalog.data ?? [];
  const nextReward = rewards
    .filter((r) => r.pointsCost > totalPoints)
    .sort((a, b) => a.pointsCost - b.pointsCost)[0];
  const pointsToGo = nextReward ? nextReward.pointsCost - totalPoints : 0;

  // useMyTasks() already sorts toDo soonest-due-first; just take the ones
  // due after today, so this reads as a preview of what's coming rather than
  // repeating "Today's tasks" below.
  const upcomingDeadlines = tasks.toDo
    .filter((t) => t.assignment?.dueDate && daysUntil(t.assignment.dueDate) > 0)
    .slice(0, 4);

  const noteItems = (notes.data ?? []).map((n) => ({
    id: n.id,
    tone: n.tone,
    title: n.title,
    text: n.content,
    done: n.status === 'done',
  }));

  const reloadNotes = () => notes.run().catch(() => {});

  const handleSaveNote = async (values) => {
    if (editingNote) await noteService.update(editingNote.id, values);
    else await noteService.create(values);
    setEditingNote(undefined);
    reloadNotes();
  };

  const handleToggleDone = async (note) => {
    await noteService.update(note.id, { status: note.done ? 'active' : 'done' });
    reloadNotes();
  };

  const handleDeleteNote = async (note) => {
    await noteService.remove(note.id);
    setEditingNote(undefined);
    reloadNotes();
  };

  const quickAdd = () => toast.info(QUICK_ADD_MESSAGE);

  return (
    <>
      <div className="ui-pageheader">
        <div>
          <h1 className="ui-pageheader__title">
            {timeOfDayGreeting()}, {user?.firstName ?? 'there'}
          </h1>
          <p className="ui-pageheader__description">
            {toDoCount === 0 ? 'Nothing left today - nice work.' : `${toDoCount} ${toDoCount === 1 ? 'task' : 'tasks'} left today`}
            {profile?.grade ? ` · ${profile.grade}` : ''}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 'var(--spacing-lg)', alignItems: 'start' }}>
        <div>
          <Card
            title="Today's tasks"
            subtitle={totalToday ? `${totalToday} total · ${toDoCount} to go` : undefined}
            actions={
              <Button as={Link} to="/student/assignments" variant="secondary" size="sm">
                View full plan
              </Button>
            }
            className="ui-field"
          >
            {totalToday > 0 && (
              <ProgressBar
                value={doneToday}
                max={totalToday}
                label={`${doneToday}/${totalToday} complete`}
                className="ui-field"
              />
            )}

            {tasks.isLoading ? (
              <Loader message="Loading your tasks…" />
            ) : toDoCount === 0 ? (
              <p className="ui-hint">You&apos;re all caught up for today.</p>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                {tasks.toDo.slice(0, 5).map((item) => (
                  <li key={item.id}>
                    <Link
                      to={`/student/assignments/${item.assignment?.id ?? item.assignmentId}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-sm)',
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                        border: '1px solid var(--color-border-default)',
                        borderRadius: 'var(--radius-md)',
                        textDecoration: 'none',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          width: 10,
                          height: 10,
                          flex: 'none',
                          borderRadius: '50%',
                          border: '2px solid var(--accent-base)',
                          background: item.status === 'in_progress' ? 'var(--accent-base)' : 'transparent',
                        }}
                      />
                      <span style={{ flex: 1, minWidth: 0 }}>{item.assignment?.title ?? 'Assignment'}</span>
                      <span className="ui-hint">{item.assignment?.subject}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <StickyBoard
            notes={noteItems}
            title="My Notes"
            onAdd={() => setEditingNote(null)}
            onToggleDone={handleToggleDone}
            onSelect={(note) => setEditingNote(note)}
            onDelete={handleDeleteNote}
          />
        </div>

        <div>
          <StudentCheckInCard />

          <Card title="Your progress" className="ui-field" style={{ marginTop: 'var(--spacing-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)', flexWrap: 'wrap' }}>
              <CircularProgress value={totalPoints} max={nextReward ? nextReward.pointsCost : Math.max(totalPoints, 1)} size={110} strokeWidth={9}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)' }}>{totalPoints}</div>
                  <div className="ui-hint">pts</div>
                </div>
              </CircularProgress>

              {nextReward ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', minWidth: 0 }}>
                  <span
                    aria-hidden="true"
                    style={{
                      width: 40,
                      height: 40,
                      flex: 'none',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      display: 'grid',
                      placeItems: 'center',
                      background: 'var(--color-bg-surface-sunken)',
                      fontSize: 20,
                    }}
                  >
                    {nextReward.imageUrl ? (
                      <img src={nextReward.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      '🎁'
                    )}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 600 }}>{nextReward.name}</p>
                    <p className="ui-hint" style={{ margin: 0 }}>{pointsToGo} pts to go</p>
                  </div>
                </div>
              ) : (
                <p className="ui-hint">
                  {rewards.length === 0 ? 'Ask your teacher or parent to add rewards to work toward.' : "You've earned every reward so far!"}
                </p>
              )}
            </div>
          </Card>

          <Card className="ui-field" style={{ marginTop: 'var(--spacing-lg)', background: 'var(--accent-soft)', border: '1px solid var(--accent-base)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 700 }}>Start Focus</p>
                <p className="ui-hint" style={{ margin: 0 }}>
                  {todayMinutes.data?.minutes ? `${formatDuration(todayMinutes.data.minutes)} focused today` : 'Tune out distractions and get in the zone.'}
                </p>
              </div>
              <Button as={Link} to="/student/focus">
                Start focus
              </Button>
            </div>
          </Card>

          <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-lg)' }}>
            <Button variant="secondary" size="sm" startIcon={<span aria-hidden="true">✏️</span>} onClick={quickAdd} style={{ flex: 1 }}>
              Type it
            </Button>
            <Button variant="secondary" size="sm" startIcon={<span aria-hidden="true">📷</span>} onClick={quickAdd} style={{ flex: 1 }}>
              Add photo
            </Button>
          </div>

          <Card title="Upcoming Deadlines" className="ui-field" style={{ marginTop: 'var(--spacing-lg)' }}>
            {upcomingDeadlines.length === 0 ? (
              <p className="ui-hint">Nothing coming up yet.</p>
            ) : (
              upcomingDeadlines.map((task) => <UpcomingDeadlineRow key={task.recipientId ?? task.id} task={task} />)
            )}
          </Card>
        </div>
      </div>

      <NoteEditorModal
        isOpen={editingNote !== undefined}
        note={editingNote}
        onClose={() => setEditingNote(undefined)}
        onSave={handleSaveNote}
        onDelete={handleDeleteNote}
      />
    </>
  );
}
