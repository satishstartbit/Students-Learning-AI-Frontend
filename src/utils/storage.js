import { STORAGE_KEYS } from './constants';

/**
 * Safe wrappers around Web Storage.
 *
 * Every access is guarded: private-mode browsers and blocked site data throw
 * on read/write, and callers should never have to care.
 */
function safeParse(raw, fallback = null) {
  if (raw === null || raw === undefined) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function createStorage(getStore) {
  return {
    get(key, fallback = null) {
      try {
        return safeParse(getStore().getItem(key), fallback);
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        getStore().setItem(key, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    },
    remove(key) {
      try {
        getStore().removeItem(key);
        return true;
      } catch {
        return false;
      }
    },
    clear() {
      try {
        getStore().clear();
        return true;
      } catch {
        return false;
      }
    },
  };
}

export const local = createStorage(() => window.localStorage);
export const session = createStorage(() => window.sessionStorage);

// --- Token storage ---------------------------------------------------------

export const getAccessToken = () => local.get(STORAGE_KEYS.ACCESS_TOKEN);
export const setAccessToken = (token) => local.set(STORAGE_KEYS.ACCESS_TOKEN, token);
export const getRefreshToken = () => local.get(STORAGE_KEYS.REFRESH_TOKEN);
export const setRefreshToken = (token) => local.set(STORAGE_KEYS.REFRESH_TOKEN, token);

export function setTokens({ accessToken, refreshToken }) {
  if (accessToken) setAccessToken(accessToken);
  if (refreshToken) setRefreshToken(refreshToken);
}

export function clearTokens() {
  local.remove(STORAGE_KEYS.ACCESS_TOKEN);
  local.remove(STORAGE_KEYS.REFRESH_TOKEN);
}

// --- User storage ----------------------------------------------------------

export const getStoredUser = () => local.get(STORAGE_KEYS.USER);
export const setStoredUser = (user) => local.set(STORAGE_KEYS.USER, user);
export const clearStoredUser = () => local.remove(STORAGE_KEYS.USER);

/** Clears every auth artefact. Used by logout and on an unrecoverable 401. */
export function clearAuthStorage() {
  clearTokens();
  clearStoredUser();
}

export default { local, session };
