import './exerciseMedia.css';

/**
 * A picture that shows how an exercise is done, for one with no video or
 * image of its own (ExerciseMedia): a dot going round the box for box
 * breathing, a circle that grows and shrinks, the 5-4-3-2-1 senses lighting
 * up in turn, arms crossing to tap the knees, arms reaching up, rain on a
 * puddle, music bars, a quiet sitter. Each has one line under it saying
 * what to do. The motion stops with the OS "reduce motion" setting and the
 * student's own Reduce motion (exerciseMedia.css `fs-ill-*`).
 *
 *   kind     exerciseGroups.js#illustrationFor
 *   tone     the exercise tile's colour
 *   paused   hold the motion (while the exercise it shows is paused / not started)
 *   caption  false where the steps are already written beside it
 */

const CAPTIONS = {
  box: 'Follow the dot: breathe in for 4, hold for 4, breathe out for 4, hold for 4.',
  breath: 'Breathe in as the circle grows, then out slowly as it shrinks.',
  senses: 'Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell and 1 you taste.',
  taps: 'Tap the opposite knee, one hand and then the other, slowly.',
  stretch: 'Reach up high, then let your arms float down. Go at your own pace.',
  rain: 'Put on headphones, close your eyes and listen to the rain.',
  music: 'Play it softly and let the music set a steady pace.',
  mindful: 'Sit still and notice one breath at a time.',
  default: 'Take it slowly. There is no wrong way to do this.',
};

function BoxArt() {
  const phases = ['Breathe in', 'Hold', 'Breathe out', 'Hold'];
  return (
    <>
      <rect x="62" y="42" width="116" height="116" rx="16" className="fs-ill__soft" />
      <rect x="62" y="42" width="116" height="116" rx="16" className="fs-ill__track" />
      <path d="M116 37 l9 5 -9 5z" className="fs-ill__arrow" />
      <path d="M173 96 l5 9 5 -9z" className="fs-ill__arrow" />
      <path d="M124 153 l-9 5 9 5z" className="fs-ill__arrow" />
      <path d="M57 104 l5 -9 5 9z" className="fs-ill__arrow" />
      <text x="120" y="28" textAnchor="middle" className="fs-ill__label">Breathe in · 4</text>
      <text x="120" y="181" textAnchor="middle" className="fs-ill__label">Breathe out · 4</text>
      <text transform="translate(199 100) rotate(90)" textAnchor="middle" className="fs-ill__label">Hold · 4</text>
      <text transform="translate(41 100) rotate(-90)" textAnchor="middle" className="fs-ill__label">Hold · 4</text>
      {phases.map((p, i) => (
        <text key={i} x="120" y="105" textAnchor="middle" className={`fs-ill__phase${i === 0 ? ' fs-ill__phase--first' : ''}`} style={{ '--i': i }}>
          {p}
        </text>
      ))}
      <circle cx="62" cy="42" r="9" className="fs-ill__dot fs-ill__dot--box" />
    </>
  );
}

function BreathArt() {
  return (
    <>
      {/* The words sit under the circle, so they stay readable while it is small. */}
      <circle cx="120" cy="88" r="68" className="fs-ill__soft" />
      <circle cx="120" cy="88" r="54" className="fs-ill__grow" />
      <text x="120" y="188" textAnchor="middle" className="fs-ill__phase fs-ill__phase--first fs-ill__phase--in">
        Breathe in
      </text>
      <text x="120" y="188" textAnchor="middle" className="fs-ill__phase fs-ill__phase--out">
        Breathe out
      </text>
    </>
  );
}

const SENSES = [
  { n: 5, emoji: '👀', text: 'things you see' },
  { n: 4, emoji: '✋', text: 'things you can touch' },
  { n: 3, emoji: '👂', text: 'things you hear' },
  { n: 2, emoji: '👃', text: 'things you smell' },
  { n: 1, emoji: '👅', text: 'thing you taste' },
];

function SensesArt() {
  return (
    <>
      {SENSES.map((s, i) => {
        const y = 28 + i * 35;
        return (
          <g key={s.n}>
            <rect x="22" y={y - 15} width="200" height="30" rx="15" className={`fs-ill__row-hl${i === 0 ? ' fs-ill__row-hl--first' : ''}`} style={{ '--i': i }} />
            <circle cx="42" cy={y} r="12" className="fs-ill__dot" />
            <text x="42" y={y + 4.5} textAnchor="middle" className="fs-ill__num">
              {s.n}
            </text>
            <text x="66" y={y + 6} className="fs-ill__emoji">
              {s.emoji}
            </text>
            <text x="92" y={y + 4.5} className="fs-ill__text">
              {s.text}
            </text>
          </g>
        );
      })}
    </>
  );
}

function TapsArt() {
  return (
    <>
      <rect x="40" y="172" width="160" height="6" rx="3" className="fs-ill__soft" />
      {/* Thighs down to the knees */}
      <path d="M106 116 L96 146 M134 116 L144 146" className="fs-ill__thigh" />
      <circle cx="94" cy="150" r="15" className="fs-ill__paper" />
      <circle cx="146" cy="150" r="15" className="fs-ill__paper" />
      <circle cx="94" cy="150" r="15" className="fs-ill__knee fs-ill__knee--a" />
      <circle cx="146" cy="150" r="15" className="fs-ill__knee fs-ill__knee--b" />
      {/* Body and head */}
      <rect x="94" y="62" width="52" height="62" rx="20" className="fs-ill__body" />
      <circle cx="120" cy="40" r="17" className="fs-ill__paper" />
      <path d="M113 42 q7 6 14 0" className="fs-ill__smile" />
      {/* Each arm crosses to the other knee, in turn. */}
      <g className="fs-ill__arm-tap fs-ill__arm-tap--a">
        <path d="M138 74 C156 104 120 126 100 140" className="fs-ill__limb fs-ill__limb--strong" />
        <circle cx="100" cy="140" r="7" className="fs-ill__dot" />
      </g>
      <g className="fs-ill__arm-tap fs-ill__arm-tap--b">
        <path d="M102 74 C84 104 120 126 140 140" className="fs-ill__limb fs-ill__limb--strong" />
        <circle cx="140" cy="140" r="7" className="fs-ill__dot" />
      </g>
    </>
  );
}

function StretchArt() {
  return (
    <>
      <circle cx="120" cy="100" r="74" className="fs-ill__soft" />
      <rect x="40" y="176" width="160" height="6" rx="3" className="fs-ill__soft" />
      <path d="M120 132 L104 174 M120 132 L136 174" className="fs-ill__limb" />
      <path d="M120 74 L120 134" className="fs-ill__limb fs-ill__limb--body" />
      <g transform="translate(120 86)">
        <g className="fs-ill__reach fs-ill__reach--l">
          <path d="M0 0 L0 -50" className="fs-ill__limb fs-ill__limb--strong" />
        </g>
        <g className="fs-ill__reach fs-ill__reach--r">
          <path d="M0 0 L0 -50" className="fs-ill__limb fs-ill__limb--strong" />
        </g>
      </g>
      <circle cx="120" cy="58" r="15" className="fs-ill__paper" />
      <path d="M114 60 q6 5 12 0" className="fs-ill__smile" />
    </>
  );
}

function RainArt() {
  const drops = [70, 92, 114, 136, 158, 180];
  return (
    <>
      <ellipse cx="120" cy="166" rx="76" ry="14" className="fs-ill__soft" />
      <ellipse cx="96" cy="166" rx="22" ry="5" className="fs-ill__ripple" />
      <ellipse cx="150" cy="168" rx="18" ry="4" className="fs-ill__ripple fs-ill__ripple--late" />
      {drops.map((x, i) => (
        <path key={x} d={`M${x - 4} 86 l-4 12`} className="fs-ill__drop" style={{ '--i': i }} />
      ))}
      {/* The cloud twice: a thick edge underneath, the white on top - one outline round the whole cloud. */}
      {['fs-ill__cloud-edge', 'fs-ill__cloud'].map((cls) => (
        <g key={cls} className={cls}>
          <circle cx="94" cy="62" r="22" />
          <circle cx="124" cy="50" r="28" />
          <circle cx="154" cy="64" r="20" />
          <rect x="74" y="60" width="98" height="24" rx="12" />
        </g>
      ))}
    </>
  );
}

function MusicArt() {
  const bars = [40, 64, 52, 74, 46, 60, 36];
  return (
    <>
      <path d="M70 84 C70 40 170 40 170 84" className="fs-ill__band" />
      <rect x="58" y="78" width="26" height="40" rx="10" className="fs-ill__cup" />
      <rect x="156" y="78" width="26" height="40" rx="10" className="fs-ill__cup" />
      {bars.map((h, i) => (
        <rect key={i} x={84 + i * 11} y={176 - h} width="7" height={h} rx="3.5" className="fs-ill__bar" style={{ '--i': i }} />
      ))}
      <text x="36" y="60" className="fs-ill__note" style={{ '--i': 0 }}>
        ♪
      </text>
      <text x="196" y="52" className="fs-ill__note" style={{ '--i': 1 }}>
        ♫
      </text>
      <text x="200" y="120" className="fs-ill__note" style={{ '--i': 2 }}>
        ♪
      </text>
    </>
  );
}

function MindfulArt() {
  return (
    <>
      <circle cx="120" cy="104" r="76" className="fs-ill__halo" />
      <ellipse cx="120" cy="156" rx="52" ry="14" className="fs-ill__body" />
      <path d="M94 96 Q120 86 146 96 L156 146 Q120 158 84 146 Z" className="fs-ill__body" />
      <circle cx="96" cy="148" r="6" className="fs-ill__paper" />
      <circle cx="144" cy="148" r="6" className="fs-ill__paper" />
      <circle cx="120" cy="70" r="17" className="fs-ill__paper" />
      <path d="M112 70 q3 2 6 0 M122 70 q3 2 6 0" className="fs-ill__smile" />
      <path d="M114 77 q6 4 12 0" className="fs-ill__smile" />
    </>
  );
}

function DefaultArt() {
  return (
    <>
      <circle cx="120" cy="100" r="74" className="fs-ill__halo" />
      <circle cx="120" cy="100" r="44" className="fs-ill__soft" />
      <path d="M120 70 C123 92 128 97 150 100 C128 103 123 108 120 130 C117 108 112 103 90 100 C112 97 117 92 120 70Z" className="fs-ill__dot" />
    </>
  );
}

const ART = { box: BoxArt, breath: BreathArt, senses: SensesArt, taps: TapsArt, stretch: StretchArt, rain: RainArt, music: MusicArt, mindful: MindfulArt, default: DefaultArt };

export function ExerciseIllustration({ kind = 'default', tone, paused = false, caption = true }) {
  const Art = ART[kind] ?? DefaultArt;
  const name = ART[kind] ? kind : 'default';
  return (
    <figure className={`fs-ill fs-ill--${name}`} data-tone={tone} data-paused={paused || undefined}>
      <svg viewBox="0 0 240 200" className="fs-ill__art" aria-hidden="true">
        <Art />
      </svg>
      {caption && <figcaption className="fs-ill__caption">{CAPTIONS[name]}</figcaption>}
    </figure>
  );
}

export default ExerciseIllustration;
