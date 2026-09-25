import { Navigate, Route, Routes } from 'react-router-dom';
import PublicRoutes from './PublicRoutes';
import ProtectedRoutes from './ProtectedRoutes';
import RoleRoutes from './RoleRoutes';
import RoutePlaceholder from './RoutePlaceholder';
import { OPEN_ROUTES, PUBLIC_ROUTES, ROLE_ROUTE_GROUPS } from './routeConfig';
import { useAuth } from '../hooks/useAuth';
import { EmptyState, RoleGuard } from '../components/common';

/**
 * Builds the router from routeConfig.
 *
 * Every protected area is wrapped as:
 *   ProtectedRoutes (is there a session?)
 *     └── RoleRoutes (does this role own the area?)
 *           └── role layout
 *                 └── RoleGuard (does this route's permission apply?)
 *                       └── page
 *
 * so no page performs its own authorisation check. The client guards decide
 * what renders; the API re-checks every request independently.
 */

/** Sends a signed-in user to their own home, and everyone else to login. */
function RootRedirect() {
  const { isAuthenticated, homePath } = useAuth();
  return <Navigate to={isAuthenticated ? homePath : '/login'} replace />;
}

/**
 * Resolves one config entry into the element the router should render.
 *
 * `props` lets several routes share one page component with different
 * settings - the user list is reused for the per-role submenus rather than
 * being copied three times.
 */
function renderRouteElement(route) {
  if (route.redirectTo) return <Navigate to={route.redirectTo} replace />;

  const Component = route.component;
  const content = Component ? (
    <Component {...(route.props ?? {})} />
  ) : (
    route.element ?? <RoutePlaceholder label={route.label} />
  );

  // Route-level guards (e.g. RequireCheckIn), outermost first.
  const page = (route.guards ?? []).reduceRight((child, Guard) => <Guard>{child}</Guard>, content);

  // A route may narrow access further than its area's role gate.
  if (route.permissions?.length) {
    return <RoleGuard requiredPermissions={route.permissions}>{page}</RoleGuard>;
  }

  return page;
}

export function AppRoutes() {
  const PublicLayout = PUBLIC_ROUTES.layout;
  const OpenLayout = OPEN_ROUTES.layout;

  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      {/* ---------------------------------------------------------- public */}
      <Route
        element={
          <PublicRoutes>
            <PublicLayout />
          </PublicRoutes>
        }
      >
        {PUBLIC_ROUTES.routes
          .filter((route) => !route.fullPage)
          .map((route) => (
            <Route key={route.path} path={route.path} element={renderRouteElement(route)} />
          ))}
      </Route>

      {/* Public pages that draw the whole screen themselves (the sign-in page's
          split hero layout) - same signed-in redirect, no centred column. */}
      <Route element={<PublicRoutes />}>
        {PUBLIC_ROUTES.routes
          .filter((route) => route.fullPage)
          .map((route) => (
            <Route key={route.path} path={route.path} element={renderRouteElement(route)} />
          ))}
      </Route>

      {/* ------------------------------------------ open (signed in or out) */}
      <Route element={<OpenLayout />}>
        {OPEN_ROUTES.routes.map((route) => (
          <Route key={route.path} path={route.path} element={renderRouteElement(route)} />
        ))}
      </Route>

      {/* ------------------------------------------------------- protected */}
      <Route element={<ProtectedRoutes />}>
        {ROLE_ROUTE_GROUPS.map((group) => (
          <Route
            key={group.basePath}
            path={group.basePath}
            element={<RoleRoutes allowedRoles={group.allowedRoles} layout={group.layout} />}
          >
            {group.routes.map((route) => (
              <Route
                key={route.path || 'index'}
                index={route.path === ''}
                path={route.path === '' ? undefined : route.path}
                element={renderRouteElement(route)}
              />
            ))}
          </Route>
        ))}
      </Route>

      {/* ------------------------------------------------------- not found */}
      <Route
        path="*"
        element={
          <EmptyState
            icon="🧭"
            title="Page not found"
            description="The page you were looking for does not exist."
          />
        }
      />
    </Routes>
  );
}

export default AppRoutes;
