import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Loader from './Loader';

/**
 * Gate for authenticated routes.
 *
 * Renders children (or an <Outlet />) only when a valid session exists,
 * otherwise redirects to the login page, remembering where the user was
 * heading so login can send them back.
 */
export function ProtectedRoute({ children, redirectTo = '/login' }) {
  const { isAuthenticated, isReady } = useAuth();
  const location = useLocation();

  // Wait for the session check so a refresh does not flash the login page.
  if (!isReady) return <Loader variant="fullscreen" message="Checking your session…" />;

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return children ?? <Outlet />;
}

export default ProtectedRoute;
