import {
  LuActivity,
  LuChartLine,
  LuFileText,
  LuHandshake,
  LuHouse,
  LuLayoutDashboard,
  LuListChecks,
  LuMailOpen,
  LuSparkles,
  LuUser,
  LuUsers,
} from 'react-icons/lu';
import { useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { getMe } from '../modules/auth/services/auth.service';
import AppSettingsProvider from '../components/appearance/AppSettingsProvider';
import SubjectColorsProvider from '../components/subjects/SubjectColorsProvider';
import AuthenticatedLayout from './AuthenticatedLayout';
import usePortalTheme from './usePortalTheme';

/** Navigation for the teacher area (/teacher/*). */
const NAV_ITEMS = [
  {
    group: 'Teaching',
    items: [
      { to: '/teacher', label: 'Dashboard', icon: LuLayoutDashboard, end: true },
      { to: '/teacher/students', label: 'Students', icon: LuUsers },
      // Parents' invitations to connect with their child (accept / decline).
      { to: '/teacher/invitations', label: 'Invitations', icon: LuMailOpen },
      { to: '/teacher/assignments', label: 'Assignments', icon: LuFileText },
      { to: '/teacher/shared-work', label: 'Shared with me', icon: LuHandshake },
      { to: '/teacher/progress', label: 'Progress', icon: LuChartLine },
      { to: '/teacher/learning-activity', label: 'Learning Activity', icon: LuSparkles },
      { to: '/teacher/profile', label: 'My Profile', icon: LuUser },
    ],
  },
];

/**
 * The phone tab bar (the My Students mobile mockup). Invitations and My
 * Profile are one tap away in the avatar's "More" sheet.
 */
const MOBILE_TABS = [
  { to: '/teacher', label: 'Home', icon: LuHouse, end: true },
  { to: '/teacher/students', label: 'Students', icon: LuUsers },
  { to: '/teacher/assignments', label: 'Work', icon: LuListChecks },
  { to: '/teacher/progress', label: 'Progress', icon: LuChartLine },
  { to: '/teacher/learning-activity', label: 'Activity', icon: LuActivity },
];

export function TeacherLayout({ children }) {
  usePortalTheme();

  // The account tile shows the teacher's school under their name. Re-read
  // when My Profile saves, so a changed school shows straight away.
  const me = useApi(getMe, { immediate: true });
  const { run: runMe } = me;
  useEffect(() => {
    const onUpdated = () => runMe().catch(() => {});
    window.addEventListener('profile:updated', onUpdated);
    return () => window.removeEventListener('profile:updated', onUpdated);
  }, [runMe]);
  const school = me.data?.user?.profile?.profile_data?.school || undefined;

  return (
    // The teacher's own colour theme and light/dark, applied for as long as
    // they are in this area - the same picker and the same stored setting the
    // student and parent areas use (components/appearance/).
    <AppSettingsProvider>
      {/* The admin's subject colours, so a subject looks the same to teachers as to their students. */}
      <SubjectColorsProvider>
        <AuthenticatedLayout navItems={NAV_ITEMS} mobileTabs={MOBILE_TABS} title="Teacher Portal" subtitle="Teacher" brand="TP" accountSubtitle={school}>
          {children}
        </AuthenticatedLayout>
      </SubjectColorsProvider>
    </AppSettingsProvider>
  );
}

export default TeacherLayout;
