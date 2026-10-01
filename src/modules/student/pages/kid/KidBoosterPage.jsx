import { Link, Navigate, useParams } from 'react-router-dom';
import { LuChevronLeft, LuClock } from 'react-icons/lu';
import { cn } from '../../../../lib/utils';
import { BoosterGame } from '../../components/brainBoosters/BoosterGame';
import { getBooster } from '../../components/brainBoosters/boosters';
import { KID_TILE_TONES } from '../../components/kid/kidTileTones';
import { useMotionAllowed } from '../../hooks/useKidPreferences';

/**
 * K-5: one brain game on its own page (/student/focus/games/:id), opened
 * from Focus time's "Brain games" cards - built to the kids' Finger Follow
 * mockup, in the same frame as the Breathe / Wiggle / Listen pages
 * (KidFocusActivityPage): the game on its coloured paper, "How to play",
 * about how long, "Just for fun! Nothing is scored." and "Maybe later".
 * Exercises are Grade 6+ (K-5 has Calm & move), so those send back to Focus.
 */
export default function KidBoosterPage({ kind = 'game' }) {
  const { boosterId } = useParams();
  const booster = getBooster(kind, boosterId);
  const motionAllowed = useMotionAllowed();

  if (!booster || booster.kind !== 'game') return <Navigate to="/student/focus" replace />;

  return (
    <div data-kid-page className="kid-ui mx-auto max-w-5xl px-4 pb-10 pt-6 sm:px-8">
      <Link to="/student/focus?boost=games" className="inline-flex items-center gap-1 font-kid-body text-base text-kid-ink-soft no-underline hover:text-kid-ink">
        <LuChevronLeft className="size-4" aria-hidden="true" />
        Back to Focus
      </Link>

      <h1 className="mt-3 font-kid-display text-4xl font-semibold text-kid-ink sm:text-5xl">{booster.label}</h1>
      <p className="mt-1 text-lg text-kid-ink-soft">{booster.kidSubtitle}</p>

      <div className="mt-6 grid overflow-hidden rounded-[1.75rem] shadow-paper lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <section aria-label={booster.label} className={cn('bb-kid-game min-w-0 px-4 py-6 sm:px-8', KID_TILE_TONES[booster.tone] ?? KID_TILE_TONES.lavender)}>
          <BoosterGame booster={booster} isJunior reducedMotion={!motionAllowed} />
        </section>

        <div className="flex flex-col gap-5 bg-kid-sheet px-6 py-8 sm:px-8">
          <h2 className="font-kid-display text-lg font-bold text-kid-ink">How to play</h2>
          <ol className="flex flex-col gap-3">
            {booster.kidHow.map((step, i) => (
              <li key={step} className="flex items-start gap-3">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-kid-teal font-kid-display text-sm font-semibold text-white">{i + 1}</span>
                <span className="text-lg text-kid-ink">{step}</span>
              </li>
            ))}
          </ol>
          <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-kid-paper-deep px-3 py-1 font-kid-display text-sm font-medium text-kid-ink-soft">
            <LuClock className="size-4" aria-hidden="true" />
            About {booster.minutes} min
          </span>
          <p className="text-base text-kid-ink-soft">Just for fun! Nothing is scored.</p>
          <Link
            to="/student/focus"
            className="mt-auto self-center rounded-full px-4 py-2 font-kid-display text-base font-semibold text-kid-ink no-underline hover:underline"
          >
            Maybe later
          </Link>
        </div>
      </div>
    </div>
  );
}
