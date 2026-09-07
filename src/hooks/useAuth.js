import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  getCurrentUser,
  getCurrentRole,
  isAuthenticated as checkAuthenticated,
  persistSession,
  logout as clearSession,
  getHomePathForRole,
} from '../utils/auth';
import { getPermissionsForRole } from '../utils/permissions';
import { setSessionExpiredHandler } from '../utils/apiClient';

/**
 * Shares the authenticated session across the tree.
 *
 * Deliberately transport-free: it stores and exposes session state. The actual
 * login/logout HTTP calls live in modules/auth/services and are handed in.
 */
const AuthContext = createContext(null);

/**
 * Reads the persisted session once, on first render.
 *
 * Restoring from storage is synchronous, so there is no loading phase to
 * model - a stored user whose token has already expired is discarded here
 * rather than in an effect.
 */
function readStoredSession() {
  if (checkAuthenticated()) return getCurrentUser();
  clearSession();
  return null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredSession);

  const signOut = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  /** Accepts the payload of a successful login response. */
  const signIn = useCallback((session) => setUser(persistSession(session)), []);

  // A refresh failure inside the API client ends the session here too.
  useEffect(() => {
    setSessionExpiredHandler(() => setUser(null));
    return () => setSessionExpiredHandler(null);
  }, []);

  const value = useMemo(() => {
    const role = user?.role ?? getCurrentRole();

    return {
      user,
      role,
      // Session restoration is synchronous; guards keep the flag for symmetry.
      isReady: true,
      isAuthenticated: Boolean(user) && checkAuthenticated(),
      permissions: getPermissionsForRole(role),
      homePath: getHomePathForRole(role),
      signIn,
      signOut,
      setUser,
    };
  }, [user, signIn, signOut]);

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside an <AuthProvider>');
  return context;
}

export default useAuth;
