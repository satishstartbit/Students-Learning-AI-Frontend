import { PaperCard } from './PaperKit';

/**
 * "My progress" - today's task completion as one glance, from the mockup.
 * Replaces the star/heart EncouragementNote in that slot on the Home page -
 * a count of finished work read better as "how close am I" (a progress bar)
 * than a running tally.
 */
export function MyProgressCard({ done = 0, total = 0 }) {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  const allDone = total > 0 && done >= total;

  return (
    <PaperCard as="section" aria-labelledby="kid-progress-title" tone="sheet" className="px-5 py-5">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-kid-yellow text-xl"
        >
          🏆
        </span>
        <h2 id="kid-progress-title" className="font-kid-display text-lg font-semibold text-kid-ink">
          My progress
        </h2>
      </div>

      <div
        className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-kid-paper-deep"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Tasks done today"
      >
        <div
          className="h-full rounded-full bg-kid-teal transition-[width] duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="mt-3 font-kid-display text-base font-semibold text-kid-ink">
        {total > 0 ? `${done} of ${total} tasks done today` : 'No tasks today'}
      </p>
      <p className="mt-1 font-kid-body text-sm text-kid-ink-soft">
        {allDone ? "You finished them all - amazing!" : total > 0 ? 'Keep going, you are nearly there!' : 'Enjoy your day!'}
      </p>
    </PaperCard>
  );
}

export default MyProgressCard;
