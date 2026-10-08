import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LuGamepad2, LuPlus, LuWind } from 'react-icons/lu';
import { BlurFade } from '../../../../components/ui/blur-fade';
import { useApi } from '../../../../hooks/useApi';
import { cn } from '../../../../lib/utils';
import { useTodayCheckIn } from '../../../checkIn/hooks/useTodayCheckIn';
import regulationToolkitService from '../../services/regulationToolkit.service';
import { useFocusTimer } from '../../hooks/useFocusTimer';
import { useMyTasks } from '../../hooks/useMyTasks';
import { BoosterIcon } from '../../components/brainBoosters/BoosterIcon';
import { BRAIN_GAMES, boosterPath, suggestBooster } from '../../components/brainBoosters/boosters';
import { KidDifficultyPicker } from '../../components/kid/KidDifficultyPicker';
import { KidFocusTimerCard } from '../../components/kid/KidFocusTimerCard';
import { KidSkeleton } from '../../components/kid/KidStates';
import { KidTaskPicker } from '../../components/kid/KidTaskPicker';
import { FOCUS_ACTIVITIES, activitySeconds } from '../../components/kid/focusActivities';
import { KID_TILE_INK, KID_TILE_TONES } from '../../components/kid/kidTileTones';
import { StickerArt } from '../../components/rewards/StickerArt';

// A calm 25 minutes, always - no dropdown, one clear default. K-4 isn't
// asked "how much time do you have" at check-in, and picking a number isn't
// the point of this page - starting is.
const PLANNED_MINUTES = 25;

const TABS = [
  { key: 'calm', label: 'Calm & move', icon: LuWind },
  { key: 'games', label: 'Brain games', icon: LuGamepad2 },
];

/** Calm & move (Breathe / Wiggle / Listen) and the brain games, as one card shape. */
const CALM_CARDS = FOCUS_ACTIVITIES.map((a) => ({
  key: a.key,
  to: `/student/focus/${a.key}`,
  label: a.label,
  blurb: a.blurb.replace(/\.$/, ''),
  tone: a.tone,
  icon: <a.icon className="size-6" />,
  minutes: Math.max(1, Math.ceil(activitySeconds(a) / 60)),
  categories: a.categories,
}));
const GAME_CARDS = BRAIN_GAMES.map((g) => ({
  key: g.id,
  to: boosterPath(g),
  label: g.label,
  blurb: g.kidBlurb,
  tone: g.tone,
  icon: <BoosterIcon name={g.icon} size={24} />,
  minutes: g.minutes,
  categories: g.categories,
}));

function BreakCard({ card, suggested, onOpen }) {
  return (
    <Link
      to={card.to}
      onClick={(event) => onOpen?.(event, card.to)}
      className={cn(
        'relative flex h-full flex-col items-center gap-2 rounded-[1.75rem] border px-4 pb-6 pt-7 text-center no-underline shadow-paper transition-transform duration-150 hover:-translate-y-0.5',
        KID_TILE_TONES[card.tone]
      )}
    >
      {suggested && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-kid-yellow px-3 py-0.5 font-kid-display text-xs font-semibold text-kid-ink shadow-paper">
          ✨ Try this
        </span>
      )}
      <span aria-hidden="true" className={cn('grid size-14 place-items-center rounded-full bg-kid-sheet shadow-paper', KID_TILE_INK[card.tone])}>
        {card.icon}
      </span>
      <span className="mt-2 font-kid-display text-xl font-semibold text-kid-ink">{card.label}</span>
      <span className="font-kid-body text-base leading-snug text-kid-ink-soft">{card.blurb}</span>
      <span className="mt-auto rounded-full bg-kid-sheet px-3 py-0.5 font-kid-display text-sm font-semibold text-kid-ink">{card.minutes} min</span>
    </Link>
  );
}

/**
 * K-4 "Focus time 🔥" - built to the Kids Focus mockups. One big clock and
 * one obvious button, the next task on top ("Up next", or pick another with
 * the dashed "+"), and "Need a minute first?" underneath: Calm & move
 * (Breathe / Wiggle / Listen, their own pages) or Brain games (Finger Follow,
 * Balloon Eyes, Memory - pages/kid/KidBoosterPage.jsx). What used to be the
 * separate Brain Boosters page lives here now; `?boost=games` opens on the
 * games. Grade 6+ gets FocusTimerPage.
 *
 * The clock itself is KidFocusTimerCard - the same card a task page shows
 * once the task is started (KidTaskFocus).
 */
export default function KidFocusPage() {
  const timer = useFocusTimer();
  const tasks = useMyTasks();
  const { checkIn } = useTodayCheckIn();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const recommendation = useApi(regulationToolkitService.getRecommendation);
  const { run: runRecommendation } = recommendation;

  // Read once: which set of breaks to show first, and whether to go there.
  const [boost] = useState(() => params.get('boost'));
  const [tab, setTab] = useState(boost === 'games' ? 'games' : 'calm');
  const [askingTricky, setAskingTricky] = useState(false);
  const [picking, setPicking] = useState(false);
  // undefined: the soonest to-do task; null: just the timer; else an assignment id.
  const [chosenId, setChosenId] = useState(undefined);
  const breaksRef = useRef(null);

  // A quiet "try this" nudge from today's check-in (read server-side) - no
  // banner text here, just a badge on the one card that best matches.
  useEffect(() => {
    if (checkIn) runRecommendation().catch(() => {});
  }, [checkIn, runRecommendation]);

  // Arriving from a game's "Back to Focus" or Home's Brain Boosters card.
  useEffect(() => {
    if (boost && !timer.isLoading) breaksRef.current?.scrollIntoView({ block: 'start' });
  }, [boost, timer.isLoading]);

  const toDo = !tasks.isLoading && !tasks.error ? tasks.toDo : [];
  const upNext =
    chosenId === undefined ? toDo[0] ?? null : chosenId === null ? null : toDo.find((t) => t.assignment?.id === chosenId) ?? null;
  const cards = tab === 'games' ? GAME_CARDS : CALM_CARDS;
  const suggested = suggestBooster(recommendation.data?.categories ?? [], cards);

  // A break isn't focus time: a running clock pauses before the break opens.
  const openBreak = (event, to) => {
    if (timer.session?.status !== 'in_progress') return;
    event.preventDefault();
    timer
      .pause()
      .catch(() => {})
      .finally(() => navigate(to));
  };

  if (timer.isLoading) {
    return (
      <div data-kid-page className="kid-ui mx-auto max-w-4xl px-4 py-10 sm:px-8">
        <KidSkeleton className="h-72" />
      </div>
    );
  }

  return (
    <div data-kid-page className="kid-ui min-h-full">
      <div className="mx-auto max-w-4xl px-4 pb-10 pt-6 sm:px-8">
        <h1 className="flex items-center gap-2 font-kid-display text-4xl font-semibold text-kid-ink sm:text-5xl">
          Focus time <StickerArt slug="flame" className="size-10 shrink-0 sm:size-12" />
        </h1>
        <p className="mt-2 text-lg text-kid-ink-soft">Start the clock and do one thing.</p>

        <KidFocusTimerCard
          timer={timer}
          variant="page"
          plannedMinutes={PLANNED_MINUTES}
          assignmentId={upNext?.assignment?.id}
          className="mt-6"
          idleHeader={
            upNext && (
              <div className="max-w-xl text-center">
                <p className="font-kid-display text-xs font-bold uppercase tracking-[0.14em] text-kid-ink-soft">Up next</p>
                <p className="mt-1 font-kid-display text-2xl font-semibold text-kid-ink">{upNext.assignment?.title}</p>
              </div>
            )
          }
          corner={
            toDo.length > 0 && (
              <button
                type="button"
                onClick={() => setPicking(true)}
                aria-label="Choose what to work on"
                title="Choose what to work on"
                className="grid size-11 -rotate-6 place-items-center rounded-xl border-2 border-dashed border-kid-ink-soft/60 bg-kid-sheet text-kid-ink-soft transition-colors hover:border-kid-teal hover:text-kid-teal"
              >
                <LuPlus className="size-5" aria-hidden="true" />
              </button>
            )
          }
        />

        <KidTaskPicker
          isOpen={picking}
          tasks={toDo}
          chosenId={upNext?.assignment?.id ?? null}
          onChoose={setChosenId}
          onClose={() => setPicking(false)}
        />

        <section ref={breaksRef} aria-labelledby="kid-breaks-title" className="mt-8 scroll-mt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="kid-breaks-title" className="flex items-center gap-2 font-kid-display text-2xl font-semibold text-kid-ink">
              Need a minute first? <StickerArt slug="star" className="size-8 shrink-0" />
            </h2>
            <div role="group" aria-label="Kind of break" className="inline-flex rounded-full bg-kid-paper-deep p-1">
              {TABS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={tab === key}
                  onClick={() => setTab(key)}
                  className={cn(
                    'inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 font-kid-display text-base font-medium transition-colors',
                    tab === key ? 'bg-kid-sheet text-kid-ink shadow-paper' : 'text-kid-ink-soft hover:text-kid-ink'
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {cards.map((card, i) => (
              <BlurFade key={card.key} delay={0.05 * i}>
                <BreakCard card={card} suggested={card.key === suggested?.key} onOpen={openBreak} />
              </BlurFade>
            ))}
          </div>
        </section>

        {/* Saying what is in the way is always here too - the reasons and
            what is offered back are Super Admin's lists. */}
        <p className="mt-8 text-center">
          <button
            type="button"
            onClick={() => setAskingTricky(true)}
            className="min-h-11 rounded-full px-4 font-kid-display text-base font-medium text-kid-ink-soft underline decoration-dotted underline-offset-4 hover:text-kid-ink"
          >
            Something&apos;s tricky?
          </button>
        </p>

        <KidDifficultyPicker isOpen={askingTricky} onClose={() => setAskingTricky(false)} />
      </div>
    </div>
  );
}
