import { cn } from '../../../../lib/utils';
import { usesLegacyArt } from '../../../checkIn/moods';
import { AdminMoodTile } from './AdminMoodTile';
import { MOOD_TILE } from './kidMoodTiles';

/**
 * A mood's tile - the icon on its own coloured circle.
 *
 * One component for every place a K-5 mood is shown (the check-in picker and
 * the reveal that follows it), so what a student picks is exactly what they
 * then see. Moods are admin-editable, so the rule is the same one
 * `usesLegacyArt` sets everywhere else:
 *
 *   - one of the six moods the app ships with, untouched by an admin -> the
 *     built-in line icon on its paper tone;
 *   - anything else -> AdminMoodTile, which shows that mood's uploaded icon
 *     (or its emoji) on the background colour Master Management gave it.
 *
 * `className` sizes it: `size-12` in the picker, `size-28` in the reveal.
 */

export function MoodArt({ mood, className = 'size-12', iconClassName = 'size-6' }) {
  const tile = usesLegacyArt(mood) ? MOOD_TILE[mood.code] : null;

  if (!tile) return <AdminMoodTile mood={mood} className={className} />;

  const Icon = tile.icon;
  return (
    <span aria-hidden="true" className={cn('grid shrink-0 place-items-center rounded-full', tile.tone, className)}>
      <Icon className={cn(iconClassName, tile.ink)} strokeWidth={2.2} />
    </span>
  );
}

export default MoodArt;
