import {
  LuChartLine,
  LuFileText,
  LuLayoutDashboard,
  LuMailOpen,
  LuSparkles,
  LuUser,
  LuUsers,
} from 'react-icons/lu';
import { useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { getMe } from '../modules/auth/services/auth.service';
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
      { to: '/teacher/progress', label: 'Progress', icon: LuChartLine },
      { to: '/teacher/learning-activity', label: 'Learning Activity', icon: LuSparkles },
      { to: '/teacher/profile', label: 'My Profile', icon: LuUser },
    ],
  },
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
    <AuthenticatedLayout navItems={NAV_ITEMS} title="Teacher Portal" subtitle="Teacher" brand="TP" accountSubtitle={school}>
      {children}
    </AuthenticatedLayout>
  );
}

export default TeacherLayout;
