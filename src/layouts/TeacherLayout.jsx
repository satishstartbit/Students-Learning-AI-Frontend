import {
  LuChartLine,
  LuFileText,
  LuLayoutDashboard,
  LuMailOpen,
  LuSparkles,
  LuUser,
  LuUsers,
} from 'react-icons/lu';
import AuthenticatedLayout from './AuthenticatedLayout';

/** Navigation for the teacher area (/teacher/*). */
const NAV_ITEMS = [
  {
    group: 'Teaching',
    items: [
      { to: '/teacher', label: 'Dashboard', icon: LuLayoutDashboard, end: true },
      { to: '/teacher/students', label: 'Students', icon: LuUsers },
      // Parents' invitations to connect with their child (accept / decline).
      { to: '/teacher/invitations', label: 'Invitations', icon: LuMailOpen },
      { to: '/teacher/assignments', label: 'Assignments', icon: LuFileText },
      { to: '/teacher/progress', label: 'Progress', icon: LuChartLine },
      { to: '/teacher/learning-activity', label: 'Learning Activity', icon: LuSparkles },
      { to: '/teacher/profile', label: 'My Profile', icon: LuUser },
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
