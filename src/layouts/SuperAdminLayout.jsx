import {
  LuBell,
  LuChartLine,
  LuCreditCard,
  LuDatabase,
  LuGraduationCap,
  LuLayoutDashboard,
  LuLink,
  LuPackage,
  LuReceiptText,
  LuSchool,
  LuTicketPercent,
  LuUsers,
  LuUsersRound,
  LuMailOpen,
  LuWallet,
} from 'react-icons/lu';
import { useEffect } from 'react';
import AuthenticatedLayout from './AuthenticatedLayout';
import usePortalTheme from './usePortalTheme';
import useNotifications from '../modules/notifications/hooks/useNotifications';
import '../theme/superAdminSidebar.css';

const NOTIFICATIONS_PATH = '/admin/notifications';

/**
 * Navigation for the Super Admin area (/admin/*).
 *
 * `{ group, items }` renders a labelled section; an item carrying its own
 * `items` becomes a collapsible parent with a submenu. Only routes that
 * actually exist are listed.
 *
 * 2026-10-20 (user request): Billing is one menu with its pages underneath
 * (it was a section of five links), and Notifications is a menu item with
 * the unread count - it replaced the header bell.
 */
const navItems = (unreadCount) => [
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
          { to: '/admin/relationships/invitations', label: 'Teacher invitations', icon: LuMailOpen },
          { to: '/admin/relationships', label: 'Assignments', icon: LuLink, end: true },
          // "Teacher connections" removed at the client's request (2026-10-01).
          // Hidden for now - the wording lives in services/email/copy/teacher-invitation.txt (backend).
          // { to: '/admin/relationships/invitation-email', label: 'Invitation email', icon: LuMail }, // add LuMail to the import
        ],
      },
      { to: '/admin/masters', label: 'Master Management', icon: LuDatabase },
      {
        // Plans and codes are the same Master Management screens, surfaced here
        // too so the whole billing picture is reachable from one place.
        label: 'Billing',
        icon: LuWallet,
        items: [
          { to: '/admin/subscriptions', label: 'Subscriptions', icon: LuCreditCard, end: true },
          { to: '/admin/masters/subscription-plans', label: 'Plans', icon: LuPackage },
          { to: '/admin/masters/discount-codes', label: 'Discount Codes', icon: LuTicketPercent },
          { to: '/admin/subscriptions/revenue', label: 'Revenue', icon: LuChartLine },
          { to: '/admin/subscriptions/payments', label: 'Payments & Refunds', icon: LuReceiptText },
        ],
      },
      // {
      //   to: NOTIFICATIONS_PATH,
      //   label: 'Notifications',
      //   icon: LuBell,
      //   badge: unreadCount,
      //   ariaLabel: unreadCount ? `Notifications, ${unreadCount} unread` : undefined,
      // },
      // Hidden for now (re-add the icons to the import):
      // { to: '/admin/settings', label: 'Platform settings', icon: LuSlidersHorizontal },
      // { to: '/admin/system', label: 'System status', icon: LuActivity },
      // { to: '/admin/ai-usage', label: 'AI usage', icon: LuBrainCircuit },
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

  // The Notifications item carries the unread count (polled; drops as soon as the page reads one).
  const { unreadCount } = useNotifications({ limit: 1 });

  return (
    <AuthenticatedLayout
      navItems={navItems(unreadCount)}
      title="Admin Console"
      subtitle="Super Admin"
      brand="AC"
      // Notifications live on their own page (sidebar), not in a header bell.
      notificationsPath={NOTIFICATIONS_PATH}
      showNotificationBell={false}
    >
      {children}
    </AuthenticatedLayout>
  );
}

export default SuperAdminLayout;
