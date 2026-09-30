import { lazy } from 'react';
import { USER_ROLES } from '../utils/constants';
import { PERMISSIONS } from '../utils/permissions';
import PublicLayout from '../layouts/PublicLayout';
import SuperAdminLayout from '../layouts/SuperAdminLayout';
import StudentLayout from '../layouts/StudentLayout';
import TeacherLayout from '../layouts/TeacherLayout';
import ParentLayout from '../layouts/ParentLayout';

// import InvitationEmailPage from '../modules/superAdmin/pages/InvitationEmailPage';

import RequireCheckIn from '../modules/checkIn/components/RequireCheckIn';

// Pages load on demand, one chunk per page (AppRoutes wraps each in Suspense).
const LoginPage = lazy(() => import('../modules/auth/pages/LoginPage'));
const AdminLoginPage = lazy(() => import('../modules/auth/pages/AdminLoginPage'));
const RegisterPage = lazy(() => import('../modules/auth/pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../modules/auth/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../modules/auth/pages/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('../modules/auth/pages/VerifyEmailPage'));
const TeacherInvitationPage = lazy(() => import('../modules/invitations/pages/TeacherInvitationPage'));
const AdminDashboardPage = lazy(() => import('../modules/superAdmin/pages/AdminDashboardPage'));
const UsersListPage = lazy(() => import('../modules/superAdmin/pages/UsersListPage'));
const CreateUserPage = lazy(() => import('../modules/superAdmin/pages/CreateUserPage'));
const UserDetailPage = lazy(() => import('../modules/superAdmin/pages/UserDetailPage'));
const EditUserPage = lazy(() => import('../modules/superAdmin/pages/EditUserPage'));
const RelationshipsPage = lazy(() => import('../modules/superAdmin/pages/RelationshipsPage'));
const TeacherInvitationsAdminPage = lazy(() => import('../modules/superAdmin/pages/TeacherInvitationsAdminPage'));
const TeacherConnectionsPage = lazy(() => import('../modules/superAdmin/pages/TeacherConnectionsPage'));
const AdminProfilePage = lazy(() => import('../modules/superAdmin/pages/AdminProfilePage'));
const PlatformSettingsPage = lazy(() => import('../modules/platform/pages/PlatformSettingsPage'));
const PlatformSettingPage = lazy(() => import('../modules/platform/pages/PlatformSettingPage'));
const SystemStatusPage = lazy(() => import('../modules/platform/pages/SystemStatusPage'));
const AiUsagePage = lazy(() => import('../modules/platform/pages/AiUsagePage'));
const ParentChildrenPage = lazy(() => import('../modules/parent/pages/ParentChildrenPage'));
const ParentProfilePage = lazy(() => import('../modules/parent/pages/ParentProfilePage'));
const ParentProgressPage = lazy(() => import('../modules/parent/pages/ParentProgressPage'));
const ParentDashboardPage = lazy(() => import('../modules/parent/pages/ParentDashboardPage'));
const StudentOnboardingPage = lazy(() => import('../modules/onboarding/pages/StudentOnboardingPage'));
const ParentOnboardingPage = lazy(() => import('../modules/onboarding/pages/ParentOnboardingPage'));
const CheckInPage = lazy(() => import('../modules/checkIn/pages/CheckInPage'));
const TeacherDashboardPage = lazy(() => import('../modules/teacher/pages/TeacherDashboardPage'));
const MyStudentsPage = lazy(() => import('../modules/teacher/pages/MyStudentsPage'));
const TeacherStudentPage = lazy(() => import('../modules/teacher/pages/TeacherStudentPage'));
const AssignmentsListPage = lazy(() => import('../modules/teacher/pages/AssignmentsListPage'));
const AssignmentFormPage = lazy(() => import('../modules/teacher/pages/AssignmentFormPage'));
const AssignmentDetailsPage = lazy(() => import('../modules/teacher/pages/AssignmentDetailsPage'));
const TeacherProfilePage = lazy(() => import('../modules/teacher/pages/TeacherProfilePage'));
const TeacherProgressPage = lazy(() => import('../modules/teacher/pages/TeacherProgressPage'));
const TeacherInvitationsPage = lazy(() => import('../modules/teacher/pages/TeacherInvitationsPage'));
const SharedWorkPage = lazy(() => import('../modules/teacher/pages/SharedWorkPage'));
const MyAssignmentsPage = lazy(() => import('../modules/student/pages/MyAssignmentsPage'));
const StudentAssignmentDetailPage = lazy(() => import('../modules/student/pages/AssignmentDetailPage'));
const StudentHomePage = lazy(() => import('../modules/student/pages/StudentHomePage'));
const StudentPlanPage = lazy(() => import('../modules/student/pages/StudentPlanPage'));
const FocusTimerPage = lazy(() => import('../modules/student/pages/FocusTimerPage'));
const BrainBoostersPage = lazy(() => import('../modules/student/pages/BrainBoostersPage'));
const RewardsPage = lazy(() => import('../modules/student/pages/RewardsPage'));
const NotificationsPage = lazy(() => import('../modules/student/pages/NotificationsPage'));
const MakeItYoursPage = lazy(() => import('../modules/student/pages/MakeItYoursPage'));
const StudentSettingsPage = lazy(() => import('../modules/student/pages/StudentSettingsPage'));
const StudentHelpPage = lazy(() => import('../modules/student/pages/StudentHelpPage'));
const GradeBandPage = lazy(() => import('../modules/student/pages/GradeBandPage'));
const KidHomePage = lazy(() => import('../modules/student/pages/kid/KidHomePage'));
const KidMyWeekPage = lazy(() => import('../modules/student/pages/kid/KidMyWeekPage'));
const KidFocusPage = lazy(() => import('../modules/student/pages/kid/KidFocusPage'));
const KidFocusActivityPage = lazy(() => import('../modules/student/pages/kid/KidFocusActivityPage'));
const KidAssignmentsPage = lazy(() => import('../modules/student/pages/kid/KidAssignmentsPage'));
const KidMakeItYoursPage = lazy(() => import('../modules/student/pages/kid/KidMakeItYoursPage'));
const KidSettingsPage = lazy(() => import('../modules/student/pages/kid/KidSettingsPage'));
const KidRewardsPage = lazy(() => import('../modules/student/pages/kid/KidRewardsPage'));
const KidCheckInPage = lazy(() => import('../modules/student/pages/kid/KidCheckInPage'));
const KidOnboardingPage = lazy(() => import('../modules/student/pages/kid/KidOnboardingPage'));
const ParentStudyTimesPage = lazy(() => import('../modules/planner/pages/StudyTimesPage').then((m) => ({ default: m.ParentStudyTimesPage })));
const StudentStudyTimesPage = lazy(() => import('../modules/planner/pages/StudyTimesPage').then((m) => ({ default: m.StudentStudyTimesPage })));
const ParentSchedulePage = lazy(() => import('../modules/planner/pages/ParentSchedulePage'));
const AssistantHomePage = lazy(() => import('../modules/aiAssistant/pages/AssistantHomePage'));
const LearningSessionPage = lazy(() => import('../modules/aiAssistant/pages/LearningSessionPage'));
const LearningHistoryPage = lazy(() => import('../modules/aiAssistant/pages/LearningHistoryPage'));
const TeacherLearningActivityPage = lazy(() => import('../modules/aiAssistant/pages/TeacherLearningActivityPage'));
const ParentLearningSummaryPage = lazy(() => import('../modules/aiAssistant/pages/ParentLearningSummaryPage'));
const MasterDashboardPage = lazy(() => import('../modules/masterManagement/pages/MasterDashboardPage'));
const MasterListPage = lazy(() => import('../modules/masterManagement/pages/MasterListPage'));
const MasterFormPage = lazy(() => import('../modules/masterManagement/pages/MasterFormPage'));
const AcademicYearsListPage = lazy(() => import('../modules/masterManagement/pages/academicYears/AcademicYearsListPage'));
const AcademicYearFormPage = lazy(() => import('../modules/masterManagement/pages/academicYears/AcademicYearFormPage'));
const SchoolsListPage = lazy(() => import('../modules/masterManagement/pages/schools/SchoolsListPage'));
const SchoolFormPage = lazy(() => import('../modules/masterManagement/pages/schools/SchoolFormPage'));
const TaskTypesListPage = lazy(() => import('../modules/masterManagement/pages/curriculum/TaskTypesListPage'));
const TaskTypeFormPage = lazy(() => import('../modules/masterManagement/pages/curriculum/TaskTypeFormPage'));
const QuestionTypesListPage = lazy(() => import('../modules/masterManagement/pages/curriculum/QuestionTypesListPage'));
const QuestionTypeFormPage = lazy(() => import('../modules/masterManagement/pages/curriculum/QuestionTypeFormPage'));
const CurriculumSubjectsListPage = lazy(() => import('../modules/masterManagement/pages/curriculum/CurriculumSubjectsListPage'));
const CurriculumSubjectFormPage = lazy(() => import('../modules/masterManagement/pages/curriculum/CurriculumSubjectFormPage'));
const TopicsListPage = lazy(() => import('../modules/masterManagement/pages/curriculum/TopicsListPage'));
const TopicFormPage = lazy(() => import('../modules/masterManagement/pages/curriculum/TopicFormPage'));
const AudioTracksListPage = lazy(() => import('../modules/masterManagement/pages/curriculum/AudioTracksListPage'));
const AudioTrackFormPage = lazy(() => import('../modules/masterManagement/pages/curriculum/AudioTrackFormPage'));
const RegulationActivitiesListPage = lazy(() => import('../modules/masterManagement/pages/regulationActivities/RegulationActivitiesListPage'));
const RegulationActivityFormPage = lazy(() => import('../modules/masterManagement/pages/regulationActivities/RegulationActivityFormPage'));
const RewardActivitiesListPage = lazy(() => import('../modules/masterManagement/pages/rewardActivities/RewardActivitiesListPage'));
const RewardActivityFormPage = lazy(() => import('../modules/masterManagement/pages/rewardActivities/RewardActivityFormPage'));
const StudentRewardsListPage = lazy(() => import('../modules/masterManagement/pages/studentRewards/StudentRewardsListPage'));
const StudentRewardFormPage = lazy(() => import('../modules/masterManagement/pages/studentRewards/StudentRewardFormPage'));
const SubscriptionPlansListPage = lazy(() => import('../modules/masterManagement/pages/subscriptionPlans/SubscriptionPlansListPage'));
const SubscriptionPlanFormPage = lazy(() => import('../modules/masterManagement/pages/subscriptionPlans/SubscriptionPlanFormPage'));
const DiscountCodesListPage = lazy(() => import('../modules/masterManagement/pages/discountCodes/DiscountCodesListPage'));
const DiscountCodeFormPage = lazy(() => import('../modules/masterManagement/pages/discountCodes/DiscountCodeFormPage'));
const ThemesListPage = lazy(() => import('../modules/masterManagement/pages/themes/ThemesListPage'));
const ThemeFormPage = lazy(() => import('../modules/masterManagement/pages/themes/ThemeFormPage'));
const AvatarsListPage = lazy(() => import('../modules/masterManagement/pages/avatars/AvatarsListPage'));
const AvatarFormPage = lazy(() => import('../modules/masterManagement/pages/avatars/AvatarFormPage'));
const StickyNoteStylesListPage = lazy(() => import('../modules/masterManagement/pages/stickyNoteStyles/StickyNoteStylesListPage'));
const StickyNoteStyleFormPage = lazy(() => import('../modules/masterManagement/pages/stickyNoteStyles/StickyNoteStyleFormPage'));
const StickersListPage = lazy(() => import('../modules/masterManagement/pages/stickers/StickersListPage'));
const StickerFormPage = lazy(() => import('../modules/masterManagement/pages/stickers/StickerFormPage'));
const AdminSubscriptionsPage = lazy(() => import('../modules/subscription/pages/admin/AdminSubscriptionsPage'));
const AdminPaymentsPage = lazy(() => import('../modules/subscription/pages/admin/AdminPaymentsPage'));
const AdminRevenuePage = lazy(() => import('../modules/subscription/pages/admin/AdminRevenuePage'));
const AdminCouponRedemptionsPage = lazy(() => import('../modules/subscription/pages/admin/AdminCouponRedemptionsPage'));
const ParentSubscriptionPage = lazy(() => import('../modules/subscription/pages/ParentSubscriptionPage'));
const CheckoutPage = lazy(() => import('../modules/subscription/pages/CheckoutPage'));

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
    // fullPage: draws its own split hero layout instead of PublicLayout's column.
    { path: '/login', label: 'Sign in', component: LoginPage, fullPage: true },
    // Separate page AND separate API endpoint - only SUPER_ADMIN is admitted.
    { path: '/admin/login', label: 'Admin sign in', component: AdminLoginPage },
    { path: '/register', label: 'Create account', component: RegisterPage, fullPage: true },
    { path: '/forgot-password', label: 'Forgot password', component: ForgotPasswordPage, fullPage: true },
    { path: '/reset-password', label: 'Reset password', component: ResetPasswordPage, fullPage: true },
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
    // The Super Admin's own account (account menu > Account).
    { path: 'profile', label: 'My Profile', permissions: [PERMISSIONS.PROFILE_READ], component: AdminProfilePage },
    // Business policies changed without a release (modules/platform).
    { path: 'settings', label: 'Platform settings', component: PlatformSettingsPage },
    { path: 'settings/:key', label: 'Platform setting', component: PlatformSettingPage },
    { path: 'system', label: 'System status', component: SystemStatusPage },
    { path: 'ai-usage', label: 'AI usage', component: AiUsagePage },
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

    /*
     * Create pages, one per role Super Admin can add (utils/constants
     * ROLE_CREATE_PATH). One component, `role` fixes the form. The old combined
     * page redirects to the teacher form, which was its default role.
     */
    {
      path: 'users/teachers/create',
      label: 'Create teacher',
      permissions: [PERMISSIONS.USER_CREATE],
      component: CreateUserPage,
      props: { role: USER_ROLES.TEACHER },
    },
    {
      path: 'users/parents/create',
      label: 'Create parent',
      permissions: [PERMISSIONS.USER_CREATE],
      component: CreateUserPage,
      props: { role: USER_ROLES.PARENT },
    },
    { path: 'users/create', label: 'Create user', redirectTo: '/admin/users/teachers/create' },
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
    {
      // Assisted create / edit / move / approve / remove, each with a
      // recorded reason - for when a family needs help, not the normal path.
      path: 'relationships/connections',
      label: 'Teacher connections',
      permissions: [PERMISSIONS.USER_READ],
      component: TeacherConnectionsPage,
    },
    // Hidden for now - the client-written invitation is edited in
    // services/email/copy/teacher-invitation.txt (backend) instead. Uncomment
    // this and the import above (and the nav item in SuperAdminLayout) to
    // bring the in-app editor back.
    // {
    //   path: 'relationships/invitation-email',
    //   label: 'Invitation email',
    //   permissions: [PERMISSIONS.USER_UPDATE],
    //   component: InvitationEmailPage,
    // },

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
   * Every screen where work starts carries `guards: [RequireCheckIn]`, which
   * holds only the kid band: no work before today's check-in for K-5, while
   * an older student is let straight through and checks in when they choose.
   * Which grades that covers is KIDS_UI/VITE_KIDS_UI - see
   * modules/checkIn/components/RequireCheckIn.jsx and utils/gradeBand.js.
   * Home, Check In, Rewards, Settings and Onboarding stay open to everyone.
   * (Onboarding itself is gated area-wide in the layout.)
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
    // When the student can study and when they're busy (the planner's inputs).
    { path: 'study-times', label: 'Study times', component: StudentStudyTimesPage },
    {
      path: 'brain-boosters',
      label: 'Brain Boosters',
      component: BrainBoostersPage,
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
    { path: 'students/:id', label: 'Student', permissions: [PERMISSIONS.USER_READ], component: TeacherStudentPage },
    // Parents' invitations to connect with their child - accept or decline.
    { path: 'invitations', label: 'Invitations', component: TeacherInvitationsPage },
    // Students' own work shared with this teacher on purpose (PDF Q15).
    { path: 'shared-work', label: 'Shared with me', component: SharedWorkPage },
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
      component: ParentDashboardPage,
    },
    { path: 'dashboard', label: 'Overview', redirectTo: '/parent' },
    { path: 'onboarding', label: 'Onboarding', component: ParentOnboardingPage },
    {
      // "My Children": children, teachers, plan usage and the family's parents.
      path: 'children',
      label: 'My Children',
      permissions: [PERMISSIONS.USER_READ],
      component: ParentChildrenPage,
    },
    // The old Family Members page is now part of My Children.
    { path: 'family', label: 'My Children', redirectTo: '/parent/children' },
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
      // The viewing child's plan, all their work (every source) and adding work for them.
      path: 'schedule',
      label: 'Schedule',
      permissions: [PERMISSIONS.PROGRESS_READ],
      component: ParentSchedulePage,
    },
    {
      path: 'schedule/study-times',
      label: 'Study times',
      permissions: [PERMISSIONS.PROGRESS_READ],
      component: ParentStudyTimesPage,
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
