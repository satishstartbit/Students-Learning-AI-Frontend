import { cn } from '../../../../lib/utils';
import './home/kidHome.css';

/**
 * Moving overlays for a K-5 page banner picture (KidBannerHero). Each is
 * placed with Tailwind position classes in % of the picture, so it stays on
 * the sun, the paw or the tree at every size. All decorative; every motion
 * stops in calm mode and follows reduced motion (kidHome.css).
 */

/** Warm light breathing around a painted sun. `className` places and sizes it (left/top = the sun's centre). */
export function SunGlow({ className }) {
  return <span className={cn('kh-sunglow absolute aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full', className)} />;
}

/** A four-point sparkle that twinkles. */
export function Sparkle({ className, delay = 0 }) {
  return (
    <span className={cn('kh-twinkle absolute block', className)} style={{ '--kh-delay': `${delay}s` }}>
      <svg viewBox="0 0 20 20" className="block w-full">
        <path d="M10 0 C11 7 13 9 20 10 C13 11 11 13 10 20 C9 13 7 11 0 10 C7 9 9 7 10 0Z" fill="#ffffff" opacity="0.95" />
      </svg>
    </span>
  );
}

/** A small paper cloud wandering sideways (`travel` = how far, in its own widths). */
export function DriftingCloud({ className, travel = '240%', time = '34s', delay = 0 }) {
  return (
    <span
      className={cn('kh-cloud absolute block', className)}
      style={{ '--kh-cloud-travel': travel, '--kh-cloud-time': time, '--kh-delay': `${delay}s` }}
    >
      <svg viewBox="0 0 140 64" className="block w-full drop-shadow-[0_3px_3px_rgb(70_110_140/0.18)]">
        <g fill="#fbfaf6">
          <circle cx="38" cy="38" r="22" />
          <circle cx="70" cy="28" r="26" />
          <circle cx="102" cy="38" r="20" />
          <rect x="18" y="38" width="104" height="22" rx="11" />
        </g>
      </svg>
    </span>
  );
}

/** A bird crossing the whole picture now and then (`top` class places its height in the sky). */
export function FlyingBird({ className, size = 'w-[2.2%]', time = '20s', delay = 0 }) {
  return (
    <span className={cn('kh-fly absolute inset-x-0 block', className)} style={{ '--kh-fly-time': time, '--kh-delay': `${delay}s` }}>
      <svg viewBox="0 0 40 20" className={cn('kh-flap block', size)}>
        <path d="M2 6 Q11 0 20 11 Q29 0 38 6" fill="none" stroke="#3a5873" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

/** A leaf letting go of a tree and spinning down. */
export function FallingLeaf({ className, delay = 0, dx = '-28px', dy = '110px', time = '7s', tone = '#5e9e48' }) {
  return (
    <span
      className={cn('kh-leaf absolute block', className)}
      style={{ '--kh-delay': `${delay}s`, '--kh-leaf-x': dx, '--kh-leaf-y': dy, '--kh-leaf-time': time }}
    >
      <svg viewBox="0 0 20 30" className="block w-full">
        <path d="M10 1 C19 9 19 21 10 29 C1 21 1 9 10 1Z" fill={tone} />
        <path d="M10 4 L10 27" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1.4" />
      </svg>
    </span>
  );
}

/** Two "(" marks flicking beside a waving paw. `className` places the pair (give it a height in %). */
export function WaveMarks({ className, ink = '#7a4a26' }) {
  return (
    <span className={cn('absolute flex items-center gap-[30%]', className)}>
      {[0, 0.3].map((delay, i) => (
        <span key={delay} className={cn('kh-wave-mark block aspect-[1/3]', i ? 'h-full' : 'h-[70%]')} style={{ '--kh-delay': `${delay}s` }}>
          <svg viewBox="0 0 10 30" className="block size-full">
            <path d="M8 2 Q0 15 8 28" fill="none" stroke={ink} strokeWidth="2.6" strokeLinecap="round" />
          </svg>
        </span>
      ))}
    </span>
  );
}

/** Little hearts rising from a happy animal and fading. */
export function RisingHearts({ className }) {
  return (
    <span className={cn('absolute block', className)}>
      {[
        { left: '0%', delay: 0, size: 'w-[42%]' },
        { left: '55%', delay: 1.6, size: 'w-[32%]' },
        { left: '25%', delay: 3.1, size: 'w-[26%]' },
      ].map((h) => (
        <span key={h.delay} className={cn('kh-heart absolute bottom-0 block', h.size)} style={{ left: h.left, '--kh-delay': `${h.delay}s` }}>
          <svg viewBox="0 0 24 22" className="block w-full">
            <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.3 3.1 4.5 6.8 4.5c2.2 0 3.7 1.2 5.2 3 1.5-1.8 3-3 5.2-3 3.7 0 5.9 3.8 4.4 7.3C19.5 16.4 12 21 12 21z" fill="#f2708a" />
          </svg>
        </span>
      ))}
    </span>
  );
}

/** Light on water: a few white wave strokes drifting and glinting. `className` places and sizes the patch of water. */
export function SeaShimmer({ className, waves = 4 }) {
  const rows = Array.from({ length: waves }, (_, i) => ({
    top: `${8 + (i * 84) / Math.max(waves - 1, 1)}%`,
    left: `${(i * 37) % 60}%`,
    width: `${26 + ((i * 13) % 14)}%`,
    delay: i * 0.7,
  }));
  return (
    <span className={cn('pointer-events-none absolute block', className)}>
      {rows.map((r) => (
        <span key={r.delay} className="kh-shimmer absolute block" style={{ top: r.top, left: r.left, width: r.width, '--kh-delay': `${r.delay}s` }}>
          <svg viewBox="0 0 60 8" preserveAspectRatio="none" className="block h-[6px] w-full">
            <path d="M1 5 Q8 1 15 5 T29 5 T43 5 T59 5" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
      ))}
    </span>
  );
}

/** A little sailboat: `motion="rock"` bobs in place, `"drift"` also sails slowly along. */
export function Sailboat({ className, motion = 'rock', delay = 0 }) {
  const boat = (
    <svg viewBox="0 0 40 40" className="kh-rock block w-full" style={{ '--kh-delay': `${delay}s` }}>
      <path d="M20 4 L20 28" stroke="#6b4a2f" strokeWidth="1.6" />
      <path d="M21 6 L33 26 L21 26Z" fill="#fffdf7" stroke="#e8e0d0" strokeWidth="0.8" />
      <path d="M19 10 L10 26 L19 26Z" fill="#f6c445" />
      <path d="M21 4 L27 6 L21 8Z" fill="#e05a67" />
      <path d="M6 28 L34 28 L29 35 L11 35Z" fill="#c8664a" />
    </svg>
  );
  return motion === 'drift' ? (
    <span className={cn('kh-cloud absolute block', className)} style={{ '--kh-cloud-travel': '520%', '--kh-cloud-time': '46s', '--kh-delay': `${delay}s` }}>
      {boat}
    </span>
  ) : (
    <span className={cn('absolute block', className)}>{boat}</span>
  );
}

/** A butterfly flitting about the flowers: a lazy loop (`travel` = how far, in its own widths; negative goes left) with flapping wings. */
export function Butterfly({ className, delay = 0, travel = '160%', time = '9s', wings = ['#f59ab5', '#f6c445'] }) {
  return (
    <span
      className={cn('kh-flutter absolute block', className)}
      style={{ '--kh-delay': `${delay}s`, '--kh-flutter-x': travel, '--kh-flutter-time': time }}
    >
      <svg viewBox="0 0 40 32" className="kh-flit block w-full">
        <path d="M20 15 C14 2 3 2 3 10 C3 17 12 18 20 15Z" fill={wings[0]} />
        <path d="M20 15 C26 2 37 2 37 10 C37 17 28 18 20 15Z" fill={wings[0]} />
        <path d="M20 16 C13 18 7 24 10 28 C13 31 18 25 20 17Z" fill={wings[1]} />
        <path d="M20 16 C27 18 33 24 30 28 C27 31 22 25 20 17Z" fill={wings[1]} />
        <rect x="19" y="9" width="2" height="15" rx="1" fill="#5b4632" />
        <path d="M20 9 C18 5 16 4 15 3 M20 9 C22 5 24 4 25 3" stroke="#5b4632" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </svg>
    </span>
  );
}

/**
 * A transparent-sky scenery picture at the foot of a K-5 page, with moving
 * overlays (`children`, in % of the picture). Rises in when the page opens.
 * `mobileZoom` widens it on a phone so a long, low picture still reads;
 * `overlap` (% of the width) tucks its clear top under the last cards.
 */
export function SceneryFooter({ src, width, height, overlap = 2, children }) {
  return (
    <div aria-hidden="true" className="pointer-events-none relative" style={{ marginTop: `-${overlap}%` }}>
      <div className="kh-rise relative ml-[-40%] w-[180%] sm:ml-[-15%] sm:w-[130%] lg:ml-0 lg:w-full" style={{ aspectRatio: `${width} / ${height}` }}>
        <img src={src} alt="" loading="lazy" decoding="async" draggable="false" className="absolute inset-0 size-full select-none" />
        {children}
      </div>
    </div>
  );
}

/** A speech bubble that pops in and bobs ("Hi!"). */
export function SpeechBubble({ className, delay = 1.2, children }) {
  return (
    <span
      className={cn(
        'kh-pop absolute grid place-items-center rounded-[40%] bg-white px-[0.9%] py-[0.45%] font-kid-display text-[clamp(0.7rem,1.25vw,1.15rem)] font-semibold text-kid-ink shadow-paper',
        className
      )}
      style={{ '--kh-delay': `${delay}s` }}
    >
      <span className="kh-float block" style={{ '--kh-delay': `${delay + 0.6}s` }}>
        {children}
      </span>
      <span className="absolute -bottom-1 left-2.5 size-2.5 rotate-45 rounded-[2px] bg-white" />
    </span>
  );
}
