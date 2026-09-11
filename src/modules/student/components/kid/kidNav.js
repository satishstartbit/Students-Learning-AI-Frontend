import { GearIcon, HomeIcon, LeafIcon, NotebookIcon, SparkleIcon, StarIcon } from './KidIcons';

/**
 * K-5 navigation - deliberately short (five places), with a picture on
 * every entry for students who are still learning to read. Mirrors the
 * mockup (Home, Assignments, Focus, Rewards), plus "Helper" so the AI
 * Learning Assistant stays reachable. Check In lives on the Home page.
 */
export const KID_NAV_ITEMS = [
  { to: '/student', label: 'Home', icon: HomeIcon, end: true },
  { to: '/student/assignments', label: 'Assignments', icon: NotebookIcon },
  { to: '/student/assistant', label: 'Helper', icon: SparkleIcon },
  { to: '/student/focus', label: 'Focus', icon: LeafIcon },
  { to: '/student/rewards', label: 'Rewards', icon: StarIcon },
];

export const KID_SETTINGS_ITEM = { to: '/student/settings', label: 'Settings', icon: GearIcon };
