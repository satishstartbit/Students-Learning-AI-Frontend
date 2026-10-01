import {
  LuCalendarDays,
  LuHouse,
  LuListChecks,
  LuPalette,
  LuSlidersHorizontal,
  LuSparkles,
  LuTimer,
  LuTrophy,
} from 'react-icons/lu';

/**
 * K-5 navigation - deliberately short, with a picture on every entry for
 * students who are still learning to read. Mirrors the Kids Focus mockups:
 * Home, My Week, Assignments, Focus, Rewards, in outline icons, then Settings
 * at the foot. Brain Boosters are part of Focus now.
 *
 * Two entries are additive - the reference nav doesn't show them, but they
 * are real, working features, so they stay reachable rather than being cut
 * on a label match: "Helper" (the AI Learning Assistant) after Rewards, and
 * "Make it yours" beside Settings (where Grade 6+ keeps it too).
 * Check In lives on the Home page.
 */
export const KID_NAV_ITEMS = [
  { to: '/student', label: 'Home', icon: LuHouse, end: true },
  { to: '/student/calendar', label: 'My Week', icon: LuCalendarDays },
  { to: '/student/assignments', label: 'Assignments', icon: LuListChecks },
  { to: '/student/focus', label: 'Focus', icon: LuTimer },
  { to: '/student/rewards', label: 'Rewards', icon: LuTrophy },
  { to: '/student/assistant', label: 'Helper', icon: LuSparkles },
];

/** At the sidebar's foot, above Settings. */
export const KID_FOOT_ITEMS = [{ to: '/student/make-it-yours', label: 'Make it yours', icon: LuPalette }];

export const KID_SETTINGS_ITEM = { to: '/student/settings', label: 'Settings', icon: LuSlidersHorizontal };

/** The phone and tablet tab bar: everything but Settings (the avatar opens that). */
export const KID_TAB_ITEMS = [...KID_NAV_ITEMS, ...KID_FOOT_ITEMS];
