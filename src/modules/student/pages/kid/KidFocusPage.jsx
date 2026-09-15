import { useEffect, useMemo, useRef, useState } from 'react';
import { LuHeadphones, LuMusic2, LuWind, LuZap } from 'react-icons/lu';
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
import { formatMinutes } from '../../components/kid/kidFormat';
import { KidButton } from '../../components/kid/KidButton';
import { KidOops, KidSkeleton } from '../../components/kid/KidStates';
import { PaperCard } from '../../components/kid/PaperKit';

const CONFETTI_COLOURS = ['#f6c445', '#f4b6c1', '#1f7a80', '#7b68d6', '#95c07b'];

// A calm 25 minutes, always - no dropdown, one clear default. K-5 isn't
// asked "how much time do you have" at check-in, and picking a number isn't
// the point of this page - starting is.
const PLANNED_MINUTES = 25;

/**
 * The three regulation categories simplified to what a young student reads
 * in one glance. Each pools the same admin-managed tools the Grade 6+
 * Regulation Toolkit uses (services/regulationToolkit.service.js on the
 * backend) - "Calming Sounds" and "Music" both read as "Listen" here, same
 * as they read as one "Sound" tab there.
 */
const KID_TILES = [
  { key: 'Breathing', label: 'Breathe', blurb: 'In and out, nice and slow', tone: 'sky', icon: LuWind },
  { key: 'Movement', label: 'Wiggle', blurb: 'Shake the fidgets out', tone: 'green', icon: LuZap },
  {
    key: 'Sound',
    label: 'Listen',
    blurb: 'Quiet sounds to help you settle',
    tone: 'pink',
    icon: LuMusic2,
    sourceCategories: ['Calming Sounds', 'Music'],
  },
];

const tileCategories = (tile) => tile.sourceCategories ?? [tile.key];

/** The tile's best-matched suggested tool if there is one, otherwise its first tool. */
function toolForTile(categories, tile, suggestions) {
  const wanted = tileCategories(tile);
  const suggested = suggestions.find((t) => wanted.includes(t.category));
  if (suggested) return suggested;
  const tools = categories.filter((c) => wanted.includes(c.category)).flatMap((c) => c.tools);
  return tools[0] ?? null;
}

function ToolTile({ tile, tool, expanded, suggested, onToggle }) {
  const Icon = tile.icon;

  return (
    <PaperCard
      as="button"
      type="button"
      tone={tile.tone}
      onClick={onToggle}
      aria-expanded={expanded}
      aria-controls="kid-focus-tool-detail"
      className={cn(
        'relative flex flex-col items-center gap-1.5 px-4 py-5 text-center transition-transform duration-150',
        expanded ? 'ring-[3px] ring-kid-ink/25' : 'hover:-translate-y-0.5'
      )}
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
      {tool?.durationMinutes ? (
        <span className="mt-1 rounded-full bg-white/70 px-3 py-0.5 font-kid-display text-sm font-medium text-kid-ink">
          {formatMinutes(tool.durationMinutes)}
        </span>
      ) : null}
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

  const { data: categories, isLoading: toolsLoading, error: toolsError, run: reloadTools } = useApi(
    regulationToolkitService.listCategories,
    { immediate: true }
  );
  const recommendation = useApi(regulationToolkitService.getRecommendation);
  const { run: runRecommendation } = recommendation;

  const [expandedKey, setExpandedKey] = useState(null);
  const [justEnded, setJustEnded] = useState(null);

  // A quiet "try this" nudge from today's check-in (read server-side) - no
  // banner text here, just a badge on the matching tiles.
  useEffect(() => {
    if (checkIn) runRecommendation().catch(() => {});
  }, [checkIn, runRecommendation]);

  const nextTask = !tasks.isLoading && !tasks.error ? tasks.toDo[0] ?? null : null;

  const suggestions = useMemo(() => recommendation.data?.suggestions ?? [], [recommendation.data]);
  const suggestedCategories = recommendation.data?.categories ?? [];

  const tiles = useMemo(
    () =>
      KID_TILES.map((tile) => ({
        tile,
        tool: categories ? toolForTile(categories, tile, suggestions) : null,
      })),
    [categories, suggestions]
  );
  const expandedTool = tiles.find(({ tile }) => tile.key === expandedKey)?.tool ?? null;

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

        {toolsError ? (
          <div className="mt-4">
            <KidOops message="We couldn't load the calming tools." onRetry={reloadTools} />
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {toolsLoading
              ? [0, 1, 2].map((i) => <KidSkeleton key={i} className="h-40" />)
              : tiles.map(({ tile, tool }, i) => (
                  <BlurFade key={tile.key} delay={0.05 * i}>
                    <ToolTile
                      tile={tile}
                      tool={tool}
                      expanded={expandedKey === tile.key}
                      suggested={tileCategories(tile).some((c) => suggestedCategories.includes(c))}
                      onToggle={() => setExpandedKey((k) => (k === tile.key ? null : tile.key))}
                    />
                  </BlurFade>
                ))}
          </div>
        )}

        {expandedTool && (
          <BlurFade>
            <PaperCard id="kid-focus-tool-detail" tone="sheet" className="mt-4 px-6 py-5">
              <h3 className="font-kid-display text-xl font-semibold text-kid-ink">{expandedTool.name}</h3>
              <p className="mt-1 text-lg text-kid-ink-soft">{expandedTool.instructions || expandedTool.description}</p>
            </PaperCard>
          </BlurFade>
        )}
      </div>
    </div>
  );
}
