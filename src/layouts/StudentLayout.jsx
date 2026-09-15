import { useMemo } from 'react';
import {
  LuCalendarDays,
  LuFileText,
  LuMessageCircle,
  LuSparkles,
  LuSun,
  LuTimer,
  LuTrophy,
} from 'react-icons/lu';
import { useApi } from '../hooks/useApi';
import { getMe } from '../modules/auth/services/auth.service';
import { StudentExperienceContext } from '../modules/student/hooks/useStudentExperience';
import { isJuniorGrade } from '../utils/gradeBand';
import AuthenticatedLayout from './AuthenticatedLayout';
import KidLayout from './KidLayout';

/** Navigation for the student area (/student/*) - Grade 6 and up. K-5 nav lives in modules/student/components/kid/kidNav.js. */
const NAV_ITEMS = [
  {
    group: 'My learning',
    items: [
      { to: '/student', label: 'My Day', icon: LuSun, end: true },
      { to: '/student/check-in', label: 'Check In', icon: LuMessageCircle },
      { to: '/student/assignments', label: 'Assignments', icon: LuFileText },
      { to: '/student/assistant', label: 'AI Assistant', icon: LuSparkles },
      { to: '/student/calendar', label: 'Plan', icon: LuCalendarDays },
      { to: '/student/focus', label: 'Focus', icon: LuTimer },
      { to: '/student/rewards', label: 'Rewards', icon: LuTrophy },
    ],
  },
];

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
 */
export function StudentLayout({ children }) {
  const me = useApi(getMe, { immediate: true });
  const profile = me.data?.user?.profile ?? null;
  const grade = profile?.grade ?? null;
  const isJunior = isJuniorGrade(grade);

  const experience = useMemo(() => ({ isJunior, grade, profile }), [isJunior, grade, profile]);

  if (me.isLoading) return <StudentShellLoading />;

  return (
    <StudentExperienceContext.Provider value={experience}>
      {isJunior ? (
        <KidLayout>{children}</KidLayout>
      ) : (
        <AuthenticatedLayout navItems={NAV_ITEMS} title="My Learning" subtitle="Student" brand="ML">
          {children}
        </AuthenticatedLayout>
      )}
    </StudentExperienceContext.Provider>
  );
}

export default StudentLayout;
