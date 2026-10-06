import { useState } from 'react';
import heroArt from '../../../../assets/kid/home-hero.webp';
import heroArtSmall from '../../../../assets/kid/home-hero-1100.webp';
import { Highlighter } from '../../../../components/ui/highlighter';
import { TextAnimate } from '../../../../components/ui/text-animate';
import { getHourInTimezone } from '../../../../utils/date';
import { useMotionAllowed } from '../../hooks/useKidPreferences';
import { HomeSticker } from './home/HomeBits';

/** Morning / afternoon / evening by the student's own clock (utils/date.js), not the browser's. */
function greetingFor(hour) {
  if (hour === null) return 'Hello';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** The picture's own sky colour, so the space above or beside it reads as one sky. */
const SKY = '#c7e9fd';

/**
 * The K-5 Home's top banner: the paper-craft scene from the mockup
 * (src/assets/kid/home-hero*.webp - sky, sun, tree, signpost, the bear
 * waving) with "Good morning, Alex!" in the open sky on the left.
 *
 * From a small tablet up the picture fills the banner and the greeting sits
 * over its sky; on a phone the greeting comes first and the picture follows,
 * zoomed onto its right two-thirds so the bear and the tree stay big.
 *
 * Moving parts (kidHome.css; all stop in calm mode and follow reduced
 * motion): the scene drifts slowly, the sun glows and sparkles, a small
 * cloud wanders, birds cross the sky, leaves fall from the tree, marks
 * flick beside the bear's waving paw and it says "Hi!", the greeting
 * drifts in (TextAnimate), the star twinkles, "You have got this." is
 * underlined (Highlighter).
 */
export function HeroScene({ firstName }) {
  // Fixed for the visit - the greeting shouldn't change under the student's eyes.
  const [greeting] = useState(() => greetingFor(getHourInTimezone()));
  const motionAllowed = useMotionAllowed();
  const text = firstName ? `${greeting}, ${firstName}!` : `${greeting}!`;

  return (
    <section
      aria-labelledby="kid-greeting"
      className="relative isolate flex flex-col overflow-hidden border-b border-kid-edge/60 sm:aspect-[2073/661] sm:max-h-[28rem] sm:min-h-[13rem] sm:flex-row sm:items-center"
      style={{ backgroundColor: SKY }}
    >
      <div className="relative z-10 px-5 pb-2 pt-6 sm:max-w-[46%] sm:px-8 sm:py-6 lg:max-w-[45%] lg:px-10">
        <div className="flex items-start gap-2">
          <TextAnimate
            as="h1"
            id="kid-greeting"
            by="word"
            animation="blurInUp"
            startOnView={false}
            className="font-kid-display text-[clamp(1.6rem,3.4vw,2.75rem)] font-semibold leading-[1.08] text-kid-ink"
          >
            {text}
          </TextAnimate>
          <HomeSticker slug="star" tilt={-10} delay={0.6} className="relative mt-1 size-9 shrink-0 sm:size-10 lg:size-12" />
        </div>

        <p className="mt-2.5 font-kid-body text-base leading-snug text-kid-ink-soft sm:text-[1.05rem] lg:text-lg">
          <Highlighter action="underline" color="#f6c445" strokeWidth={3} padding={1} animate={motionAllowed}>
            You have got this.
          </Highlighter>{' '}
          Small steps, big things happen.
        </p>
      </div>

      {/* The picture: under the greeting on a phone (its right two-thirds,
          bigger), behind it from a small tablet up (bottom-aligned; on a very
          wide screen the top of the sky is trimmed). */}
      <div aria-hidden="true" className="relative ml-[-50%] w-[150%] shrink-0 sm:absolute sm:bottom-0 sm:left-0 sm:ml-0 sm:w-full">
        <div className="kh-hero-drift relative aspect-[2073/661]">
          <img
            src={heroArt}
            srcSet={`${heroArtSmall} 1100w, ${heroArt} 2000w`}
            sizes="(min-width: 1024px) calc(100vw - 15rem), (min-width: 640px) 100vw, 150vw"
            alt=""
            decoding="async"
            fetchPriority="high"
            draggable="false"
            className="absolute inset-0 size-full select-none"
          />

          {/* Light around the sun, and three sparkles. */}
          <span className="kh-sunglow absolute left-[50.2%] top-[33.7%] aspect-square w-[13%] -translate-x-1/2 -translate-y-1/2 rounded-full" />
          <Sparkle className="left-[43.5%] top-[14%] w-[1.6%]" delay={0} />
          <Sparkle className="left-[56.5%] top-[19%] w-[1.2%]" delay={1.1} />
          <Sparkle className="left-[45%] top-[50%] w-[1%]" delay={2} />

          {/* A small cloud wandering through the open sky. */}
          <span className="kh-cloud absolute left-[20%] top-[5%] block w-[6.5%]" style={{ '--kh-cloud-travel': '240%', '--kh-cloud-time': '34s' }}>
            <PaperCloud />
          </span>

          {/* Birds crossing now and then. */}
          <span className="kh-fly absolute inset-x-0 top-[9%] block" style={{ '--kh-fly-time': '19s', '--kh-delay': '2s' }}>
            <Bird className="w-[2.2%]" />
          </span>
          <span className="kh-fly absolute inset-x-0 top-[15%] block" style={{ '--kh-fly-time': '24s', '--kh-delay': '9s' }}>
            <Bird className="ml-[3%] w-[1.6%]" />
          </span>

          {/* Leaves letting go of the tree. */}
          <Leaf className="left-[60%] top-[38%] w-[1.3%]" delay={0.5} style={{ '--kh-leaf-x': '-28px', '--kh-leaf-y': '110px' }} />
          <Leaf className="left-[72%] top-[30%] w-[1.1%]" delay={3.4} style={{ '--kh-leaf-x': '30px', '--kh-leaf-y': '130px', '--kh-leaf-time': '8s' }} tone="#7cb65f" />
          <Leaf className="left-[66%] top-[42%] w-[1%]" delay={5.8} style={{ '--kh-leaf-x': '-16px', '--kh-leaf-y': '95px' }} tone="#4f8f43" />

          {/* The bear's wave: marks flicking beside the raised paw, and a "Hi!". */}
          {/* In the sky just above-left of the raised paw (the paw is at about 69-73%, 60-69%). */}
          <span className="absolute left-[67.6%] top-[49%] flex h-[9%] -rotate-[32deg] items-center gap-[30%]">
            <WaveMark delay={0} className="h-[70%]" />
            <WaveMark delay={0.3} className="h-full" />
          </span>
          <span
            className="kh-pop absolute left-[80.5%] top-[20%] grid place-items-center rounded-[40%] bg-white px-[0.9%] py-[0.45%] font-kid-display text-[clamp(0.7rem,1.25vw,1.15rem)] font-semibold text-kid-ink shadow-paper"
            style={{ '--kh-delay': '1.2s' }}
          >
            <span className="kh-float block" style={{ '--kh-delay': '1.8s' }}>
              Hi!
            </span>
            <span className="absolute -bottom-1 left-2.5 size-2.5 rotate-45 rounded-[2px] bg-white" />
          </span>
        </div>
      </div>
    </section>
  );
}

function Sparkle({ className, delay }) {
  return (
    <span className={`kh-twinkle absolute block ${className}`} style={{ '--kh-delay': `${delay}s` }}>
      <svg viewBox="0 0 20 20" className="block w-full">
        <path d="M10 0 C11 7 13 9 20 10 C13 11 11 13 10 20 C9 13 7 11 0 10 C7 9 9 7 10 0Z" fill="#ffffff" opacity="0.95" />
      </svg>
    </span>
  );
}

function PaperCloud() {
  return (
    <svg viewBox="0 0 140 64" className="block w-full drop-shadow-[0_3px_3px_rgb(70_110_140/0.18)]">
      <g fill="#fbfaf6">
        <circle cx="38" cy="38" r="22" />
        <circle cx="70" cy="28" r="26" />
        <circle cx="102" cy="38" r="20" />
        <rect x="18" y="38" width="104" height="22" rx="11" />
      </g>
    </svg>
  );
}

function Bird({ className }) {
  return (
    <svg viewBox="0 0 40 20" className={`kh-flap block ${className}`}>
      <path d="M2 6 Q11 0 20 11 Q29 0 38 6" fill="none" stroke="#3a5873" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Leaf({ className, delay, style, tone = '#5e9e48' }) {
  return (
    <span className={`kh-leaf absolute block ${className}`} style={{ '--kh-delay': `${delay}s`, ...style }}>
      <svg viewBox="0 0 20 30" className="block w-full">
        <path d="M10 1 C19 9 19 21 10 29 C1 21 1 9 10 1Z" fill={tone} />
        <path d="M10 4 L10 27" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1.4" />
      </svg>
    </span>
  );
}

/** One "(" motion mark - the swing of the waving paw. */
function WaveMark({ delay, className = '' }) {
  return (
    <span className={`kh-wave-mark block aspect-[1/3] ${className}`} style={{ '--kh-delay': `${delay}s` }}>
      <svg viewBox="0 0 10 30" className="block size-full">
        <path d="M8 2 Q0 15 8 28" fill="none" stroke="#7a4a26" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export default HeroScene;
