import { getExercise } from '../brainBoosters/exerciseBreaks';

/**
 * A small picture of a Brain Booster beside its description on the Focus
 * page (the mockup's dark Finger Follow board with its gold dot). Decorative;
 * the illustration colours are the games' own and match their pages.
 */
export function BoosterPreview({ booster }) {
  if (booster.game === 'finger') {
    return (
      <svg className="fs-boost-preview" viewBox="0 0 200 124" aria-hidden="true">
        <rect width="200" height="124" rx="14" fill="#1d1b1a" />
        <path d="M18 92c26-40 52-54 78-30s48 28 86-26" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="2" strokeDasharray="3 5" />
        <circle cx="96" cy="62" r="17" fill="rgba(255,210,77,0.25)" />
        <circle cx="96" cy="62" r="10" fill="#ffd24d" />
      </svg>
    );
  }
  if (booster.game === 'balloon') {
    return (
      <svg className="fs-boost-preview" viewBox="0 0 200 124" aria-hidden="true">
        <defs>
          <linearGradient id="fs-sky" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#9fd1e8" />
            <stop offset="1" stopColor="#e3f3fb" />
          </linearGradient>
        </defs>
        <rect width="200" height="124" rx="14" fill="url(#fs-sky)" />
        <rect x="22" y="18" width="40" height="11" rx="5.5" fill="rgba(255,255,255,0.8)" />
        <rect x="140" y="30" width="32" height="9" rx="4.5" fill="rgba(255,255,255,0.8)" />
        <ellipse cx="100" cy="58" rx="19" ry="23" fill="#e5484d" />
        <path d="M100 81c-6 8 6 12 0 22" fill="none" stroke="#7a5a2b" strokeWidth="1.5" />
      </svg>
    );
  }
  if (booster.game === 'memory') {
    return (
      <svg className="fs-boost-preview" viewBox="0 0 200 124" aria-hidden="true">
        <rect width="200" height="124" rx="14" fill="#f4ecdc" />
        <rect x="58" y="14" width="40" height="44" rx="10" fill="#7ec8e3" />
        <rect x="102" y="14" width="40" height="44" rx="10" fill="#f7c948" stroke="#b7860b" strokeWidth="3" />
        <rect x="58" y="66" width="40" height="44" rx="10" fill="#e8a0bf" />
        <rect x="102" y="66" width="40" height="44" rx="10" fill="#86b878" />
      </svg>
    );
  }
  const exercise = getExercise(booster.exercise);
  return (
    <span className="fs-boost-preview fs-boost-preview--emoji" data-tone={booster.tone} aria-hidden="true">
      {exercise?.icon ?? '🌿'}
    </span>
  );
}

export default BoosterPreview;
