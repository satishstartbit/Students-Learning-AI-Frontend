import { useState } from 'react';
import heroArt from '../../../../assets/kid/home-hero.webp';
import heroArtSmall from '../../../../assets/kid/home-hero-1100.webp';
import heroPaw from '../../../../assets/kid/home-paw.webp';
import { Highlighter } from '../../../../components/ui/highlighter';
import { getHourInTimezone } from '../../../../utils/date';
import { useMotionAllowed } from '../../hooks/useKidPreferences';
import { Bird3D, BirdSky, Butterfly, DriftingCloud, FallingLeaf, RisingHearts, Sparkle, SpeechBubble, SunGlow, WaveMarks } from './BannerBits';
import { KidBannerHero } from './KidBannerHero';

/** Morning / afternoon / evening by the student's own clock (utils/date.js), not the browser's. */
function greetingFor(hour) {
  if (hour === null) return 'Hello';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * src/assets/kid/home-hero*.webp - the bear under the tree, with the signpost,
 * made from the user's 2073x661 picture with the bear's raised arm painted
 * out; the arm itself is src/assets/kid/home-paw.webp (the picture's pixels
 * 1434-1569 x 401-562), laid back on exactly where it was so it can wave.
 */
const ART = { src: heroArt, srcSmall: heroArtSmall, smallWidth: 1100, bigWidth: 2000, width: 2073, height: 661, sky: '#c7e9fd' };

/**
 * The K-5 Home's banner: "Good morning, Alex!" over the paper-craft scene
 * (KidBannerHero). The bear waves: its arm swings out from the shoulder twice,
 * then rests (kh-paw-wave), with "(" marks flicking beside the paw and its
 * "Hi!". Birds fly through the sky in real 3D (BirdSky / Bird3D: wings that
 * flap in depth, far and small to near and big). The other overlays sit on
 * what is painted: a glow and sparkles on the sun, a wandering cloud, leaves
 * falling from the tree, sparkles by the
 * sign, hearts floating up by the bear, butterflies over the plants. All of it
 * stops in calm mode, where the arm rests in its painted place. "You have got
 * this." gets a hand-drawn underline (Highlighter).
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
      {/* Birds in 3D: two far away crossing the top of the sky, one nearer gliding back,
          and one out from behind the tree towards you, growing as it comes. Negative
          delays: they are already flying when the page opens. */}
      <BirdSky>
        <Bird3D path="cross" size="4.6cqw" time="19s" delay={-3} />
        <Bird3D path="cross" top="5cqh" size="3.8cqw" time="24s" delay={-15} flap="0.42s" />
        <Bird3D path="glide" top="3cqh" size="4.2cqw" time="27s" delay={-9} facing="left" flap="0.55s" />
        <Bird3D path="swoop" size="4.4cqw" time="12s" delay={1.5} facing="toward" flap="0.6s" />
      </BirdSky>
      <FallingLeaf className="left-[60%] top-[38%] w-[1.3%]" delay={0.5} />
      <FallingLeaf className="left-[72%] top-[30%] w-[1.1%]" delay={3.4} dx="30px" dy="130px" time="8s" tone="#7cb65f" />
      <FallingLeaf className="left-[66%] top-[42%] w-[1%]" delay={5.8} dx="-16px" dy="95px" tone="#4f8f43" />
      {/* Sparkles by the blank sign; hearts by the bear's head; butterflies over the plants. */}
      <Sparkle className="left-[55%] top-[57%] w-[0.9%]" delay={0.7} />
      <Sparkle className="left-[66.2%] top-[67%] w-[0.8%]" delay={2.6} />
      <RisingHearts className="left-[88.5%] top-[27%] h-[11%] w-[3%]" />
      <Butterfly className="left-[49%] top-[74%] w-[1.9%]" travel="160%" delay={0.4} />
      <Butterfly className="left-[92.5%] top-[63%] w-[1.7%]" travel="-140%" delay={2.2} time="11s" wings={['#9fc8f2', '#f6c445']} />
      {/* The raised arm, back on its painted place, waving from the shoulder. */}
      <img
        src={heroPaw}
        alt=""
        draggable="false"
        decoding="async"
        className="kh-paw absolute left-[69.175%] top-[60.666%] w-[6.561%] select-none"
      />
      {/* In the sky just above-left of the raised paw (the paw is at about 69-73%, 60-69%). */}
      <WaveMarks className="left-[67.6%] top-[49%] h-[9%] -rotate-[32deg]" />
      <SpeechBubble className="left-[80.5%] top-[20%]">Hi!</SpeechBubble>
    </KidBannerHero>
  );
}

export default HeroScene;
