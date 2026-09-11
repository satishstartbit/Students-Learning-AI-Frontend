import { Link } from 'react-router-dom';
import { LeafIcon } from './KidIcons';
import { PaperCard } from './PaperKit';

/**
 * "Focus time" - a full-width teaser on the Home page linking to /student/focus
 * (still KidComingSoonPage - see routeConfig.js), from the mockup.
 */
export function FocusTeaserCard() {
  return (
    <PaperCard
      as="section"
      aria-labelledby="kid-focus-title"
      tone="sheet"
      className="flex flex-col items-center gap-3 px-6 py-7 text-center"
    >
      <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full bg-kid-sky">
        <LeafIcon className="size-6" />
      </span>
      <h2 id="kid-focus-title" className="font-kid-display text-lg font-semibold text-kid-ink">
        Focus time
      </h2>
      <p className="-mt-2 font-kid-body text-kid-ink-soft">Get in the zone</p>

      <Link
        to="/student/focus"
        className="mt-1 inline-flex min-h-12 w-full max-w-md items-center justify-center gap-2 rounded-full bg-kid-teal px-6 font-kid-display text-lg font-semibold text-white no-underline hover:bg-kid-teal-deep"
      >
        <span aria-hidden="true">🎧</span>
        Start focus
      </Link>
    </PaperCard>
  );
}

export default FocusTeaserCard;
