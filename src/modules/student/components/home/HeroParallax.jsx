import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { useIsMobile } from '../../../../hooks/useIsMobile';

const HERO_BASE = `${import.meta.env.BASE_URL}hero/`;
const LAYERS = [
  { name: 'back', distance: 20, pointerDistance: 4 },
  { name: 'mid', distance: 40, pointerDistance: 8 },
  { name: 'front', distance: 70, pointerDistance: 12 },
  { name: 'leaf', distance: 60, pointerDistance: 10, rotation: 4 },
];
const GENTLE_SPRING = { stiffness: 55, damping: 24, mass: 1 };

/** Subscribe to device changes too (for example, a mouse being disconnected). */
function useMediaQuery(query, fallback = false) {
  const media = useMemo(() => typeof window === 'undefined' ? null : window.matchMedia(query), [query]);
  const subscribe = useCallback((onChange) => {
    media?.addEventListener('change', onChange);
    return () => media?.removeEventListener('change', onChange);
  }, [media]);
  return useSyncExternalStore(subscribe, () => media?.matches ?? fallback, () => fallback);
}

/**
 * @typedef {import('framer-motion').MotionValue<number>} MotionNumber
 * @typedef {Object} LayerProps
 * @property {string} name
 * @property {string} src
 * @property {number} distance
 * @property {number} pointerDistance
 * @property {number} [rotation]
 * @property {MotionNumber} progress
 * @property {MotionNumber} pointerX
 * @property {MotionNumber} pointerY
 * @property {number} scale
 * @property {boolean} enabled
 * @property {boolean} visible
 * @property {() => void} [onLoad]
 * @property {() => void} [onError]
 */

/** @param {LayerProps} props */
function ParallaxLayer({
  name, src, distance, pointerDistance, rotation = 0,
  progress, pointerX, pointerY, scale, enabled, visible, onLoad, onError,
}) {
  // Depth determines how far each plane drifts as the hero leaves the viewport.
  const scrollY = useTransform(progress, [0, 1], [0, distance * scale]);
  const x = useTransform(pointerX, [-1, 1], [-pointerDistance * scale, pointerDistance * scale]);
  const mouseY = useTransform(pointerY, [-1, 1], [-pointerDistance * scale, pointerDistance * scale]);
  const y = useTransform(() => scrollY.get() + mouseY.get());
  const rotate = useTransform(progress, [0, 1], [0, rotation * scale]);

  return (
    <motion.img
      className={`sh-hero__layer sh-hero__layer--${name}`}
      src={src}
      alt=""
      width={1672}
      height={941}
      loading="eager"
      decoding="async"
      draggable="false"
      onLoad={onLoad}
      onError={onError}
      style={{
        x: enabled ? x : 0,
        y: enabled ? y : 0,
        rotate: enabled ? rotate : 0,
        opacity: visible ? 1 : 0,
        willChange: enabled && visible ? 'transform' : undefined,
      }}
    />
  );
}

/**
 * @typedef {Object} HeroParallaxProps
 * @property {import('react').RefObject<HTMLElement | null>} scrollContainerRef
 * @property {import('react').ReactNode} children Greeting and summary.
 * @property {(style: import('framer-motion').MotionStyle) => import('react').ReactNode} renderCheckIn
 * @property {string} fallbackSrc Original illustration, until all four layers load.
 * @property {boolean} [isFocusMode]
 * @property {boolean} [reduceMotion] The student's saved accessibility preference.
 */

/** A decorative hero; its controls and the rest of the dashboard stay in normal flow.
 * @param {HeroParallaxProps} props
 */
export default function HeroParallax({
  scrollContainerRef, children, renderCheckIn, fallbackSrc, isFocusMode = false, reduceMotion = false,
}) {
  const heroRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();
  // Framer's hook reads the initial preference; this subscription also handles live changes.
  const systemReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)', prefersReducedMotion ?? false);
  const finePointer = useMediaQuery('(hover: hover) and (pointer: fine)');
  const isMobile = useIsMobile();
  const enabled = !systemReducedMotion && !reduceMotion && !isFocusMode;
  const pointerEnabled = enabled && finePointer && !isMobile;
  const scale = isMobile ? 0.5 : 1;
  const [loadedLayers, setLoadedLayers] = useState({});
  const layersReady = LAYERS.every(({ name }) => loadedLayers[name]);

  // Track the actual main scroller, from the hero's top to its bottom leaving view.
  const { scrollYProgress } = useScroll({
    container: scrollContainerRef,
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const progress = useSpring(scrollYProgress, GENTLE_SPRING);
  // Cursor coordinates stay in [-1, 1]; springs ease toward them without React renders.
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const pointerX = useSpring(cursorX, GENTLE_SPRING);
  const pointerY = useSpring(cursorY, GENTLE_SPRING);
  // Text and the card presentation drift upward; the button's hit area stays fixed.
  const greetingY = useTransform(progress, [0, 1], [0, -20 * scale]);
  const greetingOpacity = useTransform(progress, [0, 1], [1, 0.8]);
  const checkInY = useTransform(progress, [0, 1], [0, -25 * scale]);
  const checkInOpacity = useTransform(progress, [0, 1], [1, 0.3]);

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
  /** @param {import('react').PointerEvent<HTMLElement>} event */
  const movePointer = (event) => {
    if (!pointerEnabled || event.pointerType !== 'mouse') return;
    // Interactive elements never drive the decorative mouse effect.
    if (event.target.closest('button, a, input, select, textarea, [role="button"]')) {
      resetPointer();
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const clamp = (value) => Math.max(-1, Math.min(1, value));
    cursorX.set(clamp(((event.clientX - rect.left) / rect.width) * 2 - 1));
    cursorY.set(clamp(((event.clientY - rect.top) / rect.height) * 2 - 1));
  };
  const layerMotion = { progress, pointerX, pointerY, scale, enabled };

  return (
    <section
      ref={heroRef}
      className="sh-hero"
      aria-label="Today"
      data-parallax={enabled ? 'on' : 'off'}
      onPointerMove={pointerEnabled ? movePointer : undefined}
      onPointerLeave={resetPointer}
      onPointerCancel={resetPointer}
    >
      <motion.div
        className="sh-hero__greeting"
        style={{ y: enabled ? greetingY : 0, opacity: enabled ? greetingOpacity : 1 }}
      >
        {children}
      </motion.div>
      <div className="sh-hero__art">
        <div className="sh-hero__scene" aria-hidden="true" data-layers-ready={layersReady}>
          {LAYERS.map((layer) => (
            <ParallaxLayer
              key={layer.name}
              {...layer}
              {...layerMotion}
              src={`${HERO_BASE}${layer.name}.png`}
              visible={layersReady}
              onLoad={() => setLoadedLayers((loaded) => ({ ...loaded, [layer.name]: true }))}
              onError={() => setLoadedLayers((loaded) => ({ ...loaded, [layer.name]: false }))}
            />
          ))}
          {!layersReady && (
            <ParallaxLayer
              name="fallback"
              src={fallbackSrc}
              distance={40}
              pointerDistance={8}
              visible
              {...layerMotion}
            />
          )}
        </div>
        {renderCheckIn({
          y: enabled ? checkInY : 0,
          opacity: enabled ? checkInOpacity : 1,
          rotate: 2.5,
        })}
      </div>
    </section>
  );
}
