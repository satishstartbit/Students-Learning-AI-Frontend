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

/** One face per check-in mood (modules/checkIn/moods.js). */
const FACES = {
  ready_to_focus: (
    <>
      {DOT_EYES}
      <path d="M19 37 Q32 56 45 37 Z" fill="var(--mood-mouth)" />
      <path d="M25 45 Q32 51 39 45 Q32 42 25 45 Z" fill="var(--mood-tongue)" />
    </>
  ),
  calm: (
    <>
      {HAPPY_EYES}
      <path d="M23 40 Q32 47 41 40" stroke={INK} strokeWidth="3.5" strokeLinecap="round" fill="none" />
    </>
  ),
  tired: (
    <>
      <g stroke={INK} strokeWidth="3.5" strokeLinecap="round" fill="none">
        <path d="M17 27 q5.5 5 11 0" />
        <path d="M36 27 q5.5 5 11 0" />
      </g>
      <ellipse cx="32" cy="44" rx="4.5" ry="5.5" fill="var(--mood-mouth)" />
    </>
  ),
  distracted: (
    <>
      <g fill="var(--mood-face-eye)" stroke={INK} strokeWidth="2">
        <circle cx="23" cy="27" r="6" />
        <circle cx="41" cy="27" r="6" />
      </g>
      <g fill={INK}>
        <circle cx="26" cy="24.5" r="2.6" />
        <circle cx="44" cy="24.5" r="2.6" />
      </g>
      <path d="M23 44 q4.5 -4 9 0 t9 0" stroke={INK} strokeWidth="3" strokeLinecap="round" fill="none" />
    </>
  ),
  tense: (
    <>
      {DOT_EYES}
      <g stroke={INK} strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M17 19 l9 3" />
        <path d="M47 19 l-9 3" />
        <path d="M22 45 q5 -4 10 0 t10 0" />
      </g>
    </>
  ),
  overwhelmed: (
    <>
      <g fill={INK}>
        <circle cx="23" cy="28" r="4" />
        <circle cx="41" cy="28" r="4" />
      </g>
      <g stroke={INK} strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M17 19 l8 -2" />
        <path d="M47 19 l-8 -2" />
      </g>
      <ellipse cx="32" cy="45" rx="6" ry="4.5" fill="var(--mood-mouth)" />
      <path d="M50 16 q3.5 5 0 8 q-3.5 -3 0 -8z" fill="var(--mood-drop)" />
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
      {FACES[mood] ?? FACES.calm}
    </svg>
  );
}

export default MoodFace;
