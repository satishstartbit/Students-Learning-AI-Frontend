// With the extension, so node:test can load this file too (navConfig.test.js).
import { USER_ROLES } from '../utils/constants.js';

/**
 * Where the account entry sends each role (sidebar account menu and the
 * phone "More" sheet). Students (Grade 6+ - K-4 has its own shell) land on
 * Settings, where their onboarding answers are edited. Super Admin has its
 * own My Profile (name, phone, time zone, password).
 */
export const PROFILE_PATH_BY_ROLE = {
  [USER_ROLES.STUDENT]: '/student/settings',
  [USER_ROLES.TEACHER]: '/teacher/profile',
  [USER_ROLES.PARENT]: '/parent/profile',
  [USER_ROLES.SUPER_ADMIN]: '/admin/profile',
};

const MENU_WIDTH = 240; // the account menu's w-60
const MENU_GAP = 8;

/**
 * Where the sidebar's account menu goes (fixed, on <body>), from the account
 * tile's box in viewport coordinates. Expanded sidebar: above the tile, left
 * edges aligned. Collapsed rail: beside the rail (`railRight`, the sidebar's
 * own edge - the tile sits a little inside it), bottoms aligned - inside the
 * 3rem rail it was clipped. Never past the right edge of the window.
 */
export function accountMenuPosition(rect, { collapsed, viewportWidth, viewportHeight, railRight = rect.right }) {
  const left = collapsed ? Math.max(rect.right, railRight) + MENU_GAP : rect.left;
  return {
    left: Math.max(MENU_GAP, Math.min(left, viewportWidth - MENU_WIDTH - MENU_GAP)),
    bottom: collapsed ? viewportHeight - rect.bottom : viewportHeight - rect.top + MENU_GAP,
    collapsed,
  };
}

/**
 * The label of the collapsible sidebar menu that holds the current page, or
 * null. `sections` are `{ items }` sections; `isPathActive(to, end)` matches a
 * link against the current address. Labels are unique within a sidebar.
 */
export function activeMenuLabel(sections = [], isPathActive) {
  const menu = sections
    .flatMap((section) => section.items ?? [])
    .find((entry) => Array.isArray(entry.items) && entry.items.some((child) => isPathActive(child.to, child.end)));
  return menu?.label ?? null;
}

/**
 * A role's sidebar entries as one list of links: `{ group, items }` sections
 * and collapsible parents (`{ label, items }`) are unwrapped, so the phone
 * shell can list whatever isn't one of its tabs.
 */
export function flattenNav(entries = []) {
  return entries.flatMap((entry) => {
    if (Array.isArray(entry.items)) return flattenNav(entry.items);
    return entry.to ? [entry] : [];
  });
}
