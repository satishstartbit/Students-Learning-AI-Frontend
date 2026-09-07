import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Loader from './Loader';

/**
 * Gate for role- and permission-restricted routes.
 *
 * This is the only place route authorisation is expressed on the client, so
 * pages never test roles themselves. A user who reaches a route their role
 * does not own is sent to their own home rather than shown an error, which
 * keeps `/admin/*`, `/teacher/*`, `/parent/*` and `/student/*` separate.
 *
 * The server re-checks every request - this only controls what is rendered.
 */
export function RoleGuard({
  allowedRoles = [],
  requiredPermissions = [],
  children,
  fallback,
  redirectTo,
}) {
  const { role, permissions, isReady, isAuthenticated, homePath } = useAuth();

  if (!isReady) return <Loader variant="fullscreen" message="Checking your access…" />;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const roleAllowed = allowedRoles.length === 0 || allowedRoles.includes(role);

  const permissionsAllowed =
    requiredPermissions.length === 0 || requiredPermissions.every((p) => permissions.includes(p));

  if (!roleAllowed || !permissionsAllowed) {
    if (fallback) return fallback;
    return <Navigate to={redirectTo ?? homePath ?? '/'} replace />;
  }

  return children ?? <Outlet />;
}

export default RoleGuard;
