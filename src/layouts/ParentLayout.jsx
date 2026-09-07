import AuthenticatedLayout from './AuthenticatedLayout';

/** Navigation for the parent area (/parent/*). */
const NAV_ITEMS = [
  { to: '/parent', label: 'Overview', icon: '▦', end: true },
  { to: '/parent/children', label: 'My Children', icon: '👧' },
  { to: '/parent/progress', label: 'Progress', icon: '📈' },
  { to: '/parent/subscription', label: 'Subscription', icon: '💳' },
  { to: '/parent/notifications', label: 'Notifications', icon: '🔔' },
];

export function ParentLayout({ children }) {
  return (
    <AuthenticatedLayout navItems={NAV_ITEMS} title="Family Portal">
      {children}
    </AuthenticatedLayout>
  );
}

export default ParentLayout;
