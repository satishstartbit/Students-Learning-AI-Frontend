import {
  LuBell,
  LuChartLine,
  LuCreditCard,
  LuLayoutDashboard,
  LuSparkles,
  LuUser,
  LuUsersRound,
} from 'react-icons/lu';
import AuthenticatedLayout from './AuthenticatedLayout';

/**
 * Navigation for the parent area (/parent/*).
 *
 * "My Profile" (the parent's own details) and "My Children" are kept as two
 * distinct entries on purpose - editing yourself and editing a child are
 * different operations with different ownership rules.
 */
const NAV_ITEMS = [
  {
    group: 'Family',
    items: [
      { to: '/parent', label: 'Overview', icon: LuLayoutDashboard, end: true },
      { to: '/parent/profile', label: 'My Profile', icon: LuUser },
      { to: '/parent/children', label: 'My Children', icon: LuUsersRound },
      { to: '/parent/progress', label: 'Progress', icon: LuChartLine },
      { to: '/parent/learning-summary', label: 'Learning Summary', icon: LuSparkles },
      { to: '/parent/subscription', label: 'Subscription', icon: LuCreditCard },
      { to: '/parent/notifications', label: 'Notifications', icon: LuBell },
    ],
  },
];

export function ParentLayout({ children }) {
  return (
    <AuthenticatedLayout navItems={NAV_ITEMS} title="Family Portal" subtitle="Parent" brand="FP">
      {children}
    </AuthenticatedLayout>
  );
}

export default ParentLayout;
