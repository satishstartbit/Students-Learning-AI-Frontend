import { LuGraduationCap, LuLayoutDashboard, LuLink, LuSchool, LuUsers, LuUsersRound } from 'react-icons/lu';
import AuthenticatedLayout from './AuthenticatedLayout';

/**
 * Navigation for the Super Admin area (/admin/*).
 *
 * `{ group, items }` renders a labelled section; an item carrying its own
 * `items` becomes a collapsible parent with a submenu. Only routes that
 * actually exist are listed.
 */
const NAV_ITEMS = [
  {
    group: 'Platform',
    items: [
      { to: '/admin', label: 'Dashboard', icon: LuLayoutDashboard, end: true },
      {
        label: 'Users',
        icon: LuUsers,
        items: [
          { to: '/admin/users/students', label: 'Students', icon: LuGraduationCap },
          { to: '/admin/users/parents', label: 'Parents', icon: LuUsersRound },
          { to: '/admin/users/teachers', label: 'Teachers', icon: LuSchool },
        ],
      },
      { to: '/admin/relationships', label: 'Relationships', icon: LuLink },
    ],
  },
];

export function SuperAdminLayout({ children }) {
  return (
    <AuthenticatedLayout navItems={NAV_ITEMS} title="Admin Console" subtitle="Super Admin" brand="AC">
      {children}
    </AuthenticatedLayout>
  );
}

export default SuperAdminLayout;
