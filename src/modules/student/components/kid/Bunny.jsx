import { motion } from 'motion/react';

const FUR = '#f3e1c8';
const FUR_SHADE = '#e6cba8';
const INNER_EAR = '#f7b6bf';
const INK = '#3a2616';

/**
 * The happy bunny from the K-5 Rewards mockup, sitting on a rock.
 *
 * Wiggles its ears once when the page opens and does a small hop - never on
 * a loop, so it can't pull attention from the stickers. <MotionConfig> in
 * KidLayout turns it off in calm mode or when the OS asks for reduced motion.
 */
export function Bunny({ className }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 220 230" className={className}>
      <defs>
        <filter id="kid-bunny-lift" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#4a3a20" floodOpacity="0.2" />
        </filter>
      </defs>

      {/* rock */}
      <path d="M36 214 C40 186 76 176 112 178 C152 180 186 188 190 214 Z" fill="#a9b3ad" />
      <path d="M52 204 C70 194 94 192 118 194" stroke="#c3cbc6" strokeWidth="6" strokeLinecap="round" fill="none" />

      <motion.g
        filter="url(#kid-bunny-lift)"
        initial={{ y: 0 }}
        animate={{ y: [0, -10, 0, -4, 0] }}
        transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }}
      >
        {/* body */}
        <ellipse cx="112" cy="160" rx="54" ry="40" fill={FUR} />
        <ellipse cx="112" cy="168" rx="30" ry="24" fill="#fbf1e2" />
        <ellipse cx="76" cy="190" rx="18" ry="10" fill={FUR_SHADE} />
        <ellipse cx="148" cy="190" rx="18" ry="10" fill={FUR_SHADE} />

        {/* ears - each pivots at its base */}
        <motion.g
          style={{ originX: 0.5, originY: 1 }}
          animate={{ rotate: [0, -12, 4, -8, 0] }}
          transition={{ duration: 1.4, delay: 0.9, ease: 'easeInOut' }}
        >
          <path d="M84 72 C66 40 70 8 84 6 C100 4 104 40 98 72 Z" fill={FUR} />
          <path d="M86 66 C76 42 78 20 85 18 C93 18 95 42 92 66 Z" fill={INNER_EAR} />
        </motion.g>
        <motion.g
          style={{ originX: 0.5, originY: 1 }}
          animate={{ rotate: [0, 12, -4, 8, 0] }}
          transition={{ duration: 1.4, delay: 1, ease: 'easeInOut' }}
        >
          <path d="M126 72 C120 40 128 4 144 8 C160 12 150 44 136 74 Z" fill={FUR} />
          <path d="M128 66 C126 44 134 22 142 22 C150 24 144 46 134 68 Z" fill={INNER_EAR} />
        </motion.g>

        {/* head */}
        <ellipse cx="112" cy="100" rx="52" ry="44" fill={FUR} />
        <path d="M88 118 q24 14 48 0" fill="#fbf1e2" />

        {/* face */}
        <path d="M84 94 q8 -9 16 0" stroke={INK} strokeWidth="4.5" strokeLinecap="round" fill="none" />
        <path d="M124 94 q8 -9 16 0" stroke={INK} strokeWidth="4.5" strokeLinecap="round" fill="none" />
        <circle cx="76" cy="112" r="9" fill="#f59aa5" opacity="0.6" />
        <circle cx="148" cy="112" r="9" fill="#f59aa5" opacity="0.6" />
        <ellipse cx="112" cy="106" rx="6" ry="4.5" fill="#e98a96" />
        <path d="M100 114 Q112 134 124 114 Q112 120 100 114 Z" fill="#7a2f2a" />
        <path d="M106 122 Q112 128 118 122 Q112 119 106 122 Z" fill="#ef8b8b" />

        {/* paws */}
        <ellipse cx="92" cy="146" rx="11" ry="8" fill={FUR_SHADE} />
        <ellipse cx="132" cy="146" rx="11" ry="8" fill={FUR_SHADE} />
      </motion.g>
    </svg>
  );
}

export default Bunny;
