import {
  LuCalendarDays,
  LuFileText,
  LuHeartHandshake,
  LuMessageCircle,
  LuSun,
  LuTimer,
  LuTrophy,
} from 'react-icons/lu';
import AuthenticatedLayout from './AuthenticatedLayout';

/** Navigation for the student area (/student/*). */
const NAV_ITEMS = [
  {
    group: 'My learning',
    items: [
      { to: '/student', label: 'My Day', icon: LuSun, end: true },
      { to: '/student/check-in', label: 'Check In', icon: LuMessageCircle },
      { to: '/student/assignments', label: 'Assignments', icon: LuFileText },
      { to: '/student/calendar', label: 'Planner', icon: LuCalendarDays },
      { to: '/student/focus', label: 'Focus', icon: LuTimer },
      { to: '/student/toolkit', label: 'Toolkit', icon: LuHeartHandshake },
      { to: '/student/rewards', label: 'Rewards', icon: LuTrophy },
    ],
  },
];

export function StudentLayout({ children }) {
  return (
    <AuthenticatedLayout navItems={NAV_ITEMS} title="My Learning" subtitle="Student" brand="ML">
      {children}
    </AuthenticatedLayout>
  );
}

export default StudentLayout;
