import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loader } from '../components/common';

/**
 * Wrapper for pages that only make sense signed out.
 *
 * A signed-in user landing on /login is sent to their role's home instead of
 * being shown the form again.
 */
export function PublicRoutes({ children }) {
  const { isAuthenticated, isReady, homePath } = useAuth();

  if (!isReady) return <Loader variant="fullscreen" message="Loading…" />;

  if (isAuthenticated) return <Navigate to={homePath} replace />;

  return children ?? <Outlet />;
}

export default PublicRoutes;
