import { useState } from 'react';
import { motion } from 'motion/react';
import { LuGift } from 'react-icons/lu';
import { StickerArt } from './StickerArt';
import { resolveRewardImage } from './stickerCatalog';

/**
 * A reward's picture, whatever the admin gave it (stickerCatalog.js#resolveRewardImage):
 * a built-in drawn sticker, an uploaded/linked image, or an emoji - with a gift
 * icon when there's nothing (or the image fails to load).
 *
 *   locked    faded + desaturated, and still (not collected yet)
 *   animate   collected pictures bob gently and wiggle on hover. Honours
 *             <MotionConfig reducedMotion> (K-5 calm mode, Grade 6+
 *             Settings -> Reduce motion) and the OS setting automatically.
 *   delay     staggers the idle bob so a grid doesn't move in lockstep
 */
export function RewardArt({ imageUrl, size = 64, locked = false, animate = true, delay = 0, className = '' }) {
  const [broken, setBroken] = useState(false);
  const resolved = resolveRewardImage(imageUrl);
  const style = { width: size, height: size };

  let picture;
  if (resolved.kind === 'sticker') {
    picture = <StickerArt slug={resolved.slug} style={style} />;
  } else if (resolved.kind === 'image' && !broken) {
    picture = <img src={resolved.src} alt="" style={{ ...style, objectFit: 'contain' }} onError={() => setBroken(true)} draggable="false" />;
  } else if (resolved.kind === 'emoji') {
    picture = (
      <span style={{ ...style, display: 'grid', placeItems: 'center', fontSize: size * 0.72, lineHeight: 1 }} aria-hidden="true">
        {resolved.text}
      </span>
    );
  } else {
    picture = (
      <span style={{ ...style, display: 'grid', placeItems: 'center', color: 'currentColor' }} aria-hidden="true">
        <LuGift size={size * 0.55} />
      </span>
    );
  }

  const lockedStyle = locked ? { filter: 'grayscale(0.55) saturate(0.7)', opacity: 0.55 } : null;
  const moving = animate && !locked;

  return (
    <motion.span
      className={className}
      style={{ display: 'inline-grid', placeItems: 'center', ...lockedStyle }}
      aria-hidden="true"
      animate={moving ? { y: [0, -4, 0] } : undefined}
      transition={moving ? { duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay } : undefined}
      whileHover={moving ? { scale: 1.1, rotate: [0, -6, 6, 0], transition: { duration: 0.45 } } : undefined}
    >
      {picture}
    </motion.span>
  );
}

export default RewardArt;
