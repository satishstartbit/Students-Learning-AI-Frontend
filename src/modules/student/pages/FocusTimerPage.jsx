import { useState } from 'react';
import { Card, Button, Select, Alert, Loader } from '../../../components/common';
import { useFocusTimer } from '../hooks/useFocusTimer';

const PLANNED_OPTIONS = [
  { value: '10', label: '10 minutes' },
  { value: '15', label: '15 minutes' },
  { value: '25', label: '25 minutes' },
  { value: '45', label: '45 minutes' },
];

function formatClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * A calm timer to help a student focus on one thing at a time. Grade 6+
 * only - the K-5 equivalent is still "coming soon" (KidComingSoonPage).
 *
 * The clock is a plain, still number rather than an animated ring or
 * confetti - "calm" is the point, distinct from the celebratory tone of
 * Rewards.
 */
export default function FocusTimerPage() {
  const timer = useFocusTimer();
  const [plannedMinutes, setPlannedMinutes] = useState('25');
  const [justEnded, setJustEnded] = useState(null);

  if (timer.isLoading) return <Loader message="Loading your focus timer…" />;

  const { session } = timer;
  const isRunning = session?.status === 'in_progress';
  const isPaused = session?.status === 'paused';
  const isActive = isRunning || isPaused;

  const handleStart = () => timer.start({ plannedMinutes: Number(plannedMinutes) }).catch(() => {});

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
          <p className="ui-pageheader__description">Tune out distractions and get in the zone.</p>
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

      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-lg)', padding: 'var(--spacing-lg) 0' }}>
          <div
            aria-live="polite"
            style={{
              fontSize: 64,
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              color: 'var(--color-text-primary)',
              lineHeight: 1,
            }}
          >
            {formatClock(timer.elapsedSeconds)}
          </div>

          {!isActive && (
            <Select
              label="Planned length"
              value={plannedMinutes}
              onChange={(e) => setPlannedMinutes(e.target.value)}
              options={PLANNED_OPTIONS}
              fieldClassName="mb-0"
              style={{ minWidth: 220 }}
            />
          )}

          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            {!isActive && (
              <Button size="lg" loading={timer.isBusy} onClick={handleStart}>
                Start focus
              </Button>
            )}

            {isRunning && (
              <Button size="lg" variant="secondary" loading={timer.isBusy} onClick={() => timer.pause().catch(() => {})}>
                Pause
              </Button>
            )}

            {isPaused && (
              <Button size="lg" loading={timer.isBusy} onClick={() => timer.resume().catch(() => {})}>
                Resume
              </Button>
            )}

            {isActive && (
              <Button size="lg" variant="secondary" loading={timer.isBusy} onClick={handleComplete}>
                Done
              </Button>
            )}

            {isActive && (
              <Button size="lg" variant="ghost" loading={timer.isBusy} onClick={handleAbandon}>
                End without finishing
              </Button>
            )}
          </div>
        </div>
      </Card>
    </>
  );
}
