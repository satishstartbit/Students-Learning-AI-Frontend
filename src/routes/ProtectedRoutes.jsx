import { Outlet } from 'react-router-dom';
import { ProtectedRoute } from '../components/common';

/**
 * Requires a valid session for everything nested beneath it.
 *
 * Kept separate from RoleRoutes so the two concerns compose:
 * authentication first, then role/permission authorisation.
 */
export function ProtectedRoutes({ children }) {
  return <ProtectedRoute>{children ?? <Outlet />}</ProtectedRoute>;
}

export default ProtectedRoutes;
