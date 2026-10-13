import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LuHeadphones, LuPause, LuPlay } from 'react-icons/lu';
import { Alert } from '../../../../components/common';
import { formatDuration } from '../../../../utils/date';
import { formatClock, useFocusTimer } from '../../hooks/useFocusTimer';
import { useStudentSettings } from '../../hooks/useStudentSettings';
import { FOCUS_LENGTHS } from './focusLengths';
import './focusSession.css';

const LIVE = ['in_progress', 'paused'];
const RING_RADIUS = 64;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

/**
 * "Focus time" on a Grade 6+ assignment page (K-4: KidTaskFocus). Once the
 * task is started, the focus clock sits right above the student's work,
 * already tied to this task - pick a length, start, and the focused minutes
 * count towards it without leaving the page. The full Focus page (steps,
 * sounds, toolkit) is still one click away.
 *
 * Same clock as the Focus page (useFocusTimer): the server keeps the time,
 * so a refresh or opening the Focus page mid-session carries on exactly.
 * A student has one clock at a time - if it is running for a different task,
 * this says so and links there instead of offering a second Start.
 *
 * @param available  the task is started and still being worked on. A clock
 *                   already running for this task stays visible either way,
 *                   so it can always be finished.
 */
export function TaskFocusCard({ assignmentId, available }) {
  const timer = useFocusTimer();
  const { settings, isLoading: settingsLoading } = useStudentSettings();

  if (timer.isLoading || settingsLoading) return null;

  const { session } = timer;
  const live = LIVE.includes(session?.status);
  const forThisTask = live && session.assignmentId === assignmentId;
  if (!available && !forThisTask) return null;

  if (live && !forThisTask) {
    return (
      <section className="fs-card fs-task fs-task--elsewhere" aria-label="Focus timer">
        <div className="fs-task__body">
          <h2 className="fs-task__title">Your focus clock is already running</h2>
          <p className="fs-task__lead">
            It&apos;s timing {session.assignment?.title ? <strong>{session.assignment.title}</strong> : 'another task'}. Finish or end
            that session first, then start one here.
          </p>
        </div>
        <Link to="/student/focus" className="fs-btn fs-btn--primary">
          <LuHeadphones size={15} aria-hidden="true" /> Go to Focus
        </Link>
      </section>
    );
  }

  return <FocusClock key={assignmentId} timer={timer} assignmentId={assignmentId} defaultMinutes={settings?.defaultFocusMinutes ?? 25} />;
}

function FocusClock({ timer, assignmentId, defaultMinutes }) {
  const [plannedMinutes, setPlannedMinutes] = useState(defaultMinutes);
  const [justEnded, setJustEnded] = useState(null);

  const { session } = timer;
  const isRunning = session?.status === 'in_progress';
  const isPaused = session?.status === 'paused';
  const isActive = isRunning || isPaused;

  // A running session keeps the length it was started with.
  const plannedSeconds = (isActive ? session.plannedMinutes ?? plannedMinutes : plannedMinutes) * 60;
  const remaining = Math.max(plannedSeconds - timer.elapsedSeconds, 0);
  const timeUp = isActive && remaining === 0;
  const ringPercent = isActive && plannedSeconds ? Math.min(timer.elapsedSeconds / plannedSeconds, 1) : 0;
  const stateLabel = timeUp ? 'Time’s up' : isRunning ? 'Focusing' : isPaused ? 'Paused' : 'Ready when you are';

  const start = () =>
    timer
      .start({ assignmentId, plannedMinutes })
      .then(() => setJustEnded(null))
      .catch(() => {});

  const end = (mode) =>
    (mode === 'abandon' ? timer.abandon() : timer.complete())
      .then((ended) => setJustEnded({ mode, minutes: ended?.actualMinutes ?? 0 }))
      .catch(() => {});

  return (
    <section className="fs-card fs-task" aria-label="Focus timer">
      <div className="fs-ring fs-task__ring">
        <svg viewBox="0 0 150 150" aria-hidden="true">
          <circle cx="75" cy="75" r={RING_RADIUS} fill="none" stroke="var(--color-bg-surface-sunken)" strokeWidth="11" />
          <circle
            className="fs-ring__arc"
            cx="75"
            cy="75"
            r={RING_RADIUS}
            fill="none"
            stroke={timeUp ? 'var(--color-success-solid)' : 'var(--accent-base)'}
            strokeWidth="11"
            strokeLinecap="round"
            strokeDasharray={RING_LENGTH}
            strokeDashoffset={RING_LENGTH * (1 - ringPercent)}
          />
        </svg>
        <span className="fs-clock fs-task__clock">{formatClock(isActive ? remaining : plannedSeconds)}</span>
      </div>

      <div className="fs-task__body">
        <h2 className="fs-task__title">Focus time</h2>
        <p className="fs-task__lead">Start the clock and do one thing.</p>
        <p className="fs-state fs-task__state" data-state={timeUp ? 'done' : undefined} aria-live="polite">
          {stateLabel}
          {isActive ? ` · planned ${session.plannedMinutes ?? plannedMinutes} min` : ''}
        </p>

        {timer.error && (
          <Alert variant="error" className="fs-task__alert">
            {timer.error}
          </Alert>
        )}

        {justEnded && !isActive && (
          <Alert variant={justEnded.mode === 'abandon' ? 'info' : 'success'} className="fs-task__alert" onDismiss={() => setJustEnded(null)}>
            {justEnded.mode === 'abandon'
              ? 'Session ended. Every bit of focus still counts - start again whenever you’re ready.'
              : `Nice work - ${formatDuration(justEnded.minutes) || 'a few minutes'} focused on this task.`}
          </Alert>
        )}

        {!isActive && (
          <div className="fs-lengths" role="group" aria-label="How long?">
            {FOCUS_LENGTHS.map((m) => (
              <button key={m} type="button" className="fs-length" aria-pressed={plannedMinutes === m} onClick={() => setPlannedMinutes(m)}>
                {m} min
              </button>
            ))}
          </div>
        )}

        <div className="fs-actions fs-task__actions">
          {!isActive && (
            <button type="button" className="fs-btn fs-btn--primary" onClick={start} disabled={timer.isBusy}>
              <LuHeadphones size={15} aria-hidden="true" /> Start focus
            </button>
          )}
          {isRunning && (
            <button type="button" className="fs-btn" onClick={() => timer.pause().catch(() => {})} disabled={timer.isBusy}>
              <LuPause size={15} aria-hidden="true" /> Pause
            </button>
          )}
          {isPaused && (
            <button type="button" className="fs-btn fs-btn--primary" onClick={() => timer.resume().catch(() => {})} disabled={timer.isBusy}>
              <LuPlay size={15} aria-hidden="true" /> Resume
            </button>
          )}
          {timeUp && (
            <button type="button" className="fs-btn" onClick={() => timer.extend(5).catch(() => {})} disabled={timer.isBusy}>
              +5 min
            </button>
          )}
          {isActive && (
            <>
              <button type="button" className="fs-btn" onClick={() => end('complete')} disabled={timer.isBusy}>
                Done - save my time
              </button>
              <button type="button" className="fs-btn fs-btn--ghost" onClick={() => end('abandon')} disabled={timer.isBusy}>
                Stop without saving
              </button>
            </>
          )}
        </div>

        <Link to={`/student/focus?assignment=${assignmentId}`} className="fs-link fs-task__more">
          Steps, sounds and more on the Focus page
        </Link>
      </div>
    </section>
  );
}

export default TaskFocusCard;
