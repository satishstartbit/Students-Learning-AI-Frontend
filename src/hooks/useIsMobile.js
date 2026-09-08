import { useCallback, useMemo, useSyncExternalStore } from 'react';

const MOBILE_BREAKPOINT = 768;

/**
 * True below the md breakpoint.
 *
 * The sidebar needs this in JS, not just CSS: on mobile it renders as an
 * off-canvas overlay with its own open state rather than collapsing in place.
 *
 * Built on useSyncExternalStore because matchMedia is exactly that - an
 * external store. Reading it in an effect would set state on mount and cause
 * an extra render before the first paint settles.
 */
export function useIsMobile(breakpoint = MOBILE_BREAKPOINT) {
  const query = useMemo(
    () =>
      typeof window === 'undefined' ? null : window.matchMedia(`(max-width: ${breakpoint - 1}px)`),
    [breakpoint]
  );

  const subscribe = useCallback(
    (onChange) => {
      if (!query) return () => {};

      query.addEventListener('change', onChange);
      return () => query.removeEventListener('change', onChange);
    },
    [query]
  );

  const getSnapshot = useCallback(() => query?.matches ?? false, [query]);

  // Server render has no viewport; assume desktop.
  const getServerSnapshot = () => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export default useIsMobile;
