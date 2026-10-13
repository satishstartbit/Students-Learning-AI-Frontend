import meadow from '../../../../assets/kid/home-meadow.webp';
import { Bird3D, BirdSky, Butterfly, FallingLeaf, SeaShimmer, Sparkle } from './BannerBits';
import './home/kidHome.css';

/**
 * The meadow at the foot of a K-4 page (Home, My week): the user's paper-craft
 * hills and lake (src/assets/kid/home-meadow.webp, 1800x600, clear sky on
 * top - `.kh-meadow` tucks it up under the last cards). It rises in and comes
 * alive: light on the lake, butterflies over the flower and the bushes, birds
 * flying in 3D (BirdSky / Bird3D), a leaf on the wind - placed in % of the
 * picture, with a floor in px so they still show on a phone. Decorative; it
 * all stops in calm mode and with reduced motion.
 *
 * Put a `<div className="flex-1" />` before it so it sits at the foot even
 * when there is little on the page.
 */
export function MeadowFooter() {
  return (
    <div aria-hidden="true" className="kh-meadow pointer-events-none relative">
      <div className="kh-rise relative">
        <img src={meadow} alt="" loading="lazy" decoding="async" draggable="false" className="block w-full select-none" />
        <SeaShimmer className="left-[50%] top-[66.5%] h-[9%] w-[22%]" waves={3} />
        <Sparkle className="left-[58%] top-[69%] w-[max(0.7%,6px)]" delay={0.4} />
        <Sparkle className="left-[68%] top-[72%] w-[max(0.6%,5px)]" delay={1.9} />
        <Butterfly className="left-[37.5%] top-[68%] w-[max(2%,12px)]" travel="140%" delay={0.6} />
        <Butterfly className="left-[81%] top-[58%] w-[max(1.8%,11px)]" travel="-150%" delay={2.4} time="11s" wings={['#9fc8f2', '#f6c445']} />
        {/* Birds in 3D over the hills, in the picture's clear sky. */}
        <BirdSky>
          <Bird3D path="cross" top="26cqh" size="max(3.4cqw, 20px)" time="21s" delay={-6} />
          <Bird3D path="glide" top="30cqh" size="max(2.9cqw, 18px)" time="26s" delay={-16} facing="left" flap="0.5s" />
        </BirdSky>
        <FallingLeaf className="left-[9%] top-[62%] w-[max(0.8%,6px)]" delay={1.2} dx="40px" dy="50px" time="8s" tone="#9bc26a" />
      </div>
    </div>
  );
}

export default MeadowFooter;
