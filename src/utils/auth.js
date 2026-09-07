import { USER_ROLES, ROLE_HOME_PATH } from './constants';
import {
  getAccessToken,
  getStoredUser,
  setStoredUser,
  setTokens,
  clearAuthStorage,
} from './storage';

/**
 * Auth state helpers.
 *
 * These read the persisted session only - they perform no network calls.
 * API calls belong in module services; React state belongs in useAuth.
 */

/** Decodes a JWT payload without verifying it (the server is the authority). */
export function decodeToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    return JSON.parse(decodeURIComponent(escape(window.atob(padded))));
  } catch {
    return null;
  }
}

export function isTokenExpired(token, skewSeconds = 30) {
  const payload = decodeToken(token);
  if (!payload?.exp) return true;
  return payload.exp * 1000 <= Date.now() + skewSeconds * 1000;
}

export const getCurrentUser = () => getStoredUser();

export function getCurrentRole() {
  const user = getCurrentUser();
  if (user?.role) return user.role;
  return decodeToken(getAccessToken())?.role ?? null;
}

/** True when a token exists and has not expired. */
export function isAuthenticated() {
  const token = getAccessToken();
  return Boolean(token) && !isTokenExpired(token);
}

export const hasRole = (...roles) => roles.flat().includes(getCurrentRole());

export const isSuperAdmin = () => getCurrentRole() === USER_ROLES.SUPER_ADMIN;
export const isStudent = () => getCurrentRole() === USER_ROLES.STUDENT;
export const isTeacher = () => getCurrentRole() === USER_ROLES.TEACHER;
export const isParent = () => getCurrentRole() === USER_ROLES.PARENT;

/** Where a signed-in user should land. */
export function getHomePathForRole(role = getCurrentRole()) {
  return ROLE_HOME_PATH[role] ?? '/';
}

/** Persists a successful login response. */
export function persistSession({ user, accessToken, refreshToken }) {
  setTokens({ accessToken, refreshToken });
  if (user) setStoredUser(user);
  return user;
}

export function logout() {
  clearAuthStorage();
}

export default {
  decodeToken,
  isTokenExpired,
  getCurrentUser,
  getCurrentRole,
  isAuthenticated,
  hasRole,
  getHomePathForRole,
  persistSession,
  logout,
};
