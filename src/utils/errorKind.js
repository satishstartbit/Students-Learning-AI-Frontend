/**
 * What kind of failure an error is, so every screen can show the right view
 * (components/status/StatusView) instead of one generic "Something went
 * wrong":
 *
 *   offline      the device has no internet
 *   unreachable  online, but the request never got an answer (server down,
 *                wrong address, blocked)
 *   timeout      the server didn't answer in time
 *   maintenance  503 - the service is being updated
 *   server       any other 5xx - a fault on our side
 *   notFound     404 - the thing asked for doesn't exist (or isn't yours)
 *   forbidden    403 - not allowed
 *   generic      anything else (validation, conflicts, ...), shown with the
 *                caller's own title and the server's message
 *
 * Takes the normalised error from utils/errorHandler#parseApiError, a raw
 * axios error, or nothing at all (then only the connection is judged).
 * Pure - `online` is passed in so tests don't need a browser.
 */
export const ERROR_KINDS = Object.freeze({
  OFFLINE: 'offline',
  UNREACHABLE: 'unreachable',
  TIMEOUT: 'timeout',
  MAINTENANCE: 'maintenance',
  SERVER: 'server',
  NOT_FOUND: 'notFound',
  FORBIDDEN: 'forbidden',
  GENERIC: 'generic',
});

/** navigator.onLine where there is one; assume online elsewhere (tests, SSR). */
export const isBrowserOnline = () => (typeof navigator === 'undefined' || typeof navigator.onLine !== 'boolean' ? true : navigator.onLine);

export function classifyError(error, { online = isBrowserOnline() } = {}) {
  if (!online) return ERROR_KINDS.OFFLINE;
  if (!error) return ERROR_KINDS.GENERIC;

  if (error.isTimeout || error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') return ERROR_KINDS.TIMEOUT;
  if (error.isNetworkError || (!error.response && error.request && !('status' in error))) return ERROR_KINDS.UNREACHABLE;

  const status = Number(error.status ?? error.response?.status ?? 0);
  if (status === 503) return ERROR_KINDS.MAINTENANCE;
  if (status >= 500) return ERROR_KINDS.SERVER;
  if (status === 404) return ERROR_KINDS.NOT_FOUND;
  if (status === 403) return ERROR_KINDS.FORBIDDEN;
  return ERROR_KINDS.GENERIC;
}

/** The kinds a "Try again" can fix without the user changing anything. */
export const isRetryableKind = (kind) =>
  [ERROR_KINDS.OFFLINE, ERROR_KINDS.UNREACHABLE, ERROR_KINDS.TIMEOUT, ERROR_KINDS.MAINTENANCE, ERROR_KINDS.SERVER, ERROR_KINDS.GENERIC].includes(kind);
