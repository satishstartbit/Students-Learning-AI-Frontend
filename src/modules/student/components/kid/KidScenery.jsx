import { useId } from 'react';
import { cn } from '../../../../lib/utils';

/**
 * Hand-built SVG scenery for the K-5 theme - the cut-paper landscape, sun,
 * signposts and doodles from the mockup. All decorative (aria-hidden), with
 * no raster assets to fetch. Ids are prefixed with useId so two copies on
 * one page can't collide.
 */

/** A deterministic torn-paper edge along y, as a closed path filled below the tear. */
function tornEdge(width, y, height, step = 22) {
  const points = [];
  for (let x = 0, i = 0; x <= width + step; x += step, i += 1) {
    // Pseudo-random but stable: the same tear on every render.
    const jitter = ((i * 37) % 9) - 4;
    points.push(`${x} ${y + jitter}`);
  }
  return `M0 ${height} L${points.join(' L')} L${width + step} ${height} Z`;
}

/** Soft ambient shadow under each paper layer. */
function PaperShadow({ id, dy = -2, blur = 3, opacity = 0.2 }) {
  return (
    <filter id={id} x="-5%" y="-20%" width="110%" height="140%">
      <feDropShadow dx="0" dy={dy} stdDeviation={blur} floodColor="#4a3a20" floodOpacity={opacity} />
    </filter>
  );
}

function Grain({ id }) {
  return (
    <filter id={id}>
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
      <feColorMatrix values="0 0 0 0 .36  0 0 0 0 .3  0 0 0 0 .2  0 0 0 .09 0" />
    </filter>
  );
}

function Cloud({ x, y, scale = 1, shadow }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} filter={`url(#${shadow})`} fill="#fdfdf8">
      <circle cx="0" cy="0" r="26" />
      <circle cx="38" cy="-14" r="36" />
      <circle cx="80" cy="-2" r="26" />
      <rect x="-22" y="-4" width="126" height="30" rx="15" />
    </g>
  );
}

/** The hero backdrop: sky, clouds, layered hills, a big tree and pines, torn into the page. */
export function Landscape({ className }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const sky = `${uid}-sky`;
  const shadow = `${uid}-shadow`;
  const grain = `${uid}-grain`;

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 1440 360"
      preserveAspectRatio="xMidYMax slice"
      className={className}
    >
      <defs>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#cde1f1" />
          <stop offset="0.7" stopColor="#e5eee3" />
        </linearGradient>
        <PaperShadow id={shadow} />
        <Grain id={grain} />
      </defs>

      <rect width="1440" height="360" fill={`url(#${sky})`} />

      <Cloud x={330} y={62} scale={0.9} shadow={shadow} />
      <Cloud x={1250} y={48} scale={0.75} shadow={shadow} />
      <Cloud x={690} y={30} scale={0.55} shadow={shadow} />

      {/* far hills */}
      <path
        d="M0 250 C180 186 330 200 490 236 S820 176 1010 214 S1300 168 1440 204 V360 H0Z"
        fill="#c9ddb1"
        filter={`url(#${shadow})`}
      />

      {/* the big tree, behind the signpost */}
      <g filter={`url(#${shadow})`}>
        <path d="M934 300 C938 240 930 190 918 140 L942 138 C952 190 958 240 960 300Z" fill="#8a6446" />
        <path d="M930 196 C905 180 890 170 872 150" stroke="#8a6446" strokeWidth="9" strokeLinecap="round" fill="none" />
        <g fill="#86b768">
          <circle cx="870" cy="112" r="62" />
          <circle cx="945" cy="78" r="78" />
          <circle cx="1020" cy="120" r="58" />
          <circle cx="905" cy="160" r="48" />
          <circle cx="985" cy="165" r="52" />
        </g>
        <g fill="#9ccb7c">
          <circle cx="925" cy="66" r="34" />
          <circle cx="1005" cy="104" r="24" />
          <circle cx="866" cy="102" r="22" />
        </g>
      </g>

      {/* mid hills */}
      <path
        d="M0 288 C210 232 380 250 560 272 S900 222 1110 262 S1340 236 1440 252 V360 H0Z"
        fill="#abcb8c"
        filter={`url(#${shadow})`}
      />

      {/* pines on the right */}
      <g filter={`url(#${shadow})`}>
        <path d="M1288 300 L1318 196 L1348 300Z" fill="#5f9a5a" />
        <path d="M1338 306 L1374 170 L1410 306Z" fill="#4e8a4b" />
        <path d="M1398 304 L1424 214 L1450 304Z" fill="#5f9a5a" />
      </g>

      {/* near hills */}
      <path
        d="M0 318 C200 282 360 300 520 312 S860 280 1060 300 S1320 286 1440 296 V360 H0Z"
        fill="#95c07b"
        filter={`url(#${shadow})`}
      />

      {/* tall leaves, bottom left */}
      <g filter={`url(#${shadow})`}>
        <path d="M40 360 C30 300 50 250 92 222 C88 272 76 318 64 360Z" fill="#6fae5c" />
        <path d="M84 360 C96 300 126 262 176 248 C156 292 128 330 112 360Z" fill="#5d9c4c" />
        <path d="M0 360 C0 318 10 286 34 262 C38 300 30 334 22 360Z" fill="#7dbb66" />
      </g>

      <rect width="1440" height="360" filter={`url(#${grain})`} />

      {/* the torn edge where the scene meets the page */}
      <path d={tornEdge(1440, 342, 360)} style={{ fill: 'var(--kid-paper)' }} filter={`url(#${shadow})`} />
    </svg>
  );
}

const FOOTER_SKYLINE = 'M0 70 C220 30 420 60 640 58 S1060 20 1440 56 V200 H0Z';

/** The strip of countryside at the foot of the home page. */
export function FooterScene({ className }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const shadow = `${uid}-shadow`;
  const grain = `${uid}-grain`;
  const land = `${uid}-land`;

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 1440 200"
      preserveAspectRatio="xMidYMin slice"
      className={className}
    >
      <defs>
        <PaperShadow id={shadow} dy={-2} blur={3} opacity={0.18} />
        <Grain id={grain} />
        <clipPath id={land}>
          <path d={FOOTER_SKYLINE} />
        </clipPath>
      </defs>

      <path d={FOOTER_SKYLINE} fill="#b8d49b" filter={`url(#${shadow})`} />
      <g filter={`url(#${shadow})`}>
        <path d="M1180 104 L1206 30 L1232 104Z" fill="#5f9a5a" />
        <path d="M1222 108 L1252 14 L1282 108Z" fill="#4e8a4b" />
      </g>
      <path d="M0 110 C240 76 480 96 700 100 S1120 70 1440 96 V200 H0Z" fill="#9fc783" filter={`url(#${shadow})`} />

      {/* pond */}
      <ellipse cx="560" cy="142" rx="190" ry="30" fill="#a8d2dc" />
      <path d="M470 140 h70 M600 150 h60 M520 156 h40" stroke="#d7eef2" strokeWidth="4" strokeLinecap="round" />

      {/* rocks */}
      <g filter={`url(#${shadow})`}>
        <path d="M770 170 C770 130 800 112 836 114 C870 116 890 138 888 170Z" fill="#b6b0a4" />
        <path d="M860 172 C862 150 878 140 898 142 C916 144 926 158 924 172Z" fill="#c9c3b8" />
      </g>

      <path d="M0 150 C260 124 520 150 760 156 S1180 130 1440 150 V200 H0Z" fill="#86b86a" filter={`url(#${shadow})`} />

      {/* leaves */}
      <g filter={`url(#${shadow})`}>
        <path d="M60 200 C56 160 74 128 110 112 C106 150 96 178 84 200Z" fill="#5d9c4c" />
        <path d="M110 200 C124 164 150 142 190 136 C170 166 148 186 134 200Z" fill="#6fae5c" />
        <path d="M1320 200 C1316 166 1334 140 1364 128 C1362 160 1352 182 1342 200Z" fill="#5d9c4c" />
        <circle cx="330" cy="168" r="10" fill="#e98b8b" />
        <circle cx="352" cy="176" r="8" fill="#f6c445" />
      </g>

      {/* Grain clipped to the land - over the transparent sky it would tint the page into a visible band. */}
      <rect width="1440" height="200" clipPath={`url(#${land})`} filter={`url(#${grain})`} />
    </svg>
  );
}

export function Sun({ className }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 100 100" className={className}>
      <g stroke="#f0a52e" strokeWidth="6" strokeLinecap="round">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
          <line
            key={angle}
            x1="50"
            y1={i % 2 ? 16 : 12}
            x2="50"
            y2={i % 2 ? 24 : 22}
            transform={`rotate(${angle} 50 50)`}
          />
        ))}
      </g>
      <circle cx="50" cy="50" r="21" fill="#f6c445" />
      <circle cx="44" cy="44" r="7" fill="#fbdc7a" />
    </svg>
  );
}

/** A little wooden signpost. The words are real text, so they wrap and can be translated. */
export function WoodenSign({ className, boardClassName, children }) {
  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div
        className={cn(
          'relative rounded-lg border-2 border-[#c29a62] bg-[#e8c68c] px-5 py-3 text-center font-kid-hand leading-snug text-[#4a3425] shadow-paper',
          boardClassName
        )}
        style={{
          backgroundImage: 'repeating-linear-gradient(176deg, rgb(150 105 55 / 0.1) 0 2px, transparent 2px 12px)',
        }}
      >
        <span aria-hidden="true" className="absolute left-2 top-2 size-1.5 rounded-full bg-[#8a6440]" />
        <span aria-hidden="true" className="absolute right-2 top-2 size-1.5 rounded-full bg-[#8a6440]" />
        {children}
      </div>
      <span aria-hidden="true" className="-mt-0.5 h-14 w-3.5 rounded-b-sm bg-[#a57a4d] shadow-paper" />
    </div>
  );
}

/** Two quick crayon strokes - the "movement" doodle beside the next task. */
export function Doodle({ className }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 64 64" className={className}>
      <g stroke="#a592e6" strokeWidth="6" strokeLinecap="round">
        <path d="M24 6 L14 28" />
        <path d="M34 40 L56 28" />
      </g>
    </svg>
  );
}

export function Sprout({ className }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 60 72" className={className}>
      <path d="M30 70 C30 54 30 42 31 30" stroke="#4f8a3c" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M31 38 C18 38 8 30 5 17 C20 15 30 24 31 38Z" fill="#7cb65f" />
      <path d="M31 31 C36 17 47 8 58 10 C56 25 46 33 31 31Z" fill="#5e9e48" />
    </svg>
  );
}

export function Heart({ className }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" className={className}>
      <path
        d="M12 21s-7.5-4.6-9.6-9.2C.9 8.3 3.1 4.5 6.8 4.5c2.2 0 3.7 1.2 5.2 3 1.5-1.8 3-3 5.2-3 3.7 0 5.9 3.8 4.4 7.3C19.5 16.4 12 21 12 21z"
        fill="#e05a67"
      />
    </svg>
  );
}
