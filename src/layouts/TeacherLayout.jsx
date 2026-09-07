import AuthenticatedLayout from './AuthenticatedLayout';

/** Navigation for the teacher area (/teacher/*). */
const NAV_ITEMS = [
  { to: '/teacher', label: 'Dashboard', icon: '▦', end: true },
  { to: '/teacher/students', label: 'Students', icon: '👥' },
  { to: '/teacher/assignments', label: 'Assignments', icon: '📄' },
  { to: '/teacher/progress', label: 'Progress', icon: '📈' },
];

export function TeacherLayout({ children }) {
  return (
    <AuthenticatedLayout navItems={NAV_ITEMS} title="Teacher Portal">
      {children}
    </AuthenticatedLayout>
  );
}

export default TeacherLayout;
