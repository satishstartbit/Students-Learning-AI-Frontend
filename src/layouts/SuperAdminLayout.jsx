import {
  LuChartLine,
  LuCreditCard,
  LuDatabase,
  LuGift,
  LuGraduationCap,
  LuLayoutDashboard,
  LuLink,
  LuPackage,
  LuTrophy,
  LuReceiptText,
  LuSchool,
  LuTicketPercent,
  LuUsers,
  LuUsersRound,
} from 'react-icons/lu';
import { useEffect } from 'react';
import AuthenticatedLayout from './AuthenticatedLayout';
import usePortalTheme from './usePortalTheme';
import '../theme/superAdminSidebar.css';

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
      {
        // Parents invite teachers and teachers accept (primary path); the
        // Assignments screen is Super Admin's direct override.
        label: 'Relationships',
        icon: LuLink,
        items: [
          // { to: '/admin/relationships/invitations', label: 'Teacher invitations', icon: LuMailOpen },
          { to: '/admin/relationships', label: 'Assignments', icon: LuLink, end: true },
        ],
      },
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
   * The same light portal look the Teacher and Parent areas use (white
   * sidebar with a soft teal active pill, Nunito/Poppins, flat cards) -
   * the Master Management mockup is this theme, and one console-wide look
   * beats a navy sidebar on every screen but that one. The old navy
   * treatment is theme/superAdminTheme.css, now unused.
   * 
   * usePortalTheme puts the class on <body> rather than a wrapping div,
   * because Modal/Drawer/MultiSelect/SearchableSelect render through
   * createPortal(..., document.body): a wrapper here would not be their
   * ancestor, so its variables would never reach a dialog or dropdown
   * opened from an admin page.
   */
  usePortalTheme();

  /*
   * Plus the one Super-Admin-only deviation: a black sidebar
   * (theme/superAdminSidebar.css). Body class for the same portal reason as
   * above - the mobile sidebar renders through createPortal.
   */
  useEffect(() => {
    document.body.classList.add('super-admin-theme');
    return () => document.body.classList.remove('super-admin-theme');
  }, []);

  return (
    <AuthenticatedLayout navItems={NAV_ITEMS} title="Admin Console" subtitle="Super Admin" brand="AC">
      {children}
    </AuthenticatedLayout>
  );
}

export default SuperAdminLayout;
