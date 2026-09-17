import { useCallback, useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import {
  LuBell,
  LuCalendarDays,
  LuFileText,
  LuMessageCircle,
  LuPalette,
  LuSettings,
  LuSparkles,
  LuSun,
  LuTimer,
  LuTrophy,
} from 'react-icons/lu';
import { useApi } from '../hooks/useApi';
import { getMe } from '../modules/auth/services/auth.service';
import { TodayCheckInProvider } from '../modules/checkIn/components/TodayCheckInProvider';
import { KidLockedScreen } from '../modules/student/components/kid/KidLockedScreen';
import { StudentExperienceContext } from '../modules/student/hooks/useStudentExperience';
import StudentLockedScreen from '../modules/subscription/components/StudentLockedScreen';
import { SubscriptionAccessContext, useAccessStatus } from '../modules/subscription/hooks/useSubscriptionAccess';
import { isJuniorGrade } from '../utils/gradeBand';
import AuthenticatedLayout from './AuthenticatedLayout';
import KidLayout from './KidLayout';

/**
 * Navigation for the student area (/student/*) - Grade 6 and up. K-5 nav
 * lives in modules/student/components/kid/kidNav.js.
 *
 * Two groups: the primary "My learning" set, then a visually separate second
 * section (Notifications / Make it yours / Settings) above the account tile
 * - AppSidebar.jsx already renders each `{ group, items }` entry as its own
 * SidebarGroup, so this is a data change only.
 */
const NAV_ITEMS = [
  {
    group: 'My learning',
    items: [
      { to: '/student', label: 'Home', icon: LuSun, end: true },
      { to: '/student/calendar', label: 'Plan', icon: LuCalendarDays },
      { to: '/student/assignments', label: 'Assignments', icon: LuFileText },
      { to: '/student/check-in', label: 'Check In', icon: LuMessageCircle },
      { to: '/student/assistant', label: 'AI Assistant', icon: LuSparkles },
      { to: '/student/focus', label: 'Focus', icon: LuTimer },
      { to: '/student/rewards', label: 'Rewards', icon: LuTrophy },
    ],
  },
  {
    group: null,
    items: [
      { to: '/student/notifications', label: 'Notifications', icon: LuBell },
      { to: '/student/make-it-yours', label: 'Make it yours', icon: LuPalette },
      { to: '/student/settings', label: 'Settings', icon: LuSettings },
    ],
  },
];

/**
 * Reachable before onboarding is finished: the questionnaire itself, and
 * Settings - where a K-5 student on a shared device finds Log out.
 */
const ONBOARDING_EXEMPT_PATHS = ['/student/onboarding', '/student/settings'];

/** Shown only while the student's grade is being looked up - usually a blink. */
function StudentShellLoading() {
  return (
    <div role="status" className="grid h-svh place-items-center">
      <span className="size-10 animate-spin rounded-full border-4 border-(--color-border-default) border-t-(--accent-base)" />
      <span className="sr-only">Loading</span>
    </div>
  );
}

/**
 * The student area's shell, chosen by grade band:
 *
 *   Kindergarten-Grade 5  KidLayout - the K-5 "My Learning Space" experience
 *   Grade 6+ / unknown    AuthenticatedLayout - the standard student UI
 *
 * The grade lives on the student profile, which the login response doesn't
 * carry, so it's read once from GET /auth/me. The shell waits for it rather
 * than flashing the wrong layout first; if the lookup fails, the student
 * gets the standard layout. Pages read the result via useStudentExperience().
 *
 * Three gates live here as well, checked in this order:
 *   - subscription: while no parent linked to the student has a subscription
 *     in force, every page shows the locked screen instead (the API refuses
 *     the same requests - this just explains why).
 *   - onboarding: until the first-login questionnaire is done, every page
 *     except the questionnaire and Settings redirects to it (area-wide, so
 *     it's decided once, here).
 *   - check-in: TodayCheckInProvider loads today's check-in for the whole
 *     area; individual work routes enforce it with RequireCheckIn.
 */
export function StudentLayout({ children }) {
  const location = useLocation();
  const me = useApi(getMe, { immediate: true });
  const { run: runMe } = me;
  const accessStatus = useAccessStatus();

  const profile = me.data?.user?.profile ?? null;
  const grade = profile?.grade ?? null;
  const isJunior = isJuniorGrade(grade);
  const onboarded = Boolean(profile?.onboarding_completed_at);

  const refreshProfile = useCallback(() => runMe().catch(() => {}), [runMe]);

  const experience = useMemo(
    () => ({ isJunior, grade, profile, onboarded, refreshProfile }),
    [isJunior, grade, profile, onboarded, refreshProfile]
  );

  const { loaded, isLoading: accessLoading, hasAccess, reason, refresh } = accessStatus;
  const access = useMemo(
    () => ({ loaded, isLoading: accessLoading, hasAccess, reason, refresh }),
    [loaded, accessLoading, hasAccess, reason, refresh]
  );

  // Only the first lookups block - a later refresh keeps the page mounted.
  if ((me.isLoading && !me.data) || access.isLoading) return <StudentShellLoading />;

  const locked = access.loaded && !access.hasAccess;
  // If the profile couldn't be loaded we can't tell - don't trap the student.
  const needsOnboarding =
    !locked && Boolean(me.data) && !onboarded && !ONBOARDING_EXEMPT_PATHS.includes(location.pathname);

  let content = children;
  if (locked) content = isJunior ? <KidLockedScreen /> : <StudentLockedScreen />;
  else if (needsOnboarding) content = <Navigate to="/student/onboarding" replace />;

  const shell = isJunior ? (
    <KidLayout>{content}</KidLayout>
  ) : (
    <AuthenticatedLayout navItems={NAV_ITEMS} title="My Learning" subtitle="Student" brand="ML">
      {content}
    </AuthenticatedLayout>
  );
  

  return (
    <StudentExperienceContext.Provider value={experience}>
      <SubscriptionAccessContext.Provider value={access}>
        {/* A locked student can't reach any work screen, so there's no check-in to load. */}
        {locked ? shell : <TodayCheckInProvider>{shell}</TodayCheckInProvider>}
      </SubscriptionAccessContext.Provider>
    </StudentExperienceContext.Provider>
  );
}

export default StudentLayout;
