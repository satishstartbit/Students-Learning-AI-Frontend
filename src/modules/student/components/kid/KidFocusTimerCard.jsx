import { useRef, useState } from 'react';
import { LuHeadphones } from 'react-icons/lu';
import { AnimatedCircularProgressBar } from '../../../../components/ui/animated-circular-progress-bar';
import { Confetti } from '../../../../components/ui/confetti';
import { cn } from '../../../../lib/utils';
import { formatClock } from '../../hooks/useFocusTimer';
import { useMotionAllowed } from '../../hooks/useKidPreferences';
import { KidButton } from './KidButton';
import { PaperCard } from './PaperKit';

const CONFETTI_COLOURS = ['#f6c445', '#f4b6c1', '#1f7a80', '#7b68d6', '#95c07b'];

/**
 * The K-5 focus clock: a big ring, the time left, and one obvious button -
 * then Pause / Resume, "All done!" (saves the time, with confetti) and "Stop
 * for now". From the Focus time mockup.
 *
 * Shared by the Focus time page (KidFocusPage) and the task page
 * (KidTaskFocus), so a clock started from either place looks and behaves the
 * same. The parent owns `timer` (useFocusTimer) and has already waited for it
 * to load.
 *
 * @param assignmentId  the task a new session is for (optional)
 * @param header        shown at the top of the card, always
 * @param idleHeader    shown at the top only while no clock is running
 */
export function KidFocusTimerCard({ timer, plannedMinutes = 25, assignmentId, header, idleHeader, className }) {
  const motionAllowed = useMotionAllowed();
  const confettiRef = useRef(null);
  const [justEnded, setJustEnded] = useState(null);

  const { session } = timer;
  const isRunning = session?.status === 'in_progress';
  const isPaused = session?.status === 'paused';
  const isActive = isRunning || isPaused;

  // A running session keeps the length it was started with.
  const plannedSeconds = (isActive ? session.plannedMinutes ?? plannedMinutes : plannedMinutes) * 60;
  const ringValue = isActive ? Math.min(timer.elapsedSeconds, plannedSeconds) : 0;
  const clockLabel = formatClock(isActive ? Math.max(plannedSeconds - timer.elapsedSeconds, 0) : plannedSeconds);
  const supportLabel = isPaused ? 'Paused - resume when ready' : isRunning ? "You've got this!" : 'Ready when you are';

  const handleStart = () =>
    timer
      .start({ plannedMinutes, assignmentId: assignmentId || undefined })
      .then(() => setJustEnded(null))
      .catch(() => {});

  const handleComplete = () =>
    timer
      .complete()
      .then((s) => {
        setJustEnded({ outcome: 'completed', minutes: s?.actualMinutes ?? 0 });
        if (motionAllowed) {
          confettiRef.current?.fire({
            particleCount: 70,
            spread: 80,
            startVelocity: 26,
            scalar: 0.9,
            origin: { y: 0.45 },
            colors: CONFETTI_COLOURS,
            disableForReducedMotion: true,
          });
        }
      })
      .catch(() => {});

  const handleAbandon = () =>
    timer
      .abandon()
      .then(() => setJustEnded({ outcome: 'abandoned' }))
      .catch(() => {});

  return (
    <>
      <Confetti
        ref={confettiRef}
        manualstart
        globalOptions={{ resize: true, useWorker: false }}
        className="pointer-events-none fixed inset-0 z-30 size-full"
      />

      <PaperCard
        as="section"
        aria-label="Focus timer"
        tone="sheet"
        className={cn('flex flex-col items-center gap-5 px-6 py-8 sm:px-10 sm:py-10', className)}
      >
        {header}

        {timer.error && (
          <p role="alert" className="w-full rounded-2xl bg-kid-coral-soft px-4 py-3 text-center font-kid-body text-kid-coral">
            {timer.error}
          </p>
        )}

        {justEnded && (
          <p
            role="status"
            className={cn(
              'w-full rounded-2xl px-4 py-3 text-center font-kid-display text-lg font-medium',
              justEnded.outcome === 'completed' ? 'bg-kid-green text-kid-ink' : 'bg-kid-paper-deep text-kid-ink-soft'
            )}
          >
            {justEnded.outcome === 'completed'
              ? `Nice work! ${justEnded.minutes} focused ${justEnded.minutes === 1 ? 'minute' : 'minutes'}. 🎉`
              : "That's okay - every bit of focus counts. Ready to try again?"}
          </p>
        )}

        {!isActive && idleHeader}

        <div className="relative grid size-48 place-items-center sm:size-56">
          <AnimatedCircularProgressBar
            value={ringValue}
            max={plannedSeconds || 1}
            gaugePrimaryColor="var(--kid-teal)"
            gaugeSecondaryColor="var(--kid-paper-deep)"
            className="absolute inset-0 size-full [&_[data-current-value]]:hidden"
          />
          <div className="relative flex flex-col items-center">
            <span className="font-kid-display text-4xl font-bold tabular-nums text-kid-ink sm:text-5xl">{clockLabel}</span>
            <span className="mt-1 font-kid-body text-base text-kid-ink-soft">{supportLabel}</span>
          </div>
        </div>

        <div className="flex w-full max-w-sm flex-col items-center gap-3">
          {!isActive && (
            <KidButton className="w-full" onClick={handleStart} disabled={timer.isBusy}>
              <LuHeadphones className="size-6" aria-hidden="true" />
              Start focus
            </KidButton>
          )}

          {isRunning && (
            <KidButton variant="soft" className="w-full" onClick={() => timer.pause().catch(() => {})} disabled={timer.isBusy}>
              Pause
            </KidButton>
          )}

          {isPaused && (
            <KidButton className="w-full" onClick={() => timer.resume().catch(() => {})} disabled={timer.isBusy}>
              Resume
            </KidButton>
          )}

          {isActive && (
            <>
              <KidButton variant="soft" className="w-full" onClick={handleComplete} disabled={timer.isBusy}>
                All done!
              </KidButton>
              <button
                type="button"
                onClick={handleAbandon}
                disabled={timer.isBusy}
                className="min-h-11 rounded-full px-4 font-kid-display text-base text-kid-ink-soft underline decoration-dotted hover:text-kid-ink"
              >
                Stop for now
              </button>
            </>
          )}
        </div>
      </PaperCard>
    </>
  );
}

export default KidFocusTimerCard;
