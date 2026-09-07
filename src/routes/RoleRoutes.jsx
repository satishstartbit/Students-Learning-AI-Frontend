import { Outlet } from 'react-router-dom';
import { RoleGuard } from '../components/common';

/**
 * Restricts a nested route area to specific roles (and optionally
 * permissions), then renders that area inside its role layout.
 *
 * This is what keeps the four areas separate: a student who navigates to
 * /admin/... fails the guard and is redirected to their own home.
 */
export function RoleRoutes({ allowedRoles = [], requiredPermissions = [], layout: Layout, children }) {
  const content = children ?? <Outlet />;

  return (
    <RoleGuard allowedRoles={allowedRoles} requiredPermissions={requiredPermissions}>
      {Layout ? <Layout>{content}</Layout> : content}
    </RoleGuard>
  );
}

export default RoleRoutes;
