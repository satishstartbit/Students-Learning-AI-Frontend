import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BlurFade } from '../../../../components/ui/blur-fade';
import { useApi } from '../../../../hooks/useApi';
import { useTodayCheckIn } from '../../../checkIn/hooks/useTodayCheckIn';
import regulationToolkitService from '../../services/regulationToolkit.service';
import { useFocusTimer, formatClock } from '../../hooks/useFocusTimer';
import { useMyTasks } from '../../hooks/useMyTasks';
import { KidButton } from '../../components/kid/KidButton';
import { KidDifficultyPicker } from '../../components/kid/KidDifficultyPicker';
import { KidFocusTimerCard } from '../../components/kid/KidFocusTimerCard';
import { KidSkeleton } from '../../components/kid/KidStates';
import { PaperCard } from '../../components/kid/PaperKit';
import { FOCUS_ACTIVITIES, activitySeconds } from '../../components/kid/focusActivities';

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
 *
 * The clock itself is KidFocusTimerCard - the same card a task page shows
 * once the task is started (KidTaskFocus).
 */
export default function KidFocusPage() {
  const timer = useFocusTimer();
  const tasks = useMyTasks();
  const { checkIn } = useTodayCheckIn();

  const recommendation = useApi(regulationToolkitService.getRecommendation);
  const { run: runRecommendation } = recommendation;

  const [askingTricky, setAskingTricky] = useState(false);

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

  return (
    <div data-kid-page className="kid-ui min-h-full">
      <div className="mx-auto max-w-2xl px-4 pb-10 pt-6 sm:px-8">
        <div className="text-center">
          <h1 className="font-kid-display text-4xl font-semibold text-kid-ink sm:text-5xl">Focus time</h1>
          <p className="mt-2 text-lg text-kid-ink-soft">Start the clock and do one thing.</p>
        </div>

        <KidFocusTimerCard
          timer={timer}
          plannedMinutes={PLANNED_MINUTES}
          assignmentId={nextTask?.assignment?.id}
          className="mt-6"
          idleHeader={
            nextTask && (
              <div className="text-center">
                <p className="font-kid-display text-xs font-bold uppercase tracking-wide text-kid-ink-soft">Up next</p>
                <p className="font-kid-display text-lg font-semibold text-kid-ink">{nextTask.assignment?.title}</p>
              </div>
            )
          }
        />

        {/* Saying what is in the way comes before picking a tool - the
            reasons and what is offered back are Super Admin's lists. */}
        <div className="mt-6 text-center">
          <KidButton variant="soft" size="md" onClick={() => setAskingTricky(true)}>
            Something&apos;s tricky
          </KidButton>
        </div>

        <KidDifficultyPicker isOpen={askingTricky} onClose={() => setAskingTricky(false)} />

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
