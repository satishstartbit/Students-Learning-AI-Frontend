import { useMemo, useState } from 'react';
import { Card, Button, IconButton, Select, Alert, Loader, CircularProgress } from '../../../components/common';
import { SearchableSelect } from '../../../components/ui/searchable-select';
import { useFocusTimer } from '../hooks/useFocusTimer';
import { useMyTasks } from '../hooks/useMyTasks';
import { useDailyCheckIn } from '../hooks/useDailyCheckIn';
import { useAuth } from '../../../hooks/useAuth';
import RegulationToolkitCard from '../components/RegulationToolkitCard';

const PLANNED_OPTIONS = [
  { value: '10', label: '10 minutes' },
  { value: '15', label: '15 minutes' },
  { value: '25', label: '25 minutes' },
  { value: '45', label: '45 minutes' },
];

const AUDIO_OPTIONS = [
  { value: '', label: 'No sound', icon: '🔇' },
  { value: 'rain', label: 'Rain sounds', icon: '🌧️' },
  { value: 'music', label: 'Focus music', icon: '🎧' },
];

function formatClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * "Take a breath, choose what you need, and get to it." - the Regulation
 * Toolkit and the Focus Timer, side by side. Grade 6+ only; the K-5
 * equivalent is still "coming soon" (KidComingSoonPage).
 */
export default function FocusTimerPage() {
  const { user } = useAuth();
  const timer = useFocusTimer();
  const tasks = useMyTasks();
  const checkIn = useDailyCheckIn(user?.id);

  const [plannedMinutes, setPlannedMinutes] = useState('25');
  const [taskId, setTaskId] = useState(null);
  const [audioIndex, setAudioIndex] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [justEnded, setJustEnded] = useState(null);

  const taskOptions = useMemo(
    () =>
      tasks.toDo
        .filter((item) => item.assignment?.id)
        .map((item) => ({ value: item.assignment.id, label: item.assignment.title })),
    [tasks.toDo]
  );

  if (timer.isLoading) return <Loader message="Loading your focus timer…" />;

  const { session } = timer;
  const isRunning = session?.status === 'in_progress';
  const isPaused = session?.status === 'paused';
  const isActive = isRunning || isPaused;

  const plannedSeconds = Number(plannedMinutes) * 60;
  const ringValue = isActive ? Math.min(timer.elapsedSeconds, plannedSeconds) : 0;
  const clockLabel = isActive
    ? formatClock(Math.max(plannedSeconds - timer.elapsedSeconds, 0))
    : formatClock(plannedSeconds);

  const audioOption = AUDIO_OPTIONS[audioIndex].value;

  const handleStart = () =>
    timer
      .start({ plannedMinutes: Number(plannedMinutes), taskId: taskId || undefined, audioOption: audioOption || undefined })
      .catch(() => {});

  const handleComplete = () =>
    timer
      .complete()
      .then((s) => setJustEnded({ outcome: 'completed', minutes: s?.actualMinutes ?? 0 }))
      .catch(() => {});

  const handleAbandon = () =>
    timer
      .abandon()
      .then(() => setJustEnded({ outcome: 'abandoned' }))
      .catch(() => {});

  return (
    <>
      <div className="ui-pageheader">
        <div>
          <h1 className="ui-pageheader__title">Focus</h1>
          <p className="ui-pageheader__description">Take a breath, choose what you need, and get to it.</p>
        </div>
      </div>

      {timer.error && (
        <Alert variant="error" className="ui-field">
          {timer.error}
        </Alert>
      )}

      {justEnded && (
        <Alert
          variant={justEnded.outcome === 'completed' ? 'success' : 'info'}
          className="ui-field"
          onDismiss={() => setJustEnded(null)}
        >
          {justEnded.outcome === 'completed'
            ? `Nice work - ${justEnded.minutes} focused ${justEnded.minutes === 1 ? 'minute' : 'minutes'}.`
            : 'Session ended. Every bit of focus still counts - start again whenever you’re ready.'}
        </Alert>
      )}

      {/*
        auto-fit + a 340px minimum, not a fixed two-column split: once the
        viewport can't fit both columns at that minimum width (tablet
        portrait and phone), the timer panel wraps below the toolkit instead
        of squeezing - no separate breakpoint needed.
      */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 'var(--spacing-lg)',
          alignItems: 'start',
        }}
      >
        <RegulationToolkitCard checkIn={checkIn} />

        <Card title="Focus Timer" subtitle="Pick a task, or just start the clock.">
          {!isActive && (
            <SearchableSelect
              label="Current task (optional)"
              placeholder="No task selected"
              options={taskOptions}
              value={taskId}
              onChange={(value) => setTaskId(value)}
              loading={tasks.isLoading}
              className="ui-field"
            />
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: 'var(--spacing-lg) 0',
              background: 'var(--color-surface-alt)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: 'var(--spacing-lg)',
            }}
          >
            <CircularProgress value={ringValue} max={plannedSeconds || 1} size={180} strokeWidth={12} label="Focus time">
              <span style={{ fontSize: 32, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{clockLabel}</span>
            </CircularProgress>
          </div>

          {/* Tucked behind the settings icon below - the ring is the focal
              point at rest, matching the reference design. */}
          {!isActive && showSettings && (
            <Select
              label="Planned length"
              value={plannedMinutes}
              onChange={(e) => setPlannedMinutes(e.target.value)}
              options={PLANNED_OPTIONS}
            />
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            {!isActive && (
              <Button loading={timer.isBusy} onClick={handleStart} fullWidth>
                Start focus
              </Button>
            )}

            {isRunning && (
              <Button variant="secondary" loading={timer.isBusy} onClick={() => timer.pause().catch(() => {})} fullWidth>
                Pause
              </Button>
            )}

            {isPaused && (
              <Button loading={timer.isBusy} onClick={() => timer.resume().catch(() => {})} fullWidth>
                Resume
              </Button>
            )}

            {isActive && (
              <Button variant="secondary" loading={timer.isBusy} onClick={handleComplete} fullWidth>
                Done
              </Button>
            )}

            {isActive && (
              <Button variant="ghost" loading={timer.isBusy} onClick={handleAbandon} fullWidth>
                End without finishing
              </Button>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-xs)' }}>
              <IconButton
                label={`Sound: ${AUDIO_OPTIONS[audioIndex].label}`}
                icon={<span aria-hidden="true">{AUDIO_OPTIONS[audioIndex].icon}</span>}
                onClick={() => setAudioIndex((i) => (i + 1) % AUDIO_OPTIONS.length)}
                style={{ width: 44, height: 44 }}
              />
              {!isActive && (
                <IconButton
                  label="Timer settings"
                  icon={<span aria-hidden="true">⚙️</span>}
                  onClick={() => setShowSettings((v) => !v)}
                  style={{ width: 44, height: 44 }}
                />
              )}
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
