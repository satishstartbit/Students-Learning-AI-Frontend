import { motion, useTransform } from 'motion/react';
import { cn } from '../../../../lib/utils';
import { PARALLAX_DEPTHS, useBannerParallaxLayer } from './useBannerParallax';

/**
 * One depth of a banner picture split into layers (KidBannerHero
 * `parallax`): a box over the whole picture holding that depth's art and
 * overlays, which are placed in % of the picture as usual.
 *
 *   sky   the far sky plate with its sun and sparkles - lags furthest behind
 *   air   clouds and birds, which fly behind the tree and the animal
 *   land  the ground, tree and animal - the focal plane, moves with the page
 *   near  things in front (butterflies) - run a little ahead of the page
 *
 * A plain box in calm mode, with reduced motion, and outside a parallax banner.
 */
export function ParallaxLayer({ depth = 'land', className, children }) {
  const values = useBannerParallaxLayer();
  const move = PARALLAX_DEPTHS[depth] ?? PARALLAX_DEPTHS.land;
  const box = cn('absolute inset-0 block', className);

  if (!values || (!move.scroll && !move.x && !move.y)) {
    return (
      <span data-depth={depth} className={box}>
        {children}
      </span>
    );
  }
  return (
    <MovingLayer depth={depth} move={move} values={values} className={box}>
      {children}
    </MovingLayer>
  );
}

function MovingLayer({ depth, move, values, className, children }) {
  const x = useTransform(() => `${values.pointerX.get() * move.x}%`);
  const y = useTransform(() => `${values.progress.get() * move.scroll + values.pointerY.get() * move.y}%`);

  return (
    <motion.span data-depth={depth} className={className} style={{ x, y, willChange: 'transform' }}>
      {children}
    </motion.span>
  );
}

export default ParallaxLayer;
