import { LuTrophy } from 'react-icons/lu';
import { HomeCard, HomeCardIcon, HomeSticker } from './home/HomeBits';

/**
 * "My progress" - today's task completion as one glance, from the "Good
 * morning, Alex!" mockup: a trophy, a star sticker on the corner, and a bar
 * that fills up from empty when the page opens (still in calm mode).
 */
export function MyProgressCard({ done = 0, total = 0 }) {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  const allDone = total > 0 && done >= total;

  return (
    <HomeCard aria-labelledby="kid-progress-title" className="px-5 py-5">
      <HomeSticker slug="star" tilt={12} delay={0.8} className="-right-2 -top-3 size-10" />

      <div className="flex items-center gap-3">
        <HomeCardIcon icon={LuTrophy} tone="yellow" />
        <h2 id="kid-progress-title" className="font-kid-display text-lg font-semibold text-kid-ink">
          My progress
        </h2>
      </div>

      <div
        className="mt-4 h-3 w-full overflow-hidden rounded-full bg-kid-paper-deep"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Tasks done today"
      >
        <div className="kh-fill h-full rounded-full bg-kid-teal" style={{ width: `${percent}%` }} />
      </div>

      <p className="mt-3 font-kid-display text-base font-semibold text-kid-ink">
        {total > 0 ? `${done} of ${total} tasks done today` : 'No tasks today'}
      </p>
      <p className="mt-1 font-kid-body text-sm text-kid-ink-soft">
        {allDone ? 'You finished them all - amazing!' : total > 0 ? 'Keep going, you are nearly there!' : 'Enjoy your day!'}
      </p>
    </HomeCard>
  );
}

export default MyProgressCard;
