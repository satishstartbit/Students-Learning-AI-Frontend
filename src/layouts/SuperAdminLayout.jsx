import { useEffect } from 'react';
import {
  LuBookOpen,
  LuChartLine,
  LuClipboardList,
  LuCreditCard,
  LuDatabase,
  LuGraduationCap,
  LuLayers,
  LuLayoutDashboard,
  LuLink,
  LuListOrdered,
  LuMusic,
  LuPackage,
  LuReceiptText,
  LuSchool,
  LuTicketPercent,
  LuUsers,
  LuUsersRound,
} from 'react-icons/lu';
import AuthenticatedLayout from './AuthenticatedLayout';
import '../theme/superAdminTheme.css';

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
      { to: '/admin/masters', label: 'Master Management', icon: LuDatabase },
    ],
  },
  {
    // Plans and codes are the same Master Management screens, surfaced here
    // too so the whole billing picture is reachable from one place.
    group: 'Billing',
    items: [
      { to: '/admin/subscriptions', label: 'Subscriptions', icon: LuCreditCard, end: true },
      { to: '/admin/subscriptions/payments', label: 'Payments & Refunds', icon: LuReceiptText },
      { to: '/admin/subscriptions/revenue', label: 'Revenue', icon: LuChartLine },
      { to: '/admin/masters/subscription-plans', label: 'Plans', icon: LuPackage },
      { to: '/admin/masters/discount-codes', label: 'Discount Codes', icon: LuTicketPercent },
    ],
  },
];

export function SuperAdminLayout({ children }) {
  /*
   * Scoped via a class on <body>, not a wrapping div, because Modal/Drawer/
   * MultiSelect/SearchableSelect (components/common) render through
   * createPortal(..., document.body) - a wrapping div here would never be
   * an ancestor of that portaled content in the DOM, so its CSS variables
   * (theme/superAdminTheme.css) would not reach dialogs or dropdowns opened
   * from an admin page. <body> is an ancestor of both the app root and any
   * portal target, so this reaches everything the Super Admin panel can
   * render. Removed on unmount so navigating to another role's layout
   * (a different top-level route) restores the default theme immediately.
   */
  useEffect(() => {
    document.body.classList.add('admin-theme');
    return () => document.body.classList.remove('admin-theme');
  }, []);

  return (
    <AuthenticatedLayout navItems={NAV_ITEMS} title="Admin Console" subtitle="Super Admin" brand="AC">
      {children}
    </AuthenticatedLayout>
  );
}

export default SuperAdminLayout;
