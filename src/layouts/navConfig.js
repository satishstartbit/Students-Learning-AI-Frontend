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
