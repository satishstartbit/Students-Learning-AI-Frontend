import { LuChartLine, LuFileText, LuLayoutDashboard, LuUsers } from 'react-icons/lu';
import AuthenticatedLayout from './AuthenticatedLayout';

/** Navigation for the teacher area (/teacher/*). */
const NAV_ITEMS = [
  {
    group: 'Teaching',
    items: [
      { to: '/teacher', label: 'Dashboard', icon: LuLayoutDashboard, end: true },
      { to: '/teacher/students', label: 'Students', icon: LuUsers },
      { to: '/teacher/assignments', label: 'Assignments', icon: LuFileText },
      { to: '/teacher/progress', label: 'Progress', icon: LuChartLine },
    ],
  },
];

export function TeacherLayout({ children }) {
  return (
    <AuthenticatedLayout navItems={NAV_ITEMS} title="Teacher Portal" subtitle="Teacher" brand="TP">
      {children}
    </AuthenticatedLayout>
  );
}

export default TeacherLayout;
