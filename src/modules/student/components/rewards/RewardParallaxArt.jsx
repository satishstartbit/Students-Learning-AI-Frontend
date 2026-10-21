import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { useIsMobile } from '../../../../hooks/useIsMobile';
import { useMainScrollContainer } from '../../../../hooks/useMainScrollContainer';
import RewardArt from './RewardArt';

const GENTLE_SPRING = { stiffness: 55, damping: 24, mass: 1 };

/** Listen for live accessibility and pointer-device changes. */
function useMediaQuery(query, fallback = false) {
  const media = useMemo(() => typeof window === 'undefined' ? null : window.matchMedia(query), [query]);
  const subscribe = useCallback((onChange) => {
    media?.addEventListener('change', onChange);
    return () => media?.removeEventListener('change', onChange);
  }, [media]);
  return useSyncExternalStore(subscribe, () => media?.matches ?? fallback, () => fallback);
}

/**
 * Only the collectible's picture moves; its slot, tile and label stay still.
 * @param {{
 *   imageUrl: string,
 *   locked: boolean,
 *   index: number,
 *   disabled?: boolean,
 * }} props
 */
export default function RewardParallaxArt({ imageUrl, locked, index, disabled = false }) {
  const artRef = useRef(null);
  const scrollContainerRef = useMainScrollContainer();
  const reducedMotion = useReducedMotion();
  const systemReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)', reducedMotion ?? false);
  const finePointer = useMediaQuery('(hover: hover) and (pointer: fine)');
  const isMobile = useIsMobile();
  const enabled = !locked && !disabled && !systemReducedMotion;
  const pointerEnabled = enabled && finePointer && !isMobile;
  const scale = isMobile ? 0.5 : 1;
  // Slightly different depths, capped to fit the existing space above the name.
  const depth = (4 + index % 3) * scale;

  // Measure the stationary picture slot inside the main scroller.
  const { scrollYProgress } = useScroll({
    container: scrollContainerRef,
    target: artRef,
    offset: ['start end', 'end start'],
  });
  const progress = useSpring(scrollYProgress, GENTLE_SPRING);
  const scrollY = useTransform(progress, [0, 1], [depth, -depth]);
  // Normalized cursor coordinates ease toward the mouse, with no render per frame.
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const pointerX = useSpring(cursorX, GENTLE_SPRING);
  const pointerY = useSpring(cursorY, GENTLE_SPRING);
  const x = useTransform(pointerX, [-1, 1], [-depth, depth]);
  const mouseY = useTransform(pointerY, [-1, 1], [-depth / 3, depth / 3]);
  const y = useTransform(() => scrollY.get() + mouseY.get());

  useEffect(() => {
    if (pointerEnabled) return;
    cursorX.jump(0);
    cursorY.jump(0);
    pointerX.jump(0);
    pointerY.jump(0);
  }, [pointerEnabled, cursorX, cursorY, pointerX, pointerY]);

  const resetPointer = () => {
    cursorX.set(0);
    cursorY.set(0);
  };
  /** @param {import('react').PointerEvent<HTMLSpanElement>} event */
  const movePointer = (event) => {
    if (!pointerEnabled || event.pointerType !== 'mouse') return;
    const rect = event.currentTarget.getBoundingClientRect();
    const clamp = (value) => Math.max(-1, Math.min(1, value));
    cursorX.set(clamp(((event.clientX - rect.left) / rect.width) * 2 - 1));
    cursorY.set(clamp(((event.clientY - rect.top) / rect.height) * 2 - 1));
  };

  return (
    <span
      ref={artRef}
      className="rw-parallax-art"
      aria-hidden="true"
      data-parallax={enabled ? 'on' : 'off'}
      onPointerMove={pointerEnabled ? movePointer : undefined}
      onPointerLeave={resetPointer}
      onPointerCancel={resetPointer}
    >
      <motion.span
        className="rw-parallax-art__layer"
        style={{ x: enabled ? x : 0, y: enabled ? y : 0, willChange: enabled ? 'transform' : undefined }}
      >
        {/* Replace the idle bob with parallax here; other RewardArt uses are unchanged. */}
        <RewardArt imageUrl={imageUrl} size={64} locked={locked} animate={false} />
      </motion.span>
    </span>
  );
}
