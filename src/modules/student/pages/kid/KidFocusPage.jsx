import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LuHeadphones } from 'react-icons/lu';
import { AnimatedCircularProgressBar } from '../../../../components/ui/animated-circular-progress-bar';
import { BlurFade } from '../../../../components/ui/blur-fade';
import { Confetti } from '../../../../components/ui/confetti';
import { cn } from '../../../../lib/utils';
import { useApi } from '../../../../hooks/useApi';
import { useTodayCheckIn } from '../../../checkIn/hooks/useTodayCheckIn';
import regulationToolkitService from '../../services/regulationToolkit.service';
import { useFocusTimer, formatClock } from '../../hooks/useFocusTimer';
import { useMotionAllowed } from '../../hooks/useKidPreferences';
import { useMyTasks } from '../../hooks/useMyTasks';
import { KidButton } from '../../components/kid/KidButton';
import { KidSkeleton } from '../../components/kid/KidStates';
import { PaperCard } from '../../components/kid/PaperKit';
import { FOCUS_ACTIVITIES, activitySeconds } from '../../components/kid/focusActivities';

const CONFETTI_COLOURS = ['#f6c445', '#f4b6c1', '#1f7a80', '#7b68d6', '#95c07b'];

// A calm 25 minutes, always - no dropdown, one clear default. K-5 isn't
// asked "how much time do you have" at check-in, and picking a number isn't
// the point of this page - starting is.
const PLANNED_MINUTES = 25;

function ToolTile({ tile, suggested }) {
  const Icon = tile.icon;

  return (
    <PaperCard
      as={Link}
      to={`/student/focus/${tile.key}`}
      tone={tile.tone}
      className="relative flex flex-col items-center gap-1.5 px-4 py-5 text-center no-underline transition-transform duration-150 hover:-translate-y-0.5"
    >
      {suggested && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-kid-yellow px-3 py-0.5 font-kid-display text-xs font-semibold text-[#6b4f05] shadow-paper">
          ✨ Try this
        </span>
      )}
      <span aria-hidden="true" className="grid size-12 place-items-center rounded-full bg-white/85 text-kid-ink shadow-paper">
        <Icon className="size-6" />
      </span>
      <span className="font-kid-display text-xl font-semibold text-kid-ink">{tile.label}</span>
      <span className="font-kid-body text-sm text-kid-ink-soft">{tile.blurb}</span>
      <span className="mt-1 rounded-full bg-white/70 px-3 py-0.5 font-kid-display text-sm font-medium text-kid-ink">
        {formatClock(activitySeconds(tile))}
      </span>
    </PaperCard>
  );
}

/**
 * K-5 "Focus time" - a big ring and one obvious button, plus three calming
 * tools to try first if a student isn't ready to start yet. From the
 * mockup. Grade 6+ gets the fuller FocusTimerPage (task picker, planned
 * length, five categories); this is the same feature, read down to what a
 * young student needs: pick a tool or just start the clock.
 */
export default function KidFocusPage() {
  const timer = useFocusTimer();
  const tasks = useMyTasks();
  const { checkIn } = useTodayCheckIn();
  const motionAllowed = useMotionAllowed();
  const confettiRef = useRef(null);

  const recommendation = useApi(regulationToolkitService.getRecommendation);
  const { run: runRecommendation } = recommendation;

  const [justEnded, setJustEnded] = useState(null);

  // A quiet "try this" nudge from today's check-in (read server-side) - no
  // banner text here, just a badge on the matching tile.
  useEffect(() => {
    if (checkIn) runRecommendation().catch(() => {});
  }, [checkIn, runRecommendation]);

  const nextTask = !tasks.isLoading && !tasks.error ? tasks.toDo[0] ?? null : null;

  const suggestedCategories = recommendation.data?.categories ?? [];

  if (timer.isLoading) {
    return (
      <div data-kid-page className="kid-ui mx-auto max-w-2xl px-4 py-10 sm:px-8">
        <KidSkeleton className="h-72" />
      </div>
    );
  }

  const { session } = timer;
  const isRunning = session?.status === 'in_progress';
  const isPaused = session?.status === 'paused';
  const isActive = isRunning || isPaused;

  const plannedSeconds = PLANNED_MINUTES * 60;
  const ringValue = isActive ? Math.min(timer.elapsedSeconds, plannedSeconds) : 0;
  const clockLabel = isActive
    ? formatClock(Math.max(plannedSeconds - timer.elapsedSeconds, 0))
    : formatClock(plannedSeconds);
  const supportLabel = isPaused ? 'Paused - resume when ready' : isRunning ? "You've got this!" : 'Ready when you are';

  const handleStart = () =>
    timer.start({ plannedMinutes: PLANNED_MINUTES, taskId: nextTask?.assignment?.id }).catch(() => {});

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
    <div data-kid-page className="kid-ui min-h-full">
      <Confetti
        ref={confettiRef}
        manualstart
        globalOptions={{ resize: true, useWorker: false }}
        className="pointer-events-none fixed inset-0 z-30 size-full"
      />

      <div className="mx-auto max-w-2xl px-4 pb-10 pt-6 sm:px-8">
        <div className="text-center">
          <h1 className="font-kid-display text-4xl font-semibold text-kid-ink sm:text-5xl">Focus time</h1>
          <p className="mt-2 text-lg text-kid-ink-soft">Start the clock and do one thing.</p>
        </div>

        <PaperCard
          as="section"
          aria-label="Focus timer"
          tone="sheet"
          className="mt-6 flex flex-col items-center gap-5 px-6 py-8 sm:px-10 sm:py-10"
        >
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

          {!isActive && nextTask && (
            <div className="text-center">
              <p className="font-kid-display text-xs font-bold uppercase tracking-wide text-kid-ink-soft">Up next</p>
              <p className="font-kid-display text-lg font-semibold text-kid-ink">{nextTask.assignment?.title}</p>
            </div>
          )}

          <div className="relative grid size-48 place-items-center sm:size-56">
            <AnimatedCircularProgressBar
              value={ringValue}
              max={plannedSeconds || 1}
              gaugePrimaryColor="var(--kid-teal)"
              gaugeSecondaryColor="var(--kid-paper-deep)"
              className="absolute inset-0 size-full [&_[data-current-value]]:hidden"
            />
            <div className="relative flex flex-col items-center">
              <span className="font-kid-display text-4xl font-bold tabular-nums text-kid-ink sm:text-5xl">
                {clockLabel}
              </span>
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

        <h2 className="mt-8 text-center font-kid-hand text-[1.75rem] text-kid-ink">Need a minute first?</h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {FOCUS_ACTIVITIES.map((tile, i) => (
            <BlurFade key={tile.key} delay={0.05 * i}>
              <ToolTile tile={tile} suggested={tile.categories.some((c) => suggestedCategories.includes(c))} />
            </BlurFade>
          ))}
        </div>
      </div>
    </div>
  );
}
