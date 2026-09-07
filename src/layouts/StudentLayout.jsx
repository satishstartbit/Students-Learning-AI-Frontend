import AuthenticatedLayout from './AuthenticatedLayout';

/** Navigation for the student area (/student/*). */
const NAV_ITEMS = [
  { to: '/student', label: 'My Day', icon: '☀', end: true },
  { to: '/student/check-in', label: 'Check In', icon: '💬' },
  { to: '/student/assignments', label: 'Assignments', icon: '📄' },
  { to: '/student/calendar', label: 'Planner', icon: '🗓' },
  { to: '/student/focus', label: 'Focus', icon: '⏱' },
  { to: '/student/toolkit', label: 'Toolkit', icon: '🧘' },
  { to: '/student/rewards', label: 'Rewards', icon: '🏅' },
];

export function StudentLayout({ children }) {
  return (
    <AuthenticatedLayout navItems={NAV_ITEMS} title="My Learning">
      {children}
    </AuthenticatedLayout>
  );
}

export default StudentLayout;
