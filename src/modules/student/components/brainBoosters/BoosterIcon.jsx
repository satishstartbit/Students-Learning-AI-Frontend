import { LuBrain, LuEye, LuHand, LuLeaf, LuMove, LuMusic, LuSparkles, LuTarget, LuWind, LuZap } from 'react-icons/lu';

/** A balloon outline (the icon set has none): the balloon, its knot and a curly string. */
export function BalloonIcon({ size = 20, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 2.5c-3.6 0-6.2 2.7-6.2 6.1 0 3.7 2.9 7 6.2 7s6.2-3.3 6.2-7c0-3.4-2.6-6.1-6.2-6.1Z" />
      <path d="m11 15.6-.8 1.6h3.6l-.8-1.6" />
      <path d="M12 17.2c-1.3 1.2 1.3 2.3 0 3.4-.6.5-.3 1.1 0 1.4" />
    </svg>
  );
}

const ICONS = {
  eye: LuEye,
  balloon: BalloonIcon,
  brain: LuBrain,
  wind: LuWind,
  stretch: LuMove,
  hand: LuHand,
  // The kinds of exercise (focus/exerciseGroups.js).
  leaf: LuLeaf,
  zap: LuZap,
  music: LuMusic,
  target: LuTarget,
  sparkles: LuSparkles,
};

/** The picture for a Brain Booster (boosters.js `icon`) or a kind of exercise. Decorative. */
export function BoosterIcon({ name, size = 20, className }) {
  const Icon = ICONS[name] ?? LuBrain;
  return <Icon size={size} className={className} aria-hidden="true" />;
}

export default BoosterIcon;
