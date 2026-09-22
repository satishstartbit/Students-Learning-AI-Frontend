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
import TeacherInvitationPage from '../modules/invitations/pages/TeacherInvitationPage';

import AdminDashboardPage from '../modules/superAdmin/pages/AdminDashboardPage';
import UsersListPage from '../modules/superAdmin/pages/UsersListPage';
import CreateUserPage from '../modules/superAdmin/pages/CreateUserPage';
import UserDetailPage from '../modules/superAdmin/pages/UserDetailPage';
import EditUserPage from '../modules/superAdmin/pages/EditUserPage';
import RelationshipsPage from '../modules/superAdmin/pages/RelationshipsPage';
import TeacherInvitationsAdminPage from '../modules/superAdmin/pages/TeacherInvitationsAdminPage';

import ParentChildrenPage from '../modules/parent/pages/ParentChildrenPage';
import ParentProfilePage from '../modules/parent/pages/ParentProfilePage';
import ParentProgressPage from '../modules/parent/pages/ParentProgressPage';

import StudentOnboardingPage from '../modules/onboarding/pages/StudentOnboardingPage';
import ParentOnboardingPage from '../modules/onboarding/pages/ParentOnboardingPage';
import CheckInPage from '../modules/checkIn/pages/CheckInPage';
import RequireCheckIn from '../modules/checkIn/components/RequireCheckIn';

import TeacherDashboardPage from '../modules/teacher/pages/TeacherDashboardPage';
import MyStudentsPage from '../modules/teacher/pages/MyStudentsPage';
import AssignmentsListPage from '../modules/teacher/pages/AssignmentsListPage';
import AssignmentFormPage from '../modules/teacher/pages/AssignmentFormPage';
import AssignmentDetailsPage from '../modules/teacher/pages/AssignmentDetailsPage';
import TeacherProfilePage from '../modules/teacher/pages/TeacherProfilePage';
import TeacherProgressPage from '../modules/teacher/pages/TeacherProgressPage';
import TeacherInvitationsPage from '../modules/teacher/pages/TeacherInvitationsPage';

import MyAssignmentsPage from '../modules/student/pages/MyAssignmentsPage';
import StudentAssignmentDetailPage from '../modules/student/pages/AssignmentDetailPage';
import StudentHomePage from '../modules/student/pages/StudentHomePage';
import StudentPlanPage from '../modules/student/pages/StudentPlanPage';
import FocusTimerPage from '../modules/student/pages/FocusTimerPage';
import RewardsPage from '../modules/student/pages/RewardsPage';
import NotificationsPage from '../modules/student/pages/NotificationsPage';
import MakeItYoursPage from '../modules/student/pages/MakeItYoursPage';
import StudentSettingsPage from '../modules/student/pages/StudentSettingsPage';
import StudentHelpPage from '../modules/student/pages/StudentHelpPage';
import GradeBandPage from '../modules/student/pages/GradeBandPage';
import KidHomePage from '../modules/student/pages/kid/KidHomePage';
import KidMyWeekPage from '../modules/student/pages/kid/KidMyWeekPage';
import KidFocusPage from '../modules/student/pages/kid/KidFocusPage';
import KidFocusActivityPage from '../modules/student/pages/kid/KidFocusActivityPage';
import KidAssignmentsPage from '../modules/student/pages/kid/KidAssignmentsPage';
import KidMakeItYoursPage from '../modules/student/pages/kid/KidMakeItYoursPage';
import KidSettingsPage from '../modules/student/pages/kid/KidSettingsPage';
import KidRewardsPage from '../modules/student/pages/kid/KidRewardsPage';
import KidCheckInPage from '../modules/student/pages/kid/KidCheckInPage';
import KidOnboardingPage from '../modules/student/pages/kid/KidOnboardingPage';

import AssistantHomePage from '../modules/aiAssistant/pages/AssistantHomePage';
import LearningSessionPage from '../modules/aiAssistant/pages/LearningSessionPage';
import LearningHistoryPage from '../modules/aiAssistant/pages/LearningHistoryPage';
import TeacherLearningActivityPage from '../modules/aiAssistant/pages/TeacherLearningActivityPage';
import ParentLearningSummaryPage from '../modules/aiAssistant/pages/ParentLearningSummaryPage';

import MasterDashboardPage from '../modules/masterManagement/pages/MasterDashboardPage';
import MasterListPage from '../modules/masterManagement/pages/MasterListPage';
import MasterFormPage from '../modules/masterManagement/pages/MasterFormPage';
import AcademicYearsListPage from '../modules/masterManagement/pages/academicYears/AcademicYearsListPage';
import AcademicYearFormPage from '../modules/masterManagement/pages/academicYears/AcademicYearFormPage';
import SchoolsListPage from '../modules/masterManagement/pages/schools/SchoolsListPage';
import SchoolFormPage from '../modules/masterManagement/pages/schools/SchoolFormPage';
import TaskTypesListPage from '../modules/masterManagement/pages/curriculum/TaskTypesListPage';
import TaskTypeFormPage from '../modules/masterManagement/pages/curriculum/TaskTypeFormPage';
import QuestionTypesListPage from '../modules/masterManagement/pages/curriculum/QuestionTypesListPage';
import QuestionTypeFormPage from '../modules/masterManagement/pages/curriculum/QuestionTypeFormPage';
import CurriculumSubjectsListPage from '../modules/masterManagement/pages/curriculum/CurriculumSubjectsListPage';
import CurriculumSubjectFormPage from '../modules/masterManagement/pages/curriculum/CurriculumSubjectFormPage';
import TopicsListPage from '../modules/masterManagement/pages/curriculum/TopicsListPage';
import TopicFormPage from '../modules/masterManagement/pages/curriculum/TopicFormPage';
import AudioTracksListPage from '../modules/masterManagement/pages/curriculum/AudioTracksListPage';
import AudioTrackFormPage from '../modules/masterManagement/pages/curriculum/AudioTrackFormPage';
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

import AdminSubscriptionsPage from '../modules/subscription/pages/admin/AdminSubscriptionsPage';
import AdminPaymentsPage from '../modules/subscription/pages/admin/AdminPaymentsPage';
import AdminRevenuePage from '../modules/subscription/pages/admin/AdminRevenuePage';
import AdminCouponRedemptionsPage from '../modules/subscription/pages/admin/AdminCouponRedemptionsPage';
import ParentSubscriptionPage from '../modules/subscription/pages/ParentSubscriptionPage';
import CheckoutPage from '../modules/subscription/pages/CheckoutPage';

/**
 * The single definition of the app's routes.
 *
 * Path, layout, authentication requirement and allowed roles live here - never
 * inside a page. AppRoutes reads this and wraps each area in the right guards,
 * so authorisation logic is written once.
 *
 * `element` is filled in per route as each Phase 1 module is built; until then
 * AppRoutes renders a placeholder so the guards are still exercisable.
 *
 * `guards` wraps a route's page in extra route-level checks, outermost first -
 * e.g. RequireCheckIn on every student screen where work starts.
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

/**
 * Pages in the public shell that must work whether or not someone is signed
 * in - unlike PUBLIC_ROUTES, a signed-in visitor is NOT sent to their home.
 * A teacher opening a parent's invitation link may be signed in already (then
 * accepts right there) or not have an account at all.
 */
export const OPEN_ROUTES = {
  layout: PublicLayout,
  requiresAuth: false,
  routes: [{ path: '/invitations/teacher/:token', label: 'Teacher invitation', component: TeacherInvitationPage }],
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
    {
      // Oversight of parent -> teacher invitations (the primary linking path).
      path: 'relationships/invitations',
      label: 'Teacher invitations',
      permissions: [PERMISSIONS.USER_READ],
      component: TeacherInvitationsAdminPage,
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
    { path: 'masters/discount-codes/:id/redemptions', label: 'Code redemptions', permissions: [PERMISSIONS.SUBSCRIPTION_MANAGE], component: AdminCouponRedemptionsPage },

    /*
     * Billing oversight. Plans and discount codes are edited in Master
     * Management above; these are the operational views over what parents
     * actually bought, paid and were refunded.
     */
    { path: 'subscriptions', label: 'Subscriptions', permissions: [PERMISSIONS.SUBSCRIPTION_MANAGE], component: AdminSubscriptionsPage },
    { path: 'subscriptions/payments', label: 'Payments & Refunds', permissions: [PERMISSIONS.SUBSCRIPTION_MANAGE], component: AdminPaymentsPage },
    { path: 'subscriptions/revenue', label: 'Revenue', permissions: [PERMISSIONS.SUBSCRIPTION_MANAGE], component: AdminRevenuePage },

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

    // Curriculum & Task Setup. `curriculum-subjects`, not `subjects` - that path is the generic Subjects master.
    { path: 'masters/task-types', label: 'Task Types', permissions: [PERMISSIONS.MASTER_READ], component: TaskTypesListPage },
    { path: 'masters/task-types/create', label: 'Add task type', permissions: [PERMISSIONS.MASTER_CREATE], component: TaskTypeFormPage },
    { path: 'masters/task-types/:id/edit', label: 'Edit task type', permissions: [PERMISSIONS.MASTER_UPDATE], component: TaskTypeFormPage },
    { path: 'masters/curriculum-subjects', label: 'Curriculum Subjects', permissions: [PERMISSIONS.MASTER_READ], component: CurriculumSubjectsListPage },
    { path: 'masters/curriculum-subjects/create', label: 'Add subject', permissions: [PERMISSIONS.MASTER_CREATE], component: CurriculumSubjectFormPage },
    { path: 'masters/curriculum-subjects/:id/edit', label: 'Edit subject', permissions: [PERMISSIONS.MASTER_UPDATE], component: CurriculumSubjectFormPage },
    { path: 'masters/topics', label: 'Topics', permissions: [PERMISSIONS.MASTER_READ], component: TopicsListPage },
    { path: 'masters/topics/create', label: 'Add topic', permissions: [PERMISSIONS.MASTER_CREATE], component: TopicFormPage },
    { path: 'masters/topics/:id/edit', label: 'Edit topic', permissions: [PERMISSIONS.MASTER_UPDATE], component: TopicFormPage },
    { path: 'masters/audio-tracks', label: 'Background Audio', permissions: [PERMISSIONS.MASTER_READ], component: AudioTracksListPage },
    { path: 'masters/audio-tracks/create', label: 'Add sound', permissions: [PERMISSIONS.MASTER_CREATE], component: AudioTrackFormPage },
    { path: 'masters/audio-tracks/:id/edit', label: 'Edit sound', permissions: [PERMISSIONS.MASTER_UPDATE], component: AudioTrackFormPage },
    { path: 'masters/question-types', label: 'Question Types', permissions: [PERMISSIONS.MASTER_READ], component: QuestionTypesListPage },
    { path: 'masters/question-types/create', label: 'Add question type', permissions: [PERMISSIONS.MASTER_CREATE], component: QuestionTypeFormPage },
    { path: 'masters/question-types/:id/edit', label: 'Edit question type', permissions: [PERMISSIONS.MASTER_UPDATE], component: QuestionTypeFormPage },

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
  /*
   * K-5 students (Kindergarten-Grade 5) get the "My Learning Space" pages;
   * everyone else keeps the standard ones. GradeBandPage picks per route -
   * `junior` for K-5, `standard` (or the placeholder) for Grade 6+. See
   * layouts/StudentLayout.jsx for how the grade band is decided.
   *
   * Every screen where work starts carries `guards: [RequireCheckIn]` - no
   * work before today's check-in. Home, Check In, Rewards, Settings and
   * Onboarding stay open. (Onboarding itself is gated area-wide in the layout.)
   */
  routes: [
    {
      path: '',
      label: 'My Day',
      permissions: [PERMISSIONS.DASHBOARD_READ],
      component: GradeBandPage,
      props: { junior: KidHomePage, standard: StudentHomePage },
    },
    { path: 'dashboard', label: 'My Day', redirectTo: '/student' },
    {
      path: 'onboarding',
      label: 'Onboarding',
      component: GradeBandPage,
      props: { junior: KidOnboardingPage, standard: StudentOnboardingPage },
    },
    {
      path: 'check-in',
      label: 'Check In',
      permissions: [PERMISSIONS.CHECKIN_CREATE],
      component: GradeBandPage,
      props: { junior: KidCheckInPage, standard: CheckInPage },
    },
    {
      path: 'assignments',
      label: 'Assignments',
      permissions: [PERMISSIONS.ASSIGNMENT_READ],
      component: GradeBandPage,
      props: { junior: KidAssignmentsPage, standard: MyAssignmentsPage },
      guards: [RequireCheckIn],
    },
    {
      path: 'assignments/:assignmentId',
      label: 'Assignment',
      permissions: [PERMISSIONS.ASSIGNMENT_READ],
      component: StudentAssignmentDetailPage,
      guards: [RequireCheckIn],
    },
    /*
     * AI Learning Assistant. `assistant/history` is declared before
     * `assistant/:sessionId` so the static path is never swallowed by the
     * param route.
     */
    {
      path: 'assistant',
      label: 'AI Assistant',
      permissions: [PERMISSIONS.AI_ASSISTANT_USE],
      component: AssistantHomePage,
      guards: [RequireCheckIn],
    },
    {
      path: 'assistant/history',
      label: 'Learning History',
      permissions: [PERMISSIONS.AI_ASSISTANT_USE],
      component: LearningHistoryPage,
      guards: [RequireCheckIn],
    },
    {
      path: 'assistant/:sessionId',
      label: 'Learning Session',
      permissions: [PERMISSIONS.AI_ASSISTANT_USE],
      component: LearningSessionPage,
      guards: [RequireCheckIn],
    },
    {
      path: 'calendar',
      label: 'My Week',
      component: GradeBandPage,
      props: { junior: KidMyWeekPage, standard: StudentPlanPage },
      guards: [RequireCheckIn],
    },
    {
      path: 'focus',
      label: 'Focus',
      permissions: [PERMISSIONS.FOCUS_READ],
      component: GradeBandPage,
      props: { junior: KidFocusPage, standard: FocusTimerPage },
      guards: [RequireCheckIn],
    },
    {
      // K-5 only - the Breathe/Wiggle/Listen tiles on KidFocusPage each open
      // here. Grade 6+ has no matching screen (their Regulation Toolkit
      // shows tool detail inline), so send them back to Focus instead.
      path: 'focus/:activityKey',
      label: 'Focus Activity',
      permissions: [PERMISSIONS.FOCUS_READ],
      component: GradeBandPage,
      props: { junior: KidFocusActivityPage, standardRedirect: '/student/focus' },
      guards: [RequireCheckIn],
    },
    {
      path: 'rewards',
      label: 'Rewards',
      permissions: [PERMISSIONS.REWARD_READ],
      component: GradeBandPage,
      props: { junior: KidRewardsPage, standard: RewardsPage },
    },
    // K-5: calm mode + log out; Grade 6+: learning profile (from the account menu).
    {
      path: 'settings',
      label: 'Settings',
      component: GradeBandPage,
      props: { junior: KidSettingsPage, standard: StudentSettingsPage },
    },
    // Grade 6+ "Help and how-to" (linked from Settings); K-5 goes back to its own Settings.
    {
      path: 'help',
      label: 'Help and how-to',
      component: GradeBandPage,
      props: { junior: KidSettingsPage, standard: StudentHelpPage },
    },
    // Grade 6+ only - not part of K-5's nav (kidNav.js). "Make it yours"
    // below is the exception: both bands have it, with a page each.
    {
      path: 'notifications',
      label: 'Notifications',
      permissions: [PERMISSIONS.NOTIFICATION_READ],
      component: NotificationsPage,
    },
    {
      path: 'make-it-yours',
      label: 'Make it yours',
      component: GradeBandPage,
      props: { junior: KidMakeItYoursPage, standard: MakeItYoursPage },
    },
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
      component: TeacherDashboardPage,
    },
    { path: 'dashboard', label: 'Dashboard', redirectTo: '/teacher' },
    { path: 'students', label: 'Students', permissions: [PERMISSIONS.USER_READ], component: MyStudentsPage },
    // Parents' invitations to connect with their child - accept or decline.
    { path: 'invitations', label: 'Invitations', component: TeacherInvitationsPage },
    {
      path: 'assignments',
      label: 'Assignments',
      permissions: [PERMISSIONS.ASSIGNMENT_READ],
      component: AssignmentsListPage,
    },
    {
      path: 'assignments/new',
      label: 'New Assignment',
      permissions: [PERMISSIONS.ASSIGNMENT_CREATE],
      component: AssignmentFormPage,
    },
    {
      path: 'assignments/:id',
      label: 'Assignment Details',
      permissions: [PERMISSIONS.ASSIGNMENT_READ],
      component: AssignmentDetailsPage,
    },
    {
      path: 'assignments/:id/edit',
      label: 'Edit Assignment',
      permissions: [PERMISSIONS.ASSIGNMENT_UPDATE],
      component: AssignmentFormPage,
    },
    {
      path: 'progress',
      label: 'Progress',
      permissions: [PERMISSIONS.PROGRESS_READ],
      component: TeacherProgressPage,
    },
    {
      path: 'learning-activity',
      label: 'Learning Activity',
      permissions: [PERMISSIONS.AI_ACTIVITY_READ],
      component: TeacherLearningActivityPage,
    },
    {
      path: 'profile',
      label: 'My Profile',
      permissions: [PERMISSIONS.PROFILE_READ],
      component: TeacherProfilePage,
    },
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
    { path: 'onboarding', label: 'Onboarding', component: ParentOnboardingPage },
    {
      path: 'children',
      label: 'My Children',
      permissions: [PERMISSIONS.USER_READ],
      component: ParentChildrenPage,
    },
    {
      path: 'profile',
      label: 'My Profile',
      permissions: [PERMISSIONS.PROFILE_READ],
      component: ParentProfilePage,
    },
    {
      path: 'progress',
      label: 'Progress',
      permissions: [PERMISSIONS.PROGRESS_READ],
      component: ParentProgressPage,
    },
    {
      path: 'learning-summary',
      label: 'Learning Summary',
      permissions: [PERMISSIONS.LEARNING_SUMMARY_READ],
      component: ParentLearningSummaryPage,
    },
    {
      path: 'subscription',
      label: 'Subscription',
      permissions: [PERMISSIONS.SUBSCRIPTION_READ],
      component: ParentSubscriptionPage,
    },
    {
      path: 'subscription/checkout',
      label: 'Payment',
      permissions: [PERMISSIONS.SUBSCRIPTION_CREATE],
      component: CheckoutPage,
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
  OPEN_ROUTES,
  ROLE_ROUTE_GROUPS,
  SUPER_ADMIN_ROUTES,
  STUDENT_ROUTES,
  TEACHER_ROUTES,
  PARENT_ROUTES,
};
