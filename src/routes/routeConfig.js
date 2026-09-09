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

import MasterDashboardPage from '../modules/masterManagement/pages/MasterDashboardPage';
import MasterListPage from '../modules/masterManagement/pages/MasterListPage';
import MasterFormPage from '../modules/masterManagement/pages/MasterFormPage';
import AcademicYearsListPage from '../modules/masterManagement/pages/academicYears/AcademicYearsListPage';
import AcademicYearFormPage from '../modules/masterManagement/pages/academicYears/AcademicYearFormPage';
import SchoolsListPage from '../modules/masterManagement/pages/schools/SchoolsListPage';
import SchoolFormPage from '../modules/masterManagement/pages/schools/SchoolFormPage';
import RegulationActivitiesListPage from '../modules/masterManagement/pages/regulationActivities/RegulationActivitiesListPage';
import RegulationActivityFormPage from '../modules/masterManagement/pages/regulationActivities/RegulationActivityFormPage';
import RewardActivitiesListPage from '../modules/masterManagement/pages/rewardActivities/RewardActivitiesListPage';
import RewardActivityFormPage from '../modules/masterManagement/pages/rewardActivities/RewardActivityFormPage';
import StudentRewardsListPage from '../modules/masterManagement/pages/studentRewards/StudentRewardsListPage';
import StudentRewardFormPage from '../modules/masterManagement/pages/studentRewards/StudentRewardFormPage';
import SubscriptionPlansListPage from '../modules/masterManagement/pages/subscriptionPlans/SubscriptionPlansListPage';
import SubscriptionPlanFormPage from '../modules/masterManagement/pages/subscriptionPlans/SubscriptionPlanFormPage';
import DiscountCodesListPage from '../modules/masterManagement/pages/discountCodes/DiscountCodesListPage';
import DiscountCodeFormPage from '../modules/masterManagement/pages/discountCodes/DiscountCodeFormPage';
import ThemesListPage from '../modules/masterManagement/pages/themes/ThemesListPage';
import ThemeFormPage from '../modules/masterManagement/pages/themes/ThemeFormPage';
import AvatarsListPage from '../modules/masterManagement/pages/avatars/AvatarsListPage';
import AvatarFormPage from '../modules/masterManagement/pages/avatars/AvatarFormPage';
import StickyNoteStylesListPage from '../modules/masterManagement/pages/stickyNoteStyles/StickyNoteStylesListPage';
import StickyNoteStyleFormPage from '../modules/masterManagement/pages/stickyNoteStyles/StickyNoteStyleFormPage';
import StickersListPage from '../modules/masterManagement/pages/stickers/StickersListPage';
import StickerFormPage from '../modules/masterManagement/pages/stickers/StickerFormPage';

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

    /*
     * Master Management. Dedicated masters get their own fixed-shape
     * list/create/edit trio; everything else is served by the generic
     * master engine's :masterType catch-all, which must be registered last
     * so it never shadows a dedicated path (mirrors the users/:id pattern
     * above).
     */
    { path: 'masters', label: 'Master Management', permissions: [PERMISSIONS.MASTER_READ], component: MasterDashboardPage },

    { path: 'masters/academic-years', label: 'Academic Years', permissions: [PERMISSIONS.MASTER_READ], component: AcademicYearsListPage },
    { path: 'masters/academic-years/create', label: 'Add academic year', permissions: [PERMISSIONS.MASTER_CREATE], component: AcademicYearFormPage },
    { path: 'masters/academic-years/:id/edit', label: 'Edit academic year', permissions: [PERMISSIONS.MASTER_UPDATE], component: AcademicYearFormPage },

    { path: 'masters/schools', label: 'Schools', permissions: [PERMISSIONS.MASTER_READ], component: SchoolsListPage },
    { path: 'masters/schools/create', label: 'Add school', permissions: [PERMISSIONS.MASTER_CREATE], component: SchoolFormPage },
    { path: 'masters/schools/:id/edit', label: 'Edit school', permissions: [PERMISSIONS.MASTER_UPDATE], component: SchoolFormPage },

    { path: 'masters/regulation-activities', label: 'Regulation Activities', permissions: [PERMISSIONS.MASTER_READ], component: RegulationActivitiesListPage },
    { path: 'masters/regulation-activities/create', label: 'Add regulation activity', permissions: [PERMISSIONS.MASTER_CREATE], component: RegulationActivityFormPage },
    { path: 'masters/regulation-activities/:id/edit', label: 'Edit regulation activity', permissions: [PERMISSIONS.MASTER_UPDATE], component: RegulationActivityFormPage },

    { path: 'masters/reward-activities', label: 'Reward Activities', permissions: [PERMISSIONS.MASTER_READ], component: RewardActivitiesListPage },
    { path: 'masters/reward-activities/create', label: 'Add reward activity', permissions: [PERMISSIONS.MASTER_CREATE], component: RewardActivityFormPage },
    { path: 'masters/reward-activities/:id/edit', label: 'Edit reward activity', permissions: [PERMISSIONS.MASTER_UPDATE], component: RewardActivityFormPage },

    { path: 'masters/student-rewards', label: 'Student Rewards', permissions: [PERMISSIONS.MASTER_READ], component: StudentRewardsListPage },
    { path: 'masters/student-rewards/create', label: 'Add reward', permissions: [PERMISSIONS.MASTER_CREATE], component: StudentRewardFormPage },
    { path: 'masters/student-rewards/:id/edit', label: 'Edit reward', permissions: [PERMISSIONS.MASTER_UPDATE], component: StudentRewardFormPage },

    { path: 'masters/subscription-plans', label: 'Subscription Plans', permissions: [PERMISSIONS.MASTER_READ], component: SubscriptionPlansListPage },
    { path: 'masters/subscription-plans/create', label: 'Add plan', permissions: [PERMISSIONS.MASTER_CREATE], component: SubscriptionPlanFormPage },
    { path: 'masters/subscription-plans/:id/edit', label: 'Edit plan', permissions: [PERMISSIONS.MASTER_UPDATE], component: SubscriptionPlanFormPage },

    { path: 'masters/discount-codes', label: 'Discount Codes', permissions: [PERMISSIONS.MASTER_READ], component: DiscountCodesListPage },
    { path: 'masters/discount-codes/create', label: 'Add code', permissions: [PERMISSIONS.MASTER_CREATE], component: DiscountCodeFormPage },
    { path: 'masters/discount-codes/:id/edit', label: 'Edit code', permissions: [PERMISSIONS.MASTER_UPDATE], component: DiscountCodeFormPage },

    { path: 'masters/themes', label: 'Colour Themes', permissions: [PERMISSIONS.MASTER_READ], component: ThemesListPage },
    { path: 'masters/themes/create', label: 'Add theme', permissions: [PERMISSIONS.MASTER_CREATE], component: ThemeFormPage },
    { path: 'masters/themes/:id/edit', label: 'Edit theme', permissions: [PERMISSIONS.MASTER_UPDATE], component: ThemeFormPage },

    { path: 'masters/avatars', label: 'Avatars', permissions: [PERMISSIONS.MASTER_READ], component: AvatarsListPage },
    { path: 'masters/avatars/create', label: 'Add avatar', permissions: [PERMISSIONS.MASTER_CREATE], component: AvatarFormPage },
    { path: 'masters/avatars/:id/edit', label: 'Edit avatar', permissions: [PERMISSIONS.MASTER_UPDATE], component: AvatarFormPage },

    { path: 'masters/sticky-note-styles', label: 'Sticky Note Styles', permissions: [PERMISSIONS.MASTER_READ], component: StickyNoteStylesListPage },
    { path: 'masters/sticky-note-styles/create', label: 'Add style', permissions: [PERMISSIONS.MASTER_CREATE], component: StickyNoteStyleFormPage },
    { path: 'masters/sticky-note-styles/:id/edit', label: 'Edit style', permissions: [PERMISSIONS.MASTER_UPDATE], component: StickyNoteStyleFormPage },

    { path: 'masters/stickers', label: 'Stickers', permissions: [PERMISSIONS.MASTER_READ], component: StickersListPage },
    { path: 'masters/stickers/create', label: 'Add sticker', permissions: [PERMISSIONS.MASTER_CREATE], component: StickerFormPage },
    { path: 'masters/stickers/:id/edit', label: 'Edit sticker', permissions: [PERMISSIONS.MASTER_UPDATE], component: StickerFormPage },

    // Generic master engine catch-all - must stay after every dedicated path above.
    { path: 'masters/:masterType', label: 'Master data', permissions: [PERMISSIONS.MASTER_READ], component: MasterListPage },
    { path: 'masters/:masterType/create', label: 'Add record', permissions: [PERMISSIONS.MASTER_CREATE], component: MasterFormPage },
    { path: 'masters/:masterType/:id/edit', label: 'Edit record', permissions: [PERMISSIONS.MASTER_UPDATE], component: MasterFormPage },
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
