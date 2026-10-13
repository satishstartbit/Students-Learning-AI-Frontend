import { usesLegacyArt } from '../moods';

/**
 * The line symbol on a Grade 6+ mood tile.
 *
 * Moods are admin-editable master data, so what a tile shows is decided in
 * this order:
 *
 *   1. the mood's uploaded icon image (master_items.icon_file_id)
 *   2. one of the drawn glyphs below, for the six moods the app ships with,
 *      while an admin hasn't overridden them
 *   3. the mood's icon text - an emoji an admin typed, and what any mood
 *      beyond those six shows
 *   4. a plain dot, so a brand-new mood with no icon at all still renders
 *
 * Steps 1-3 are `usesLegacyArt` (modules/checkIn/moods.js), the same rule the
 * K-4 art follows, so both bands agree on when the built-in drawing applies:
 * the seeded emoji doesn't count as an override, but an uploaded icon or a
 * chosen background colour does.
 */

const STROKE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

/** Drawn defaults for the six moods this app ships with. */
const GLYPHS = {
  // Calm - still water.
  calm: (
    <>
      <circle cx="16" cy="9.5" r="3.2" {...STROKE} />
      <path d="M5 18c2.4-2.2 4.4-2.2 6.8 0s4.4 2.2 6.8 0 4.4-2.2 6.4 0" {...STROKE} />
      <path d="M7 23.5c2-1.8 3.7-1.8 5.7 0s3.7 1.8 5.7 0 3.7-1.8 5.4 0" {...STROKE} />
    </>
  ),
  // Tense - wound tight.
  tense: (
    <path
      d="M16 16.5a2.6 2.6 0 1 1 2.6 2.6 5.2 5.2 0 0 1-5.2-5.2 7.8 7.8 0 0 1 7.8-7.8 10.4 10.4 0 0 1 10.4 10.4"
      transform="translate(-4 -1) scale(0.86)"
      {...STROKE}
    />
  ),
  // Tired - night.
  tired: (
    <>
      <path d="M20.5 18.5A8.5 8.5 0 0 1 11 9a8.5 8.5 0 1 0 11.4 11.4 8.6 8.6 0 0 1-1.9-1.9Z" {...STROKE} />
      <path d="M23.5 6.5v3M22 8h3M26 12.5v2M25 13.5h2" {...STROKE} />
    </>
  ),
  // Distracted - attention scattering.
  distracted: (
    <>
      <path d="M21.5 8.5A8.5 8.5 0 1 0 22 20" {...STROKE} strokeDasharray="3 3.5" />
      <circle cx="25" cy="7" r="1.4" fill="currentColor" />
      <circle cx="28" cy="12" r="1" fill="currentColor" />
      <circle cx="24.5" cy="16" r="1.2" fill="currentColor" />
    </>
  ),
  // Overwhelmed - too much at once.
  overwhelmed: (
    <>
      <path d="M9.5 15.5a4.5 4.5 0 0 1 .6-9 6.4 6.4 0 0 1 12 1.2 4 4 0 0 1-.6 7.8Z" {...STROKE} />
      <path d="M11 19.5 9.5 23M16 19.5 14.5 23M21 19.5 19.5 23" {...STROKE} />
    </>
  ),
  // Ready to focus - on target.
  ready_to_focus: (
    <>
      <circle cx="15" cy="16" r="9" {...STROKE} />
      <circle cx="15" cy="16" r="4.5" {...STROKE} />
      <circle cx="15" cy="16" r="1.4" fill="currentColor" />
      <path d="M24 6.5v3M22.5 8h3" {...STROKE} />
    </>
  ),
};

/** 34px sits comfortably inside the 60px art panel with air around it. */
export function MoodGlyph({ mood, size = 34 }) {
  if (mood?.iconUrl) {
    return <img className="ci-mood__image" src={mood.iconUrl} alt="" aria-hidden="true" width={size} height={size} />;
  }

  const glyph = usesLegacyArt(mood) ? GLYPHS[mood.code] : null;
  if (glyph) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        {glyph}
      </svg>
    );
  }

  if (mood?.icon) {
    return (
      <span className="ci-mood__emoji" aria-hidden="true">
        {mood.icon}
      </span>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <circle cx="16" cy="16" r="6" {...STROKE} />
    </svg>
  );
}

export default MoodGlyph;
