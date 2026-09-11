import { NumberTicker } from '../../../../components/ui/number-ticker';
import { useMotionAllowed } from '../../hooks/useKidPreferences';
import { StarIcon } from './KidIcons';
import { Heart, Sprout } from './KidScenery';
import { PaperCard, Tape } from './PaperKit';

/**
 * The yellow sticky note: praise for effort, not results - and, once the
 * student has handed something in, a count of it (Magic UI NumberTicker,
 * or the plain number in calm mode).
 */
export function EncouragementNote({ finishedCount = 0 }) {
  const motionAllowed = useMotionAllowed();

  return (
    <PaperCard
      as="section"
      aria-labelledby="kid-encouragement"
      tone="yellow"
      className="-rotate-1 px-6 pb-4 pt-7"
    >
      <Tape tone="lavender" className="-top-3 left-1/2 -translate-x-1/2 -rotate-3" />

      <h2 id="kid-encouragement" className="font-kid-hand text-[1.85rem] leading-tight text-kid-ink">
        You&apos;re doing great!
      </h2>
      <p className="mt-2 text-lg text-kid-ink-soft">Every bit of effort helps you grow.</p>

      {finishedCount > 0 && (
        <p className="mt-3 flex items-center gap-2 font-kid-display text-lg text-kid-ink">
          <StarIcon className="size-7 shrink-0" />
          <span>
            You handed in{' '}
            {motionAllowed ? (
              <NumberTicker value={finishedCount} className="font-semibold tracking-normal text-inherit" />
            ) : (
              <span className="font-semibold">{finishedCount}</span>
            )}{' '}
            {finishedCount === 1 ? 'task' : 'tasks'}!
          </span>
        </p>
      )}

      <div className="mt-3 flex items-end justify-between">
        <Heart className="size-7" />
        <Sprout className="-mb-2 -mr-2 w-14" />
      </div>
    </PaperCard>
  );
}

export default EncouragementNote;
