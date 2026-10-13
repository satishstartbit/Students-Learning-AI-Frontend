import { LuStar } from 'react-icons/lu';
import { cn } from '../../../../../lib/utils';
import { StickerArt } from '../../rewards/StickerArt';
// The `kh-` motions and paper details used by these pieces and the Home cards.
import './kidHome.css';

/**
 * Small paper pieces the K-4 Home cards share (the "Good morning, Alex!"
 * mockup). Decoration only - every piece here is aria-hidden or carries its
 * own label.
 */

/** A strip of masking tape across a card's top edge, holding its label (kidHome.css `.kh-tape`). */
export function HomeTape({ as: Component = 'span', tone = 'yellow', className, children, ...props }) {
  return (
    <Component className={cn('kh-tape', `kh-tape--${tone}`, className)} {...props}>
      {children}
    </Component>
  );
}

/** A die-cut sticker (rewards/StickerArt) stuck on a card corner, gently moving. */
export function HomeSticker({ slug = 'star', motion = 'twinkle', tilt = 0, delay = 0, className }) {
  return (
    <span
      aria-hidden="true"
      className={cn('pointer-events-none absolute block', motion && `kh-${motion}`, className)}
      style={{ '--kh-tilt': `${tilt}deg`, '--kh-delay': `${delay}s` }}
    >
      <StickerArt slug={slug} className="size-full" />
    </span>
  );
}

const ICON_TONES = {
  green: 'bg-kid-green text-kid-green-deep',
  yellow: 'bg-kid-yellow text-[#8a6410]',
  sky: 'bg-kid-sky text-kid-navy',
  pink: 'bg-kid-pink/70 text-[#8f2f45]',
};

/** The round icon at the start of a rail card's heading. */
export function HomeCardIcon({ icon: Icon, tone = 'green', className }) {
  return (
    <span aria-hidden="true" className={cn('grid size-10 shrink-0 place-items-center rounded-full', ICON_TONES[tone], className)}>
      <Icon className="size-5" strokeWidth={2.2} />
    </span>
  );
}

/**
 * Only the stars a task earns, in gold (the mockup) - "how big is this task".
 * The accessible name still says out of how many.
 */
export function EarnedStars({ stars, max = 3, size = 'md', className }) {
  return (
    <span role="img" aria-label={`${stars} out of ${max} stars`} className={cn('inline-flex items-center gap-0.5', className)}>
      {Array.from({ length: stars }, (_, i) => (
        <LuStar
          key={i}
          aria-hidden="true"
          strokeWidth={1.6}
          className={cn('fill-kid-sun text-[#d99a1c]', size === 'sm' ? 'size-4' : 'size-5')}
        />
      ))}
    </span>
  );
}

/** A plain rail card - the mockup's white paper with a soft edge. */
export function HomeCard({ as: Component = 'section', className, children, ...props }) {
  return (
    <Component
      className={cn('relative rounded-[1.4rem] border border-kid-edge/60 bg-kid-sheet shadow-paper', className)}
      {...props}
    >
      {children}
    </Component>
  );
}
