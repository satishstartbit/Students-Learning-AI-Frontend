import { USER_ROLES } from '../utils/constants';
import { PERMISSIONS } from '../utils/permissions';
import PublicLayout from '../layouts/PublicLayout';
import SuperAdminLayout from '../layouts/SuperAdminLayout';
import StudentLayout from '../layouts/StudentLayout';
import TeacherLayout from '../layouts/TeacherLayout';
import ParentLayout from '../layouts/ParentLayout';

import LoginPage from '../modules/auth/pages/LoginPage';
import AdminLoginPage from '../modules/auth/pages/AdminLoginPage';
import RegisterPage from '../modules/auth/pages/RegisterPage';
import ForgotPasswordPage from '../modules/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from '../modules/auth/pages/ResetPasswordPage';
import VerifyEmailPage from '../modules/auth/pages/VerifyEmailPage';

import AdminDashboardPage from '../modules/superAdmin/pages/AdminDashboardPage';
import UsersListPage from '../modules/superAdmin/pages/UsersListPage';
import CreateUserPage from '../modules/superAdmin/pages/CreateUserPage';
import UserDetailPage from '../modules/superAdmin/pages/UserDetailPage';
import EditUserPage from '../modules/superAdmin/pages/EditUserPage';
import RelationshipsPage from '../modules/superAdmin/pages/RelationshipsPage';

/**
 * The single definition of the app's routes.
 *
 * Path, layout, authentication requirement and allowed roles live here - never
 * inside a page. AppRoutes reads this and wraps each area in the right guards,
 * so authorisation logic is written once.
 *
 * `element` is filled in per route as each Phase 1 module is built; until then
 * AppRoutes renders a placeholder so the guards are still exercisable.
 */

export const PUBLIC_ROUTES = {
  layout: PublicLayout,
  requiresAuth: false,
  routes: [
    { path: '/login', label: 'Sign in', component: LoginPage },
    // Separate page AND separate API endpoint - only SUPER_ADMIN is admitted.
    { path: '/admin/login', label: 'Admin sign in', component: AdminLoginPage },
    { path: '/register', label: 'Create account', component: RegisterPage },
    { path: '/forgot-password', label: 'Forgot password', component: ForgotPasswordPage },
    { path: '/reset-password', label: 'Reset password', component: ResetPasswordPage },
    { path: '/verify-email', label: 'Verify email', component: VerifyEmailPage },
  ],
};

export const SUPER_ADMIN_ROUTES = {
  basePath: '/admin',
  layout: SuperAdminLayout,
  requiresAuth: true,
  allowedRoles: [USER_ROLES.SUPER_ADMIN],
  routes: [
    // Login lands on /admin itself; /admin/dashboard is kept as an alias.
    {
      path: '',
      label: 'Dashboard',
      permissions: [PERMISSIONS.DASHBOARD_READ],
      component: AdminDashboardPage,
    },
    { path: 'dashboard', label: 'Dashboard', redirectTo: '/admin' },
    /*
     * There is no combined user list - the console is organised by role.
     * The bare path only forwards, so an old bookmark does not dead-end.
     */
    { path: 'users', label: 'Users', redirectTo: '/admin/users/students' },

    /*
     * Per-role views. One page component, three routes - `fixedRole` locks the
     * listing to that role and hides the role filter, rather than duplicating
     * the screen. Static paths outrank `users/:id`, so these never collide
     * with a user detail route.
     */
    {
      path: 'users/students',
      label: 'Students',
      permissions: [PERMISSIONS.USER_READ],
      component: UsersListPage,
      props: { fixedRole: USER_ROLES.STUDENT },
    },
    {
      path: 'users/parents',
      label: 'Parents',
      permissions: [PERMISSIONS.USER_READ],
      component: UsersListPage,
      props: { fixedRole: USER_ROLES.PARENT },
    },
    {
      path: 'users/teachers',
      label: 'Teachers',
      permissions: [PERMISSIONS.USER_READ],
      component: UsersListPage,
      props: { fixedRole: USER_ROLES.TEACHER },
    },

    {
      path: 'users/create',
      label: 'Create user',
      permissions: [PERMISSIONS.USER_CREATE],
      component: CreateUserPage,
    },
    {
      path: 'users/:id',
      label: 'User details',
      permissions: [PERMISSIONS.USER_READ],
      component: UserDetailPage,
    },
    {
      path: 'users/:id/edit',
      label: 'Edit user',
      permissions: [PERMISSIONS.USER_UPDATE],
      component: EditUserPage,
    },
    {
      path: 'relationships',
      label: 'Relationships',
      permissions: [PERMISSIONS.USER_READ],
      component: RelationshipsPage,
    },
  ],
};

export const STUDENT_ROUTES = {
  basePath: '/student',
  layout: StudentLayout,
  requiresAuth: true,
  allowedRoles: [USER_ROLES.STUDENT],
  routes: [
    { path: '', label: 'My Day', permissions: [PERMISSIONS.DASHBOARD_READ], element: null },
    { path: 'dashboard', label: 'My Day', redirectTo: '/student' },
    { path: 'onboarding', label: 'Onboarding', element: null },
    { path: 'check-in', label: 'Check In', permissions: [PERMISSIONS.CHECKIN_CREATE], element: null },
    {
      path: 'assignments',
      label: 'Assignments',
      permissions: [PERMISSIONS.ASSIGNMENT_READ],
      element: null,
    },
    { path: 'assignments/:assignmentId', label: 'Assignment', element: null },
    { path: 'calendar', label: 'Planner', element: null },
    { path: 'focus', label: 'Focus', element: null },
    { path: 'toolkit', label: 'Toolkit', element: null },
    { path: 'rewards', label: 'Rewards', permissions: [PERMISSIONS.REWARD_READ], element: null },
  ],
};

export const TEACHER_ROUTES = {
  basePath: '/teacher',
  layout: TeacherLayout,
  requiresAuth: true,
  allowedRoles: [USER_ROLES.TEACHER],
  routes: [
    {
      path: '',
      label: 'Dashboard',
      permissions: [PERMISSIONS.DASHBOARD_READ],
      element: null,
    },
    { path: 'dashboard', label: 'Dashboard', redirectTo: '/teacher' },
    { path: 'students', label: 'Students', permissions: [PERMISSIONS.USER_READ], element: null },
    {
      path: 'assignments',
      label: 'Assignments',
      permissions: [PERMISSIONS.ASSIGNMENT_READ],
      element: null,
    },
    {
      path: 'assignments/new',
      label: 'New Assignment',
      permissions: [PERMISSIONS.ASSIGNMENT_CREATE],
      element: null,
    },
    { path: 'progress', label: 'Progress', permissions: [PERMISSIONS.PROGRESS_READ], element: null },
  ],
};

export const PARENT_ROUTES = {
  basePath: '/parent',
  layout: ParentLayout,
  requiresAuth: true,
  allowedRoles: [USER_ROLES.PARENT],
  routes: [
    {
      path: '',
      label: 'Overview',
      permissions: [PERMISSIONS.DASHBOARD_READ],
      element: null,
    },
    { path: 'dashboard', label: 'Overview', redirectTo: '/parent' },
    { path: 'onboarding', label: 'Onboarding', element: null },
    { path: 'children', label: 'My Children', permissions: [PERMISSIONS.USER_READ], element: null },
    { path: 'progress', label: 'Progress', permissions: [PERMISSIONS.PROGRESS_READ], element: null },
    {
      path: 'subscription',
      label: 'Subscription',
      permissions: [PERMISSIONS.SUBSCRIPTION_READ],
      element: null,
    },
    {
      path: 'notifications',
      label: 'Notifications',
      permissions: [PERMISSIONS.NOTIFICATION_READ],
      element: null,
    },
  ],
};

/** Every role-scoped area, in the order AppRoutes registers them. */
export const ROLE_ROUTE_GROUPS = [
  SUPER_ADMIN_ROUTES,
  STUDENT_ROUTES,
  TEACHER_ROUTES,
  PARENT_ROUTES,
];

export default {
  PUBLIC_ROUTES,
  ROLE_ROUTE_GROUPS,
  SUPER_ADMIN_ROUTES,
  STUDENT_ROUTES,
  TEACHER_ROUTES,
  PARENT_ROUTES,
};
