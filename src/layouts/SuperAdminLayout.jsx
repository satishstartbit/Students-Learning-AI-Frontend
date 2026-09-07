import AuthenticatedLayout from './AuthenticatedLayout';

/** Navigation for the Super Admin area (/admin/*). */
const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: '▦', end: true },
  {
    group: 'Management',
    items: [
      { to: '/admin/users', label: 'Users', icon: '👥' },
      { to: '/admin/assignments', label: 'Assignments', icon: '📄' },
      { to: '/admin/regulation-toolkit', label: 'Regulation Toolkit', icon: '🧘' },
      { to: '/admin/rewards', label: 'Rewards', icon: '🏅' },
    ],
  },
  {
    group: 'Billing',
    items: [
      { to: '/admin/subscriptions', label: 'Subscriptions', icon: '💳' },
      { to: '/admin/plans', label: 'Plans & Discounts', icon: '🏷' },
    ],
  },
];

export function SuperAdminLayout({ children }) {
  return (
    <AuthenticatedLayout navItems={NAV_ITEMS} title="Admin Console">
      {children}
    </AuthenticatedLayout>
  );
}

export default SuperAdminLayout;
