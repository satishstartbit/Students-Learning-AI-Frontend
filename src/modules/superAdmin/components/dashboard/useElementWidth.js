import { useEffect, useRef, useState } from 'react';

/**
 * The rendered width of an element, kept current with a ResizeObserver, so a
 * chart can draw at its real size (text stays readable on a phone instead of
 * a desktop drawing shrunk to fit). `fallback` until the first measurement.
 */
export function useElementWidth(fallback = 720) {
  const ref = useRef(null);
  const [width, setWidth] = useState(fallback);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const next = Math.round(entry.contentRect.width);
      if (next > 0) setWidth(next);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
}
