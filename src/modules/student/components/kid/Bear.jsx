import { motion } from 'motion/react';

const FUR = '#c68a58';
const FUR_DARK = '#b9804f';
const FUR_LIGHT = '#e2b787';
const MUZZLE = '#f0d4ad';
const INK = '#3a2616';

/**
 * The felt bear mascot from the mockup, waving hello.
 *
 * Waves once when the page opens - never on a loop, so it can't pull a
 * student's attention away from their work. <MotionConfig> in KidLayout
 * turns the wave off in calm mode or when the OS asks for reduced motion.
 */
export function Bear({ className }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 240 250" className={className}>
      <defs>
        <filter id="kid-bear-lift" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#4a3a20" floodOpacity="0.22" />
        </filter>
      </defs>

      <g filter="url(#kid-bear-lift)">
        {/* backpack, peeking out past the shoulders */}
        <rect x="40" y="194" width="160" height="70" rx="32" fill="#2a7f7a" />

        {/* body */}
        <path d="M52 252 C52 196 82 172 120 172 C158 172 188 196 188 252 Z" fill={FUR_DARK} />
        <ellipse cx="120" cy="230" rx="34" ry="26" fill={FUR_LIGHT} />
        <path d="M76 196 C86 210 88 230 86 252" stroke="#2f8f8a" strokeWidth="14" strokeLinecap="round" fill="none" />
        <path d="M164 196 C154 210 152 230 154 252" stroke="#2f8f8a" strokeWidth="14" strokeLinecap="round" fill="none" />

        {/* resting arm */}
        <path d="M170 204 C184 214 190 232 188 252" stroke={FUR_DARK} strokeWidth="26" strokeLinecap="round" fill="none" />

        {/* waving arm - pivots at the shoulder */}
        <motion.g
          style={{ originX: 0.8, originY: 0.9 }}
          initial={{ rotate: 0 }}
          animate={{ rotate: [0, -18, 5, -18, 0] }}
          transition={{ duration: 1.8, delay: 0.7, ease: 'easeInOut' }}
        >
          <path d="M76 206 C58 192 46 162 44 134" stroke={FUR_DARK} strokeWidth="28" strokeLinecap="round" fill="none" />
          <circle cx="44" cy="124" r="19" fill={FUR_DARK} />
          <ellipse cx="44" cy="128" rx="8" ry="6" fill={FUR_LIGHT} />
          <circle cx="34" cy="115" r="3.5" fill={FUR_LIGHT} />
          <circle cx="44" cy="111" r="3.5" fill={FUR_LIGHT} />
          <circle cx="54" cy="115" r="3.5" fill={FUR_LIGHT} />
        </motion.g>

        {/* ears */}
        <circle cx="68" cy="58" r="26" fill={FUR_DARK} />
        <circle cx="68" cy="58" r="14" fill={FUR_LIGHT} />
        <circle cx="172" cy="58" r="26" fill={FUR_DARK} />
        <circle cx="172" cy="58" r="14" fill={FUR_LIGHT} />

        {/* head */}
        <ellipse cx="120" cy="108" rx="70" ry="64" fill={FUR} />
        <path d="M110 48 q6 -14 16 -3" stroke="#a86f41" strokeWidth="5" strokeLinecap="round" fill="none" />

        {/* face */}
        <ellipse cx="120" cy="134" rx="34" ry="26" fill={MUZZLE} />
        <path d="M84 100 q9 -11 18 0" stroke={INK} strokeWidth="5.5" strokeLinecap="round" fill="none" />
        <path d="M138 100 q9 -11 18 0" stroke={INK} strokeWidth="5.5" strokeLinecap="round" fill="none" />
        <circle cx="82" cy="128" r="10" fill="#f09a8e" opacity="0.55" />
        <circle cx="158" cy="128" r="10" fill="#f09a8e" opacity="0.55" />
        <path d="M102 134 Q120 160 138 134 Q120 142 102 134 Z" fill="#6b2e20" />
        <path d="M110 146 Q120 155 130 146 Q120 141 110 146 Z" fill="#ee8c8c" />
        <ellipse cx="120" cy="119" rx="12" ry="8.5" fill="#4a2f1f" />
        <ellipse cx="116" cy="116" rx="3.5" ry="2" fill="#ffffff" opacity="0.5" />
      </g>
    </svg>
  );
}

/** Just the bear's face - the default avatar for a student without a photo. */
export function BearFace({ className }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 64 64" className={className}>
      <circle cx="32" cy="32" r="32" fill="#f6e3c8" />
      <circle cx="16" cy="18" r="9" fill={FUR_DARK} />
      <circle cx="16" cy="18" r="4.5" fill={FUR_LIGHT} />
      <circle cx="48" cy="18" r="9" fill={FUR_DARK} />
      <circle cx="48" cy="18" r="4.5" fill={FUR_LIGHT} />
      <ellipse cx="32" cy="36" rx="22" ry="20" fill={FUR} />
      <ellipse cx="32" cy="43" rx="11" ry="8" fill={MUZZLE} />
      <circle cx="24" cy="32" r="2.6" fill={INK} />
      <circle cx="40" cy="32" r="2.6" fill={INK} />
      <ellipse cx="32" cy="39.5" rx="4" ry="2.8" fill="#4a2f1f" />
      <path d="M28 44 q4 3.5 8 0" stroke={INK} strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export default Bear;
