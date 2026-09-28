/**
 * Is our server answering? A tiny store that utils/apiClient.js updates on
 * every request (any HTTP answer = reachable, no answer while the device is
 * online = unreachable), read through hooks/useConnection.js by the
 * connection banner and the status views. Whether the device itself is
 * online comes from the browser (navigator.onLine + online/offline events).
 */
let serverReachable = true;
const listeners = new Set();

export function setServerReachable(value) {
  const next = Boolean(value);
  if (serverReachable === next) return;
  serverReachable = next;
  listeners.forEach((listener) => listener());
}

export const getServerReachable = () => serverReachable;

export function subscribeServerReachable(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
