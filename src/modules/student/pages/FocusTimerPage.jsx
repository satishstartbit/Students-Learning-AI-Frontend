import { useMemo, useState } from 'react';
import { LuCloudRain, LuHeadphones, LuSettings, LuVolumeX } from 'react-icons/lu';
import { Card, Button, IconButton, Select, Alert, Loader, CircularProgress } from '../../../components/common';
import { SearchableSelect } from '../../../components/ui/searchable-select';
import { useFocusTimer, formatClock } from '../hooks/useFocusTimer';
import { useMyTasks } from '../hooks/useMyTasks';
import { useTodayCheckIn } from '../../checkIn/hooks/useTodayCheckIn';
import { useStudentSettings } from '../hooks/useStudentSettings';
import RegulationToolkitCard from '../components/RegulationToolkitCard';

// Mirrors StudentCheckInCard's "minutes free" options plus a classic 25 -
// so a length the student already told the check-in about is always pickable.
const PLANNED_OPTIONS = [
  { value: '15', label: '15 minutes' },
  { value: '20', label: '20 minutes' },
  { value: '25', label: '25 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '45', label: '45 minutes' },
  { value: '60', label: '60 minutes' },
];

const AUDIO_OPTIONS = [
  { value: '', label: 'No sound', icon: LuVolumeX },
  { value: 'rain', label: 'Rain sounds', icon: LuCloudRain },
  { value: 'music', label: 'Focus music', icon: LuHeadphones },
];

/**
 * "Take a breath, choose what you need, and get to it." - the Regulation
 * Toolkit and the Focus Timer, side by side. Grade 6+; the K-5 equivalent is
 * KidFocusPage. Only reachable after today's check-in (RequireCheckIn).
 */
export default function FocusTimerPage() {
  const timer = useFocusTimer();
  const { settings, isLoading: settingsLoading } = useStudentSettings();

  // Waits for Settings so the starting length and sound are the student's own
  // choices on first paint, rather than snapping over from a default.
  if (timer.isLoading || settingsLoading) return <Loader message="Loading your focus timer…" />;
  return <FocusTimer timer={timer} settings={settings} />;
}

function FocusTimer({ timer, settings }) {
  const tasks = useMyTasks();
  const { checkIn } = useTodayCheckIn();

  // Settings -> "Default focus length" decides how long a session runs when
  // Start is pressed. Without saved settings, fall back to today's check-in
  // ("30 minutes free"), then a classic 25.
  const [plannedMinutes, setPlannedMinutes] = useState(() => {
    if (settings?.defaultFocusMinutes) return String(settings.defaultFocusMinutes);
    return checkIn?.availableMinutes ? String(checkIn.availableMinutes) : '25';
  });
  const [taskId, setTaskId] = useState(null);
  // Settings -> "Background sound": start on the first sound instead of silence.
  const [audioIndex, setAudioIndex] = useState(() => (settings?.backgroundSound ? 1 : 0));
  const [showSettings, setShowSettings] = useState(false);
  const [justEnded, setJustEnded] = useState(null);

  const taskOptions = useMemo(
    () =>
      tasks.toDo
        .filter((item) => item.assignment?.id)
        .map((item) => ({ value: item.assignment.id, label: item.assignment.title })),
    [tasks.toDo]
  );

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
  const AudioIcon = AUDIO_OPTIONS[audioIndex].icon;

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
        <RegulationToolkitCard />

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
              background: 'var(--color-bg-surface-sunken)',
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
                icon={<AudioIcon aria-hidden="true" />}
                onClick={() => setAudioIndex((i) => (i + 1) % AUDIO_OPTIONS.length)}
                style={{ width: 44, height: 44 }}
              />
              {!isActive && (
                <IconButton
                  label="Timer settings"
                  icon={<LuSettings aria-hidden="true" />}
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
