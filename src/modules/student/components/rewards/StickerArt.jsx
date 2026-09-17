import { useId } from 'react';

/**
 * Built-in drawn stickers for the Rewards page - the 12 collectibles from the
 * mockups (Star, Trophy, Heart, Flame, Bookworm, Sparkle, Comet, Night Owl,
 * Music Note, Sunrise, Explorer, Champion). A reward uses one with
 * image_url "sticker:<slug>" (seeded by backend migration 088; picked from a
 * list on the admin Student Rewards form).
 *
 * Each is a flat-but-soft vector: a white die-cut outline (like a real
 * sticker), a light top highlight and a small friendly face. Pure SVG, no
 * raster assets. Decorative - the reward's name is always printed beside it.
 * Motion lives in RewardArt.jsx, not here, so a static render (e.g. the admin
 * preview) stays static.
 */

/** Two eyes with a shine, rosy cheeks and a smile, centred on (cx, cy). */
function Face({ cx, cy, scale = 1, sleepy = false }) {
  const s = scale;
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      {sleepy ? (
        <>
          <path d="M-9 -2 q3 3 6 0" stroke="#3b2a20" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M3 -2 q3 3 6 0" stroke="#3b2a20" strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx="-6" cy="-2" rx="2.6" ry="3.2" fill="#3b2a20" />
          <ellipse cx="6" cy="-2" rx="2.6" ry="3.2" fill="#3b2a20" />
          <circle cx="-5.2" cy="-3.3" r="0.95" fill="#fff" />
          <circle cx="6.8" cy="-3.3" r="0.95" fill="#fff" />
        </>
      )}
      <ellipse cx="-11" cy="3.5" rx="3.2" ry="2" fill="#ff8fa3" opacity="0.55" />
      <ellipse cx="11" cy="3.5" rx="3.2" ry="2" fill="#ff8fa3" opacity="0.55" />
      <path d="M-3.2 3 q3.2 3.4 6.4 0" stroke="#3b2a20" strokeWidth="1.9" fill="none" strokeLinecap="round" />
    </g>
  );
}

const STAR_PATH = (cx, cy, r, inner = 0.48) => {
  const pts = [];
  for (let i = 0; i < 10; i += 1) {
    const rad = ((-90 + i * 36) * Math.PI) / 180;
    const len = i % 2 === 0 ? r : r * inner;
    pts.push(`${(cx + len * Math.cos(rad)).toFixed(2)},${(cy + len * Math.sin(rad)).toFixed(2)}`);
  }
  return `M${pts.join('L')}Z`;
};

/** Rounded star path (stroke-linejoin round on a thick stroke does the rounding). */
function Star({ cx, cy, r, fill, edge, id, face = true, faceScale = 1 }) {
  const d = STAR_PATH(cx, cy, r);
  return (
    <g>
      <path d={d} fill={fill} stroke={edge} strokeWidth={r * 0.16} strokeLinejoin="round" />
      <path d={d} fill={`url(#${id}-shine)`} stroke="none" />
      {face && <Face cx={cx} cy={cy + r * 0.12} scale={faceScale} />}
    </g>
  );
}

const ART = {
  star: ({ id }) => <Star id={id} cx={48} cy={50} r={36} fill="#ffcb2f" edge="#ffcb2f" />,

  trophy: ({ id }) => (
    <g>
      <path d="M26 26 q-14 0 -12 14 q2 12 18 14" fill="none" stroke="#f0a922" strokeWidth="6" strokeLinecap="round" />
      <path d="M70 26 q14 0 12 14 q-2 12 -18 14" fill="none" stroke="#f0a922" strokeWidth="6" strokeLinecap="round" />
      <path d="M24 18 h48 v18 q0 26 -24 28 q-24 -2 -24 -28z" fill="#ffc83d" />
      <path d="M24 18 h48 v18 q0 26 -24 28 q-24 -2 -24 -28z" fill={`url(#${id}-shine)`} />
      <rect x="42" y="62" width="12" height="12" rx="2" fill="#f0a922" />
      <rect x="30" y="72" width="36" height="12" rx="4" fill="#e39a17" />
      <Face cx={48} cy={38} scale={0.9} />
    </g>
  ),

  heart: ({ id }) => (
    <g>
      <path d="M48 84 C14 62 8 42 18 28 C28 14 44 18 48 30 C52 18 68 14 78 28 C88 42 82 62 48 84Z" fill="#ff5a73" />
      <path d="M48 84 C14 62 8 42 18 28 C28 14 44 18 48 30 C52 18 68 14 78 28 C88 42 82 62 48 84Z" fill={`url(#${id}-shine)`} />
      <ellipse cx="30" cy="32" rx="6" ry="4" fill="#fff" opacity="0.45" transform="rotate(-30 30 32)" />
      <Face cx={48} cy={50} />
    </g>
  ),

  flame: ({ id }) => (
    <g>
      <path d="M48 12 C58 30 76 36 76 58 C76 76 63 86 48 86 C33 86 20 76 20 58 C20 44 30 38 32 26 C38 34 40 40 44 42 C44 30 44 22 48 12Z" fill="#ff7a1a" />
      <path d="M48 36 C54 46 66 50 66 64 C66 76 58 82 48 82 C38 82 30 76 30 64 C30 54 38 50 40 42 C43 48 46 48 48 36Z" fill="#ffc03a" />
      <path d="M48 12 C58 30 76 36 76 58 C76 76 63 86 48 86 C33 86 20 76 20 58 C20 44 30 38 32 26 C38 34 40 40 44 42 C44 30 44 22 48 12Z" fill={`url(#${id}-shine)`} />
      <Face cx={48} cy={64} />
    </g>
  ),

  bookworm: ({ id }) => (
    <g>
      <path d="M12 58 L48 66 L84 58 L84 84 L48 90 L12 84Z" fill="#e0483e" />
      <path d="M16 56 L48 62 L48 86 L16 80Z" fill="#fff6e8" />
      <path d="M80 56 L48 62 L48 86 L80 80Z" fill="#fbe9d0" />
      <path d="M22 64 L42 68 M22 70 L42 74 M54 68 L74 64 M54 74 L74 70" stroke="#d9c2a3" strokeWidth="1.6" />
      <circle cx="30" cy="48" r="11" fill="#7ccf5a" />
      <circle cx="44" cy="42" r="12" fill="#86d864" />
      <circle cx="58" cy="36" r="17" fill="#8fe06c" />
      <circle cx="58" cy="36" r="17" fill={`url(#${id}-shine)`} />
      <Face cx={58} cy={38} scale={0.85} />
      <g fill="none" stroke="#6b4a2b" strokeWidth="2">
        <circle cx="52.5" cy="35.5" r="5" />
        <circle cx="63.5" cy="35.5" r="5" />
        <path d="M57.5 35.5 h1" />
      </g>
      <path d="M52 20 q-4 -8 -8 -8 M64 20 q4 -8 8 -8" stroke="#6fbf4d" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </g>
  ),

  sparkle: ({ id }) => (
    <g>
      <Star id={id} cx={46} cy={54} r={32} fill="#ffcb2f" edge="#ffcb2f" faceScale={0.9} />
      <path d="M78 14 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 l8 -3z" fill="#ffd95e" />
      <path d="M16 18 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2z" fill="#ffd95e" />
      <path d="M84 70 l2 4 l4 2 l-4 2 l-2 4 l-2 -4 l-4 -2 l4 -2z" fill="#ffe28a" />
    </g>
  ),

  comet: ({ id }) => (
    <g>
      <path d="M10 22 C30 34 44 46 56 60" stroke="#b9a7ff" strokeWidth="14" strokeLinecap="round" opacity="0.55" />
      <path d="M14 34 C32 42 44 52 54 64" stroke="#8fd3ff" strokeWidth="10" strokeLinecap="round" opacity="0.6" />
      <path d="M22 16 C38 28 50 42 60 56" stroke="#ffd1ea" strokeWidth="8" strokeLinecap="round" opacity="0.7" />
      <Star id={id} cx={64} cy={64} r={22} fill="#ffcb2f" edge="#ffcb2f" faceScale={0.62} />
    </g>
  ),

  'night-owl': ({ id }) => (
    <g>
      <path d="M22 30 L28 14 L38 26 M74 30 L68 14 L58 26" fill="#8a6a4f" />
      <ellipse cx="48" cy="54" rx="30" ry="34" fill="#9b7a5c" />
      <ellipse cx="48" cy="54" rx="30" ry="34" fill={`url(#${id}-shine)`} />
      <ellipse cx="48" cy="66" rx="17" ry="18" fill="#e8d3b8" />
      <path d="M40 60 q3 3 6 0 M50 64 q3 3 6 0 M42 70 q3 3 6 0" stroke="#c9ad8b" strokeWidth="1.5" fill="none" />
      <circle cx="37" cy="44" r="11" fill="#fff" />
      <circle cx="59" cy="44" r="11" fill="#fff" />
      <circle cx="38" cy="45" r="5.5" fill="#3b2a20" />
      <circle cx="58" cy="45" r="5.5" fill="#3b2a20" />
      <circle cx="39.6" cy="43" r="1.7" fill="#fff" />
      <circle cx="59.6" cy="43" r="1.7" fill="#fff" />
      <path d="M44 52 L48 58 L52 52Z" fill="#f2a43a" />
      <ellipse cx="28" cy="56" rx="3" ry="2" fill="#ff8fa3" opacity="0.5" />
      <ellipse cx="68" cy="56" rx="3" ry="2" fill="#ff8fa3" opacity="0.5" />
      <path d="M22 60 q-6 10 2 20 M74 60 q6 10 -2 20" stroke="#7d5f45" strokeWidth="5" fill="none" strokeLinecap="round" />
    </g>
  ),

  'music-note': ({ id }) => (
    <g>
      <path d="M36 22 L76 12 L76 64" stroke="#f5c542" strokeWidth="8" fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M36 22 L36 74" stroke="#f5c542" strokeWidth="8" strokeLinecap="round" />
      <path d="M36 22 L76 12 L76 24 L36 34Z" fill="#f5c542" />
      <ellipse cx="26" cy="76" rx="15" ry="12" fill="#ffd45c" />
      <ellipse cx="66" cy="66" rx="15" ry="12" fill="#ffd45c" />
      <ellipse cx="26" cy="76" rx="15" ry="12" fill={`url(#${id}-shine)`} />
      <ellipse cx="66" cy="66" rx="15" ry="12" fill={`url(#${id}-shine)`} />
      <Face cx={26} cy={77} scale={0.62} />
      <Face cx={66} cy={67} scale={0.62} />
    </g>
  ),

  sunrise: ({ id }) => (
    <g>
      <g stroke="#ffc83d" strokeWidth="4" strokeLinecap="round">
        <path d="M48 8 v8 M20 20 l6 6 M76 20 l-6 6 M8 46 h8 M80 46 h8" />
      </g>
      <circle cx="48" cy="52" r="26" fill="#ffd24a" />
      <circle cx="48" cy="52" r="26" fill={`url(#${id}-shine)`} />
      <Face cx={48} cy={48} />
      <path d="M6 70 C24 58 40 60 52 66 C64 72 78 64 90 66 L90 86 L6 86Z" fill="#8fd16c" />
      <path d="M6 78 C26 70 50 74 90 72 L90 88 L6 88Z" fill="#74bf55" />
    </g>
  ),

  explorer: ({ id }) => (
    <g>
      <circle cx="48" cy="56" r="30" fill="#f2b33d" />
      <circle cx="48" cy="56" r="24" fill="#fff4dc" />
      <circle cx="48" cy="56" r="24" fill={`url(#${id}-shine)`} />
      <path d="M48 36 L53 56 L48 52 L43 56Z" fill="#e24c3f" />
      <path d="M48 76 L43 56 L48 60 L53 56Z" fill="#8a9bb0" />
      <Face cx={48} cy={60} scale={0.72} />
      <path d="M18 30 q30 -22 60 0 q-30 -6 -60 0z" fill="#b78a4f" />
      <path d="M26 30 q22 -26 44 0z" fill="#c99a5b" />
      <path d="M26 28 h44" stroke="#7a5a33" strokeWidth="3" />
      <path d="M70 70 q12 6 10 16" stroke="#6fbf4d" strokeWidth="4" fill="none" strokeLinecap="round" />
      <ellipse cx="82" cy="80" rx="6" ry="4" fill="#86d864" transform="rotate(-30 82 80)" />
    </g>
  ),

  champion: ({ id }) => (
    <g>
      <path d="M34 60 L22 90 L34 84 L40 94 L48 66Z" fill="#ff7a8a" />
      <path d="M62 60 L74 90 L62 84 L56 94 L48 66Z" fill="#f55c70" />
      <circle cx="48" cy="46" r="28" fill="#ffc83d" />
      <circle cx="48" cy="46" r="21" fill="#ffd96a" stroke="#f0a922" strokeWidth="2.5" />
      <circle cx="48" cy="46" r="28" fill={`url(#${id}-shine)`} />
      <path d="M32 18 L38 26 L48 14 L58 26 L64 18 L62 32 L34 32Z" fill="#ffb21f" stroke="#f0a922" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="48" cy="14" r="2.6" fill="#ff5a73" />
      <Face cx={48} cy={48} scale={0.9} />
      <path d="M28 60 q-6 -6 -4 -14 M68 60 q6 -6 4 -14" stroke="#7ccf5a" strokeWidth="3" fill="none" strokeLinecap="round" />
    </g>
  ),
};

export function StickerArt({ slug, className, style }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  // Unknown slug (e.g. an art piece removed later) falls back to the star rather than rendering nothing.
  // Called as a plain function - the entries are hook-free drawing helpers, not components with state.
  const drawArt = ART[slug] ?? ART.star;

  return (
    <svg viewBox="0 0 96 96" className={className} style={style} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="0.45" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.08" />
        </linearGradient>
        {/* Die-cut white border + soft drop shadow, like a real sticker. */}
        <filter id={`${id}-cut`} x="-20%" y="-20%" width="140%" height="140%">
          <feMorphology in="SourceAlpha" operator="dilate" radius="3" result="grown" />
          <feFlood floodColor="#ffffff" />
          <feComposite in2="grown" operator="in" result="outline" />
          <feDropShadow in="outline" dx="0" dy="2" stdDeviation="2" floodColor="#5b4631" floodOpacity="0.22" result="shadowed" />
          <feMerge>
            <feMergeNode in="shadowed" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter={`url(#${id}-cut)`}>
        {drawArt({ id })}
      </g>
    </svg>
  );
}

export default StickerArt;
