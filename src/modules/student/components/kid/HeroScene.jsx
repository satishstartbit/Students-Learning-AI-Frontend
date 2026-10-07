import { useState } from 'react';
import heroArt from '../../../../assets/kid/home-hero.webp';
import heroArtSmall from '../../../../assets/kid/home-hero-1100.webp';
import { Highlighter } from '../../../../components/ui/highlighter';
import { getHourInTimezone } from '../../../../utils/date';
import { useMotionAllowed } from '../../hooks/useKidPreferences';
import { DriftingCloud, FallingLeaf, FlyingBird, Sparkle, SpeechBubble, SunGlow, WaveMarks } from './BannerBits';
import { KidBannerHero } from './KidBannerHero';

/** Morning / afternoon / evening by the student's own clock (utils/date.js), not the browser's. */
function greetingFor(hour) {
  if (hour === null) return 'Hello';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** src/assets/kid/home-hero*.webp - the bear under the tree, with the signpost. */
const ART = { src: heroArt, srcSmall: heroArtSmall, smallWidth: 1100, bigWidth: 2000, width: 2073, height: 661, sky: '#c7e9fd' };

/**
 * The K-5 Home's banner: "Good morning, Alex!" over the paper-craft scene
 * (KidBannerHero). The overlays sit on what is painted: a glow and sparkles
 * on the sun, a wandering cloud, birds, leaves falling from the tree, marks
 * beside the bear's waving paw and its "Hi!". "You have got this." gets a
 * hand-drawn underline (Highlighter).
 */
export function HeroScene({ firstName }) {
  // Fixed for the visit - the greeting shouldn't change under the student's eyes.
  const [greeting] = useState(() => greetingFor(getHourInTimezone()));
  const motionAllowed = useMotionAllowed();

  return (
    <KidBannerHero
      art={ART}
      titleId="kid-greeting"
      title={firstName ? `${greeting}, ${firstName}!` : `${greeting}!`}
      subtitle={
        <>
          <Highlighter action="underline" color="#f6c445" strokeWidth={3} padding={1} animate={motionAllowed}>
            You have got this.
          </Highlighter>{' '}
          Small steps, big things happen.
        </>
      }
    >
      <SunGlow className="left-[50.2%] top-[33.7%] w-[13%]" />
      <Sparkle className="left-[43.5%] top-[14%] w-[1.6%]" />
      <Sparkle className="left-[56.5%] top-[19%] w-[1.2%]" delay={1.1} />
      <Sparkle className="left-[45%] top-[50%] w-[1%]" delay={2} />
      <DriftingCloud className="left-[20%] top-[5%] w-[6.5%]" />
      <FlyingBird className="top-[9%]" delay={2} time="19s" />
      <FlyingBird className="top-[15%]" size="ml-[3%] w-[1.6%]" delay={9} time="24s" />
      <FallingLeaf className="left-[60%] top-[38%] w-[1.3%]" delay={0.5} />
      <FallingLeaf className="left-[72%] top-[30%] w-[1.1%]" delay={3.4} dx="30px" dy="130px" time="8s" tone="#7cb65f" />
      <FallingLeaf className="left-[66%] top-[42%] w-[1%]" delay={5.8} dx="-16px" dy="95px" tone="#4f8f43" />
      {/* In the sky just above-left of the raised paw (the paw is at about 69-73%, 60-69%). */}
      <WaveMarks className="left-[67.6%] top-[49%] h-[9%] -rotate-[32deg]" />
      <SpeechBubble className="left-[80.5%] top-[20%]">Hi!</SpeechBubble>
    </KidBannerHero>
  );
}

export default HeroScene;
