import { USER_ROLES } from '../utils/constants';
import { PERMISSIONS } from '../utils/permissions';
import PublicLayout from '../layouts/PublicLayout';
import SuperAdminLayout from '../layouts/SuperAdminLayout';
import StudentLayout from '../layouts/StudentLayout';
import TeacherLayout from '../layouts/TeacherLayout';
import ParentLayout from '../layouts/ParentLayout';

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
    { path: '/login', label: 'Sign in', element: null },
    { path: '/forgot-password', label: 'Forgot password', element: null },
    { path: '/reset-password', label: 'Reset password', element: null },
    { path: '/verify-email', label: 'Verify email', element: null },
  ],
};

export const SUPER_ADMIN_ROUTES = {
  basePath: '/admin',
  layout: SuperAdminLayout,
  requiresAuth: true,
  allowedRoles: [USER_ROLES.SUPER_ADMIN],
  routes: [
    { path: '', label: 'Dashboard', permissions: [PERMISSIONS.DASHBOARD_READ], element: null },
    { path: 'users', label: 'Users', permissions: [PERMISSIONS.USER_READ], element: null },
    {
      path: 'assignments',
      label: 'Assignments',
      permissions: [PERMISSIONS.ASSIGNMENT_READ],
      element: null,
    },
    { path: 'regulation-toolkit', label: 'Regulation Toolkit', element: null },
    { path: 'rewards', label: 'Rewards', permissions: [PERMISSIONS.REWARD_READ], element: null },
    {
      path: 'subscriptions',
      label: 'Subscriptions',
      permissions: [PERMISSIONS.SUBSCRIPTION_READ],
      element: null,
    },
    { path: 'plans', label: 'Plans & Discounts', element: null },
  ],
};

export const STUDENT_ROUTES = {
  basePath: '/student',
  layout: StudentLayout,
  requiresAuth: true,
  allowedRoles: [USER_ROLES.STUDENT],
  routes: [
    { path: '', label: 'My Day', permissions: [PERMISSIONS.DASHBOARD_READ], element: null },
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
    { path: '', label: 'Dashboard', permissions: [PERMISSIONS.DASHBOARD_READ], element: null },
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
    { path: '', label: 'Overview', permissions: [PERMISSIONS.DASHBOARD_READ], element: null },
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
