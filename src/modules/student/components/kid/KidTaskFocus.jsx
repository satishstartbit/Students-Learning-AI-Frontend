import { Link } from 'react-router-dom';
import { LuHeadphones } from 'react-icons/lu';
import { useFocusTimer } from '../../hooks/useFocusTimer';
import { KidButton } from './KidButton';
import { KidFocusTimerCard } from './KidFocusTimerCard';
import { KidSkeleton } from './KidStates';
import { PaperCard } from './PaperKit';

const LIVE = ['in_progress', 'paused'];

/**
 * "Focus time" on a K-4 task page: once the task is started, the same clock
 * as the Focus time page appears right there, already tied to this task -
 * so the focused minutes count towards it without leaving the page.
 *
 * A student has one clock at a time (the server refuses a second). If it is
 * already running for a different task, this says so and links to Focus time
 * instead of offering a second Start.
 *
 * @param available  the task is started and still being worked on. A clock
 *                   already running for this task stays visible either way,
 *                   so it can always be finished.
 */
export function KidTaskFocus({ assignmentId, available }) {
  const timer = useFocusTimer();

  if (timer.isLoading) return available ? <KidSkeleton className="mb-6 h-72" /> : null;

  const { session } = timer;
  const live = LIVE.includes(session?.status);
  const forThisTask = live && session.assignmentId === assignmentId;
  if (!available && !forThisTask) return null;

  if (live && !forThisTask) {
    return (
      <PaperCard as="section" aria-label="Focus timer" tone="sheet" className="mb-6 flex flex-col items-center gap-4 px-6 py-7 text-center">
        <h2 className="font-kid-display text-2xl font-semibold text-kid-ink">Your focus clock is already going</h2>
        <p className="font-kid-body text-lg text-kid-ink-soft">
          It&apos;s running for {session.assignment?.title ? `"${session.assignment.title}"` : 'another task'}. Finish that one first.
        </p>
        <KidButton asChild size="md">
          <Link to="/student/focus">
            <LuHeadphones className="size-5" aria-hidden="true" />
            Go to Focus time
          </Link>
        </KidButton>
      </PaperCard>
    );
  }

  return (
    <KidFocusTimerCard
      timer={timer}
      assignmentId={assignmentId}
      className="mb-6"
      header={
        <div className="text-center">
          <h2 className="font-kid-display text-3xl font-semibold text-kid-ink">Focus time</h2>
          <p className="mt-1 text-lg text-kid-ink-soft">Start the clock and do one thing.</p>
        </div>
      }
    />
  );
}

export default KidTaskFocus;
