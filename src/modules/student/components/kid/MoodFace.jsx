const INK = 'var(--mood-face-ink)';

const HAPPY_EYES = (
  <g stroke={INK} strokeWidth="3.5" strokeLinecap="round" fill="none">
    <path d="M17 29 q5.5 -7 11 0" />
    <path d="M36 29 q5.5 -7 11 0" />
  </g>
);

const DOT_EYES = (
  <g fill={INK}>
    <circle cx="23" cy="27" r="3.3" />
    <circle cx="41" cy="27" r="3.3" />
  </g>
);

const FACES = {
  great: (
    <>
      {HAPPY_EYES}
      <path d="M19 37 Q32 56 45 37 Z" fill="var(--mood-great-mouth)" />
      <path d="M25 45 Q32 51 39 45 Q32 42 25 45 Z" fill="var(--mood-great-tongue)" />
    </>
  ),
  good: (
    <>
      {HAPPY_EYES}
      <path d="M21 39 Q32 50 43 39" stroke={INK} strokeWidth="3.5" strokeLinecap="round" fill="none" />
    </>
  ),
  okay: (
    <>
      {DOT_EYES}
      <path d="M23 43 H41" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
    </>
  ),
  worried: (
    <>
      {DOT_EYES}
      <g stroke={INK} strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M17 19 l9 3" />
        <path d="M47 19 l-9 3" />
        <path d="M22 45 q5 -4 10 0 t10 0" />
      </g>
    </>
  ),
  sad: (
    <>
      {DOT_EYES}
      <path d="M22 47 Q32 37 42 47" stroke={INK} strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M46 33 q3.5 5 0 8 q-3.5 -3 0 -8z" fill="var(--mood-sad-tear)" />
    </>
  ),
};

/** A felt smiley for one of the check-in moods. Decorative - the mood's name is always shown or announced. */
export function MoodFace({ mood, className }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 64 64" className={className}>
      <circle cx="32" cy="32" r="29" fill="var(--mood-face-bg)" stroke="var(--mood-face-border)" strokeWidth="2" />
      <circle cx="17" cy="40" r="5" fill="var(--mood-face-cheek)" opacity="0.5" />
      <circle cx="47" cy="40" r="5" fill="var(--mood-face-cheek)" opacity="0.5" />
      {FACES[mood] ?? FACES.good}
    </svg>
  );
}

export default MoodFace;
