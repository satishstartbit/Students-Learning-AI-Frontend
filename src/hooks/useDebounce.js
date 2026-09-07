import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Returns `value` after it has stopped changing for `delay` ms.
 * Used for search inputs so typing does not fire a request per keystroke.
 */
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

/**
 * Debounces a callback rather than a value.
 * The returned function carries a `.cancel()` for pending invocations.
 */
export function useDebouncedCallback(callback, delay = 300) {
  const timerRef = useRef(null);
  const callbackRef = useRef(callback);

  // Keep the latest callback without re-creating the debounced function.
  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return useMemo(() => {
    const debounced = (...args) => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => callbackRef.current(...args), delay);
    };

    debounced.cancel = () => clearTimeout(timerRef.current);
    return debounced;
  }, [delay]);
}

export default useDebounce;
