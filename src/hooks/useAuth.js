import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  login as loginThunk,
  logout as logoutThunk,
  setCredentials,
  setUser as setUserAction,
  clearAuthError,
  selectAuth,
} from '../store/slices/authSlice';
import { getPermissionsForRole } from '../utils/permissions';
import { getHomePathForRole } from '../utils/auth';

/**
 * Access to the authenticated session.
 *
 * Backed by the Redux auth slice - the single source of truth for who is
 * signed in. The shape returned here is unchanged from the Context-based
 * version, so ProtectedRoute, RoleGuard, PublicRoutes and the layouts work
 * exactly as before.
 */
export function useAuth() {
  const dispatch = useDispatch();
  const { user, token, isAuthenticated, loading, error } = useSelector(selectAuth);

  /**
   * Signs in.
   * @param {object} credentials
   * @param {Function} request - the API call, from modules/auth/services
   */
  const signIn = useCallback(
    (credentials, request) => dispatch(loginThunk({ credentials, request })).unwrap(),
    [dispatch]
  );

  const signOut = useCallback((request) => dispatch(logoutThunk({ request })), [dispatch]);

  const setSession = useCallback((session) => dispatch(setCredentials(session)), [dispatch]);
  const setUser = useCallback((next) => dispatch(setUserAction(next)), [dispatch]);
  const clearError = useCallback(() => dispatch(clearAuthError()), [dispatch]);

  const role = user?.role ?? null;

  return useMemo(
    () => ({
      user,
      token,
      role,
      isAuthenticated,
      loading,
      error,
      // Session restoration happens synchronously when the store is created,
      // so there is no bootstrap phase. Kept for the guards' API.
      isReady: true,
      permissions: getPermissionsForRole(role),
      homePath: getHomePathForRole(role),
      signIn,
      signOut,
      setSession,
      setUser,
      clearError,
    }),
    [user, token, role, isAuthenticated, loading, error, signIn, signOut, setSession, setUser, clearError]
  );
}

export default useAuth;
