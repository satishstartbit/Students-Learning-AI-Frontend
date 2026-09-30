import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LuCheck, LuChevronRight, LuHeadphones, LuPause, LuPlay, LuVolumeX } from 'react-icons/lu';
import { Alert, Loader, Modal } from '../../../components/common';
import { SearchableSelect } from '../../../components/ui/searchable-select';
import { toast } from '../../../hooks/useToast';
import { formatDuration } from '../../../utils/date';
import { getSubjectVisual } from '../components/subjectVisual';
import StepsPanel from '../components/focus/StepsPanel';
import StuckToolkit from '../components/focus/StuckToolkit';
import { FOCUS_LENGTHS as LENGTHS } from '../components/focus/focusLengths';
import '../components/focus/focusSession.css';
import { formatClock, useFocusTimer } from '../hooks/useFocusTimer';
import { useFocusSteps } from '../hooks/useFocusSteps';
import { useStudentSettings } from '../hooks/useStudentSettings';
import { useTodayCheckIn } from '../../checkIn/hooks/useTodayCheckIn';
import { useTodayTasks } from '../hooks/useTodayTasks';

/**
 * "Focus session - one step at a time. Everything else can wait." (Grade 6+;
 * K-5 has KidFocusPage). Built to the focus mockup.
 *
 * A session is about one task and one of the student's own steps for it
 * ("Your steps", useFocusSteps). The countdown comes from the server's event
 * trail, so a refresh mid-session resumes exactly. Finishing offers to tick
 * the step done, which earns step points once. Underneath, "Feeling stuck?"
 * offers real, admin-managed toolkit exercises.
 */

const SOUNDS = [
  { value: '', label: 'No sound', file: null },
  { value: 'soft-rain', label: 'Soft rain', file: '/audio/soft-rain.wav' },
  { value: 'ocean-waves', label: 'Ocean waves', file: '/audio/ocean-waves.wav' },
  { value: 'calm-tones', label: 'Calm tones', file: '/audio/calm-tones.wav' },
];

export default function FocusTimerPage() {
  const timer = useFocusTimer();
  const { settings, isLoading: settingsLoading } = useStudentSettings();

  // Waits for both so the first paint already shows the student's own
  // starting length and sound, and any session they left running.
  if (timer.isLoading || settingsLoading) return <Loader message="Loading your focus session…" />;
  return <FocusSession timer={timer} settings={settings} />;
}

function FocusSession({ timer, settings }) {
  const [params, setParams] = useSearchParams();
  const plan = useTodayTasks();
  const { checkIn } = useTodayCheckIn();
  const { session } = timer;

  const isRunning = session?.status === 'in_progress';
  const isPaused = session?.status === 'paused';
  const isActive = isRunning || isPaused;

  // What the student is planning while idle; a live session decides it instead.
  // `?assignment=&step=` lets the assignment page's "Start work" open a session already set up;
  // `&minutes=` comes from the "start with a short timer" help idea.
  const [pickedAssignmentId, setPickedAssignmentId] = useState(() => params.get('assignment'));
  const [pickedStepId, setPickedStepId] = useState(() => params.get('step'));
  const [plannedMinutes, setPlannedMinutes] = useState(() => {
    const asked = Number(params.get('minutes'));
    if (Number.isInteger(asked) && asked >= 1 && asked <= 120) return asked;
    return settings?.defaultFocusMinutes ?? checkIn?.availableMinutes ?? 25;
  });
  const [sound, setSound] = useState(() => (settings?.backgroundSound ? SOUNDS[1].value : ''));
  const [soundMenuOpen, setSoundMenuOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [justEnded, setJustEnded] = useState(null);

  const assignmentId = isActive ? session.assignmentId : pickedAssignmentId;
  const steps = useFocusSteps(assignmentId);
  const currentStepId = isActive ? session.stepId : pickedStepId;

  const taskOptions = useMemo(
    () =>
      [...plan.tasks, ...plan.upcoming]
        .filter((t) => !t.done && t.assignmentId)
        .map((t) => ({ value: t.assignmentId, label: t.title })),
    [plan.tasks, plan.upcoming]
  );

  const pickedTask = useMemo(
    () => [...plan.tasks, ...plan.upcoming].find((t) => t.assignmentId === assignmentId) ?? null,
    [plan.tasks, plan.upcoming, assignmentId]
  );

  const assignment = isActive ? session.assignment : pickedTask ? { title: pickedTask.title, subject: pickedTask.subject } : null;
  const currentStep = steps.steps.find((s) => s.id === currentStepId) ?? null;
  const stepIndex = steps.steps.findIndex((s) => s.id === currentStepId);

  // Background sound: plays only while the clock is actually running.
  const audioRef = useRef(null);
  const soundFile = SOUNDS.find((s) => s.value === (isActive ? session.audioOption ?? sound : sound))?.file ?? null;
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (isRunning && soundFile) {
      if (!el.src.endsWith(soundFile)) el.src = soundFile;
      el.volume = 0.5;
      // Browsers may refuse autoplay until the page has been interacted with;
      // the session always starts from a click, so this normally succeeds.
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [isRunning, soundFile]);

  const plannedSeconds = (isActive ? session.plannedMinutes ?? plannedMinutes : plannedMinutes) * 60;
  const remaining = Math.max(plannedSeconds - timer.elapsedSeconds, 0);
  const timeUp = isActive && remaining === 0;
  const ringPercent = plannedSeconds ? Math.min(timer.elapsedSeconds / plannedSeconds, 1) : 0;

  const selectTask = (value) => {
    setPickedAssignmentId(value);
    setPickedStepId(null);
    setParams(value ? { assignment: value } : {}, { replace: true });
  };

  const selectStep = (step) => {
    if (isActive) timer.setStep(step.id).catch(() => {});
    else setPickedStepId(step.id === pickedStepId ? null : step.id);
  };

  const handleStart = () =>
    timer
      .start({
        assignmentId: assignmentId || undefined,
        stepId: pickedStepId || undefined,
        plannedMinutes,
        audioOption: sound || undefined,
      })
      .then(() => setJustEnded(null))
      .catch(() => {});

  const endSession = async (mode) => {
    setEndOpen(false);
    try {
      const ended =
        mode === 'abandon'
          ? await timer.abandon()
          : await timer.complete({ completeStep: mode === 'finishStep' });
      const nextStep = mode === 'finishStep' ? steps.steps.find((s, i) => i > stepIndex && !s.done) ?? null : null;
      setJustEnded({ mode, minutes: ended?.actualMinutes ?? 0, nextStepId: nextStep?.id ?? null, nextStepTitle: nextStep?.title ?? null });
      await steps.reload();
      plan.reload();
      if (mode === 'finishStep') toast.success('Step done - nice work.');
    } catch {
      // useFocusTimer surfaces the message in `timer.error`.
    }
  };

  const startNextStep = (stepId) => {
    setPickedStepId(stepId);
    setJustEnded(null);
    timer
      .start({ assignmentId, stepId, plannedMinutes: session?.plannedMinutes ?? plannedMinutes, audioOption: sound || undefined })
      .catch(() => {});
  };

  const stateLabel = timeUp ? 'Time’s up' : isRunning ? 'Focusing' : isPaused ? 'Paused' : 'Ready when you are';
  const subjectTone = getSubjectVisual(assignment?.subject).tone;

  return (
    <div className="fs-page td-page">
      <h1 className="fs-title">Focus session</h1>
      <p className="fs-subtitle">One step at a time. Everything else can wait.</p>

      {timer.error && (
        <Alert variant="error" className="ui-field">
          {timer.error}
        </Alert>
      )}

      {justEnded && (
        <Alert
          variant={justEnded.mode === 'abandon' ? 'info' : 'success'}
          className="ui-field"
          onDismiss={() => setJustEnded(null)}
        >
          {justEnded.mode === 'abandon'
            ? 'Session ended. Every bit of focus still counts - start again whenever you’re ready.'
            : `Nice work - ${formatDuration(justEnded.minutes) || 'a few minutes'} focused.`}
          {justEnded.nextStepId && (
            <>
              {' '}
              Next up: <strong>{justEnded.nextStepTitle}</strong>{' '}
              <button type="button" className="fs-link" onClick={() => startNextStep(justEnded.nextStepId)}>
                Start next step <LuChevronRight size={13} aria-hidden="true" />
              </button>
            </>
          )}
        </Alert>
      )}

      <div className="fs-grid">
        <div className="fs-col">
          <section className="fs-card fs-session" aria-label="Focus timer">
            <div className="fs-context">
              {assignment?.subject && (
                <span className="fs-chip" data-tone={subjectTone}>
                  {assignment.subject}
                </span>
              )}
              <span>{assignment?.title ?? 'No task picked - a plain timer works too'}</span>
            </div>

            <h2 className="fs-heading">{currentStep?.title ?? (isActive ? 'Focus time' : 'Ready to focus?')}</h2>

            <p className="fs-meta">
              {currentStep && stepIndex >= 0 ? `Step ${stepIndex + 1} of ${steps.steps.length} · ` : ''}
              planned {isActive ? session.plannedMinutes ?? plannedMinutes : plannedMinutes} min
            </p>

            <div className="fs-ring">
              <svg viewBox="0 0 190 190" aria-hidden="true">
                <circle cx="95" cy="95" r="84" fill="none" stroke="var(--color-bg-surface-sunken)" strokeWidth="13" />
                <circle
                  className="fs-ring__arc"
                  cx="95"
                  cy="95"
                  r="84"
                  fill="none"
                  stroke={timeUp ? 'var(--color-success-solid)' : 'var(--accent-base)'}
                  strokeWidth="13"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 84}
                  strokeDashoffset={2 * Math.PI * 84 * (1 - (isActive ? ringPercent : 0))}
                />
              </svg>
              <span className="fs-clock">{isActive ? formatClock(remaining) : formatClock(plannedSeconds)}</span>
            </div>

            <p className="fs-state" data-state={timeUp ? 'done' : undefined} aria-live="polite">
              {stateLabel}
            </p>

            {!isActive && (
              <div className="fs-setup">
                <SearchableSelect
                  label="What are you working on?"
                  placeholder="No task (just the timer)"
                  options={taskOptions}
                  value={assignmentId}
                  onChange={selectTask}
                  loading={plan.isLoading}
                  className="ui-field"
                />
                <span className="ui-label">How long?</span>
                <div className="fs-lengths">
                  {LENGTHS.map((m) => (
                    <button key={m} type="button" className="fs-length" aria-pressed={plannedMinutes === m} onClick={() => setPlannedMinutes(m)}>
                      {m} min
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="fs-actions">
              {!isActive && (
                <button type="button" className="fs-btn fs-btn--primary" onClick={handleStart} disabled={timer.isBusy}>
                  <LuPlay size={15} aria-hidden="true" /> Start focus
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
                <button type="button" className="fs-btn fs-btn--ghost" onClick={() => setEndOpen(true)}>
                  End session
                </button>
              )}

              <span className="fs-sound-wrap">
                <button
                  type="button"
                  className="fs-btn fs-btn--round"
                  aria-haspopup="menu"
                  aria-expanded={soundMenuOpen}
                  aria-pressed={Boolean(soundFile)}
                  aria-label={`Background sound: ${SOUNDS.find((s) => s.file === soundFile)?.label ?? 'No sound'}`}
                  onClick={() => setSoundMenuOpen((v) => !v)}
                >
                  {soundFile ? <LuHeadphones size={18} aria-hidden="true" /> : <LuVolumeX size={18} aria-hidden="true" />}
                </button>
                {soundMenuOpen && (
                  <div className="fs-sound-menu" role="menu" aria-label="Background sound">
                    {SOUNDS.map((option) => (
                      <button
                        key={option.value || 'none'}
                        type="button"
                        role="menuitemradio"
                        aria-checked={sound === option.value}
                        className="fs-sound"
                        onClick={() => {
                          setSound(option.value);
                          setSoundMenuOpen(false);
                        }}
                      >
                        {sound === option.value ? <LuCheck size={14} aria-hidden="true" /> : <span style={{ width: 14 }} />}
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </span>
            </div>

            {/* Loops quietly while the clock runs; paused with the session. */}
            <audio ref={audioRef} loop preload="none" aria-hidden="true" />
          </section>

          <StuckToolkit
            onExerciseOpenChange={(open) => {
              // Stepping away shouldn't count as focus time - pause while the exercise runs.
              if (open && isRunning) timer.pause().catch(() => {});
            }}
          />
        </div>

        <div className="fs-col">
          <StepsPanel
            assignment={assignment}
            steps={steps}
            currentStepId={currentStepId}
            onSelectStep={selectStep}
            selectDisabled={false}
          />
        </div>
      </div>

      <Modal isOpen={endOpen} onClose={() => setEndOpen(false)} title="End this session?" description="How did it go?" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          {currentStep && (
            <button type="button" className="fs-btn fs-btn--primary" onClick={() => endSession('finishStep')}>
              <LuCheck size={15} aria-hidden="true" /> I finished this step
            </button>
          )}
          <button type="button" className="fs-btn" onClick={() => endSession('complete')}>
            Save my focus time, step not done yet
          </button>
          <button type="button" className="fs-btn fs-btn--ghost" onClick={() => endSession('abandon')}>
            Stop without saving the time
          </button>
        </div>
      </Modal>
    </div>
  );
}
