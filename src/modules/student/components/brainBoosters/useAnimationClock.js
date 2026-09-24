import { useEffect, useEffectEvent, useRef } from 'react';

/** One clock drives position and completion. Pausing retains elapsed time. */
export function useAnimationClock({ running, clockKey, durationMs, onFrame, onFinish }) {
  const elapsed = useRef(0);
  const paint = useEffectEvent(onFrame);
  const finish = useEffectEvent(onFinish);
  useEffect(() => { elapsed.current = 0; paint(0); }, [clockKey]);
  useEffect(() => {
    const resize = () => paint(elapsed.current);
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);
  useEffect(() => {
    if (!running) return undefined;
    let frame;
    let previous = performance.now();
    const tick = (now) => {
      // Do not jump across a stalled frame or a hidden tab.
      if (!document.hidden) elapsed.current = Math.min(durationMs, elapsed.current + Math.min(now - previous, 64));
      previous = now;
      paint(elapsed.current);
      if (elapsed.current >= durationMs) finish();
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, clockKey, durationMs]);
}

export function usePauseWhenHidden(onPause) {
  const pause = useEffectEvent(onPause);
  useEffect(() => {
    const onVisibility = () => { if (document.hidden) pause(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);
}
