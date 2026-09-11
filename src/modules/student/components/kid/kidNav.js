import { CalendarIcon, GearIcon, HomeIcon, LeafIcon, NotebookIcon, SparkleIcon, StarIcon } from './KidIcons';

/**
 * K-5 navigation - deliberately short, with a picture on every entry for
 * students who are still learning to read. Mirrors the mockup (Home, My
 * Week, Assignments, Focus, Rewards); "Helper" (the AI Learning Assistant)
 * is additive - the reference nav doesn't show it, but it's a real, working
 * feature, so it stays reachable rather than being cut on a label match.
 * Check In lives on the Home page.
 */
export const KID_NAV_ITEMS = [
  { to: '/student', label: 'Home', icon: HomeIcon, end: true },
  { to: '/student/calendar', label: 'My Week', icon: CalendarIcon },
  { to: '/student/assignments', label: 'Assignments', icon: NotebookIcon },
  { to: '/student/assistant', label: 'Helper', icon: SparkleIcon },
  { to: '/student/focus', label: 'Focus', icon: LeafIcon },
  { to: '/student/rewards', label: 'Rewards', icon: StarIcon },
];

export const KID_SETTINGS_ITEM = { to: '/student/settings', label: 'Settings', icon: GearIcon };
