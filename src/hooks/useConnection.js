import { useEffect, useRef, useSyncExternalStore } from 'react';
import { getServerReachable, subscribeServerReachable } from '../utils/connectivity';

/**
 * The connection, as two live booleans:
 *   online           the device has a network (navigator.onLine)
 *   serverReachable  our API answered the last request (utils/connectivity.js)
 *
 * useSyncExternalStore because both are external stores - reading them in an
 * effect would render once with a stale value first.
 */
const subscribeOnline = (onChange) => {
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);
  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
};
const getOnline = () => (typeof navigator === 'undefined' ? true : navigator.onLine !== false);

export function useOnlineStatus() {
  return useSyncExternalStore(subscribeOnline, getOnline, () => true);
}

export function useServerReachable() {
  return useSyncExternalStore(subscribeServerReachable, getServerReachable, () => true);
}

export function useConnection() {
  return { online: useOnlineStatus(), serverReachable: useServerReachable() };
}

/**
 * For a view showing a load that failed for want of a connection
 * (`waiting`): calls `retry` once, the moment the device is online and the
 * server answering again - so the page fills itself in without a tap.
 */
export function useRetryWhenReconnected(waiting, retry) {
  const { online, serverReachable } = useConnection();
  const canRecover = online && serverReachable;
  const retryRef = useRef(retry);
  const wasWaiting = useRef(false);

  useEffect(() => {
    retryRef.current = retry;
  });

  useEffect(() => {
    if (waiting && !canRecover) {
      wasWaiting.current = true;
      return;
    }
    if (wasWaiting.current && canRecover) {
      wasWaiting.current = false;
      retryRef.current?.();
    }
  }, [waiting, canRecover]);
}

export default useConnection;
