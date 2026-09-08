import {
  LuBell,
  LuChartLine,
  LuCreditCard,
  LuLayoutDashboard,
  LuUsersRound,
} from 'react-icons/lu';
import AuthenticatedLayout from './AuthenticatedLayout';

/** Navigation for the parent area (/parent/*). */
const NAV_ITEMS = [
  {
    group: 'Family',
    items: [
      { to: '/parent', label: 'Overview', icon: LuLayoutDashboard, end: true },
      { to: '/parent/children', label: 'My Children', icon: LuUsersRound },
      { to: '/parent/progress', label: 'Progress', icon: LuChartLine },
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
