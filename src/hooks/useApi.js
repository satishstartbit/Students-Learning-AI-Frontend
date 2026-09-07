import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../utils/errorHandler';

/**
 * Runs an async request function and tracks { data, meta, error, isLoading }.
 *
 * The request function comes from a module service - this hook performs no
 * HTTP of its own, so components stay free of API details.
 *
 *   const { data, isLoading, error, run } = useApi(assignmentService.list);
 */
export function useApi(requestFn, { immediate = false, initialData = null, args = [] } = {}) {
  const [data, setData] = useState(initialData);
  const [meta, setMeta] = useState({});
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(immediate));

  const mountedRef = useRef(true);
  const requestRef = useRef(requestFn);

  // Ignore results that arrive after unmount or after a newer call.
  const callIdRef = useRef(0);

  // Track the latest request function without changing `run`'s identity.
  useEffect(() => {
    requestRef.current = requestFn;
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const run = useCallback(async (...callArgs) => {
    const callId = ++callIdRef.current;

    setIsLoading(true);
    setError(null);

    try {
      const result = await requestRef.current(...callArgs);
      if (!mountedRef.current || callId !== callIdRef.current) return undefined;

      setData(result?.data ?? result ?? null);
      setMeta(result?.meta ?? {});
      return result;
    } catch (err) {
      if (!mountedRef.current || callId !== callIdRef.current) return undefined;
      setError({ ...err, message: getErrorMessage(err) });
      throw err;
    } finally {
      if (mountedRef.current && callId === callIdRef.current) setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(initialData);
    setMeta({});
    setError(null);
    setIsLoading(false);
  }, [initialData]);

  const immediateArgsKey = JSON.stringify(args);

  useEffect(() => {
    if (!immediate) return;

    // Fetch-on-mount necessarily moves this hook into its loading state from
    // an effect. `isLoading` is already seeded to true when immediate is set,
    // so this is a single transition, not a cascade.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    run(...args).catch(() => {
      /* surfaced through `error` */
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, immediateArgsKey, run]);

  return { data, meta, error, isLoading, run, reset, setData };
}

export default useApi;
