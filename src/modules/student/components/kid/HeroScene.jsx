import { useState } from 'react';
import { Highlighter } from '../../../../components/ui/highlighter';
import { TextAnimate } from '../../../../components/ui/text-animate';
import { getHourInTimezone } from '../../../../utils/date';
import { useMotionAllowed } from '../../hooks/useKidPreferences';
import { Bear } from './Bear';
import { Heart, Landscape, Sun, WoodenSign } from './KidScenery';

/** Morning / afternoon / evening by the student's own clock (utils/date.js), not the browser's. */
function greetingFor(hour) {
  if (hour === null) return 'Hello';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * "Good morning, Alex!" over the paper-craft countryside, with the bear
 * waving from beside the signpost. The greeting words drift in once (Magic
 * UI TextAnimate); "You've got this!" gets a hand-drawn underline (Magic UI
 * Highlighter), drawn instantly in calm mode.
 */
export function HeroScene({ firstName }) {
  // Fixed for the visit - the greeting shouldn't change under the student's eyes.
  const [greeting] = useState(() => greetingFor(getHourInTimezone()));
  const motionAllowed = useMotionAllowed();
  const text = firstName ? `${greeting}, ${firstName}!` : `${greeting}!`;

  return (
    <section
      aria-labelledby="kid-greeting"
      className="relative isolate mx-4 mt-4 overflow-hidden rounded-[2rem] shadow-paper sm:mx-8"
    >
      <Landscape className="absolute inset-0 -z-10 size-full" />

      <div className="mx-auto flex min-h-[15rem] max-w-6xl flex-col px-5 pb-16 pt-8 sm:min-h-[17rem] sm:px-8 lg:min-h-[19.5rem] lg:pt-10">
        {/* From md the signpost and bear stand at the right (about 19rem, 24rem
            from lg), so the greeting keeps clear of them and wraps instead of
            running under the sign on a tablet. */}
        <div className="flex max-w-[40rem] items-start gap-3 md:max-w-[min(40rem,calc(100%-19rem))] lg:max-w-[min(40rem,calc(100%-24rem))]">
          <TextAnimate
            as="h1"
            id="kid-greeting"
            by="word"
            animation="blurInUp"
            startOnView={false}
            className="font-kid-display text-[clamp(2.1rem,5.2vw,4.25rem)] font-semibold leading-[1.04] text-kid-ink"
          >
            {text}
          </TextAnimate>
          <Sun className="mt-1 hidden size-16 shrink-0 sm:block lg:size-24" />
        </div>

        <p className="mt-3 font-kid-hand text-2xl text-kid-ink-soft sm:text-3xl">
          <Highlighter action="underline" color="#f6c445" strokeWidth={3} padding={1} animate={motionAllowed}>
            You&apos;ve got this!
          </Highlighter>
        </p>
      </div>

      <div className="pointer-events-none absolute bottom-3 right-4 hidden items-end gap-2 md:flex lg:right-10">
        <WoodenSign className="mb-12 -rotate-6" boardClassName="w-40 text-xl">
          Small steps, big things happen! <Heart className="inline size-5 align-[-3px]" />
        </WoodenSign>
        <Bear className="w-36 lg:w-48" />
      </div>
    </section>
  );
}

export default HeroScene;
