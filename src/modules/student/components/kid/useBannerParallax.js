import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from 'react';
import { useMotionValue, useScroll, useSpring, useTransform } from 'motion/react';
import { useMainScrollContainer } from '../../../../hooks/useMainScrollContainer';
import { useMotionAllowed } from '../../hooks/useKidPreferences';

/**
 * Parallax for a K-4 banner picture split into depths (KidBannerHero
 * `parallax` + BannerParallax#ParallaxLayer). Two inputs, both on springs:
 *
 *   scroll   0 -> 1 while the banner scrolls out of the kid shell's <main>:
 *            the sky lags behind the land, the words float up and fade
 *   pointer  a mouse over the banner (fine pointers from 640px, never
 *            touch): the far layers lean away from it, the near ones towards it
 *
 * Off in calm mode and with reduced motion - the layers then lie exactly as
 * the one painted picture. Motion values only: moving never re-renders React.
 */
export const BannerParallaxContext = createContext(null);

/** The banner's motion values for a ParallaxLayer, or null when the banner is still. */
export function useBannerParallaxLayer() {
  return useContext(BannerParallaxContext);
}

/**
 * How far each depth moves, in % of the picture: `scroll` once the banner has
 * scrolled out (positive = lags behind the page), `x` / `y` with the mouse at
 * the banner's edge. `land` is the focal plane and moves with the page. The
 * sky plate has sky painted round it for this (3% each side, 5% on top).
 */
export const PARALLAX_DEPTHS = {
  sky: { scroll: 30, x: -1.2, y: -1.5 },
  air: { scroll: 16, x: -0.6, y: -0.8 },
  land: { scroll: 0, x: 0, y: 0 },
  near: { scroll: -12, x: 1.6, y: 1.2 },
};

const SCROLL_SPRING = { stiffness: 120, damping: 26, mass: 0.6 };
const POINTER_SPRING = { stiffness: 60, damping: 20, mass: 1 };
const FINE_POINTER = '(hover: hover) and (pointer: fine) and (min-width: 640px)';

function useMediaMatch(query) {
  const media = useMemo(() => (typeof window === 'undefined' ? null : window.matchMedia(query)), [query]);
  const subscribe = useCallback(
    (onChange) => {
      media?.addEventListener('change', onChange);
      return () => media?.removeEventListener('change', onChange);
    },
    [media]
  );
  return useSyncExternalStore(subscribe, () => media?.matches ?? false, () => false);
}

/** Springy scroll progress of `targetRef` through the shell's scrolling <main> (motion `useScroll` offsets). */
export function useKidScrollProgress(targetRef, offset) {
  const container = useMainScrollContainer();
  const { scrollYProgress } = useScroll({ container, target: targetRef, offset });
  return useSpring(scrollYProgress, SCROLL_SPRING);
}

const clampUnit = (value) => Math.max(-1, Math.min(1, value));

/**
 * @param sectionRef the banner <section>
 * @returns layer      motion values for the ParallaxLayers (null = still)
 *          textStyle  style for the words (undefined = still)
 *          handlers   pointer handlers for the section
 *          enabled
 */
export function useBannerParallax(sectionRef) {
  const enabled = useMotionAllowed();
  const finePointer = useMediaMatch(FINE_POINTER);
  const pointerOn = enabled && finePointer;

  const progress = useKidScrollProgress(sectionRef, ['start start', 'end start']);
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const pointerX = useSpring(cursorX, POINTER_SPRING);
  const pointerY = useSpring(cursorY, POINTER_SPRING);
  const textY = useTransform(progress, [0, 1], [0, -48]);
  const textOpacity = useTransform(progress, [0, 0.85], [1, 0.25]);

  useEffect(() => {
    if (pointerOn) return;
    cursorX.jump(0);
    cursorY.jump(0);
    pointerX.jump(0);
    pointerY.jump(0);
  }, [pointerOn, cursorX, cursorY, pointerX, pointerY]);

  const layer = useMemo(() => (enabled ? { progress, pointerX, pointerY } : null), [enabled, progress, pointerX, pointerY]);

  const handlers = useMemo(() => {
    if (!pointerOn) return {};
    const reset = () => {
      cursorX.set(0);
      cursorY.set(0);
    };
    return {
      onPointerMove: (event) => {
        if (event.pointerType !== 'mouse') return;
        const box = event.currentTarget.getBoundingClientRect();
        cursorX.set(clampUnit(((event.clientX - box.left) / box.width) * 2 - 1));
        cursorY.set(clampUnit(((event.clientY - box.top) / box.height) * 2 - 1));
      },
      onPointerLeave: reset,
      onPointerCancel: reset,
    };
  }, [pointerOn, cursorX, cursorY]);

  return {
    layer,
    textStyle: enabled ? { y: textY, opacity: textOpacity } : undefined,
    handlers,
    enabled,
  };
}
