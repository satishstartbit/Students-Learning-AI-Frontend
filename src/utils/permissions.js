import { USER_ROLES } from './constants';
import { getCurrentRole } from './auth';

/**
 * Frontend mirror of the backend permission catalogue.
 *
 * This drives what the UI *shows*. The server is still the authority - every
 * protected call is re-checked there. Components ask `can(PERMISSIONS.X)`
 * rather than testing roles inline.
 */
export const PERMISSIONS = Object.freeze({
  USER_CREATE: 'USER_CREATE',
  USER_READ: 'USER_READ',
  USER_UPDATE: 'USER_UPDATE',
  USER_DELETE: 'USER_DELETE',

  ASSIGNMENT_CREATE: 'ASSIGNMENT_CREATE',
  ASSIGNMENT_READ: 'ASSIGNMENT_READ',
  ASSIGNMENT_UPDATE: 'ASSIGNMENT_UPDATE',
  ASSIGNMENT_ASSIGN: 'ASSIGNMENT_ASSIGN',
  ASSIGNMENT_DELETE: 'ASSIGNMENT_DELETE',
  ASSIGNMENT_REVIEW: 'ASSIGNMENT_REVIEW',

  CHECKIN_CREATE: 'CHECKIN_CREATE',
  CHECKIN_READ: 'CHECKIN_READ',

  REWARD_CREATE: 'REWARD_CREATE',
  REWARD_READ: 'REWARD_READ',
  REWARD_UPDATE: 'REWARD_UPDATE',
  REWARD_DELETE: 'REWARD_DELETE',

  SUBSCRIPTION_READ: 'SUBSCRIPTION_READ',
  SUBSCRIPTION_CREATE: 'SUBSCRIPTION_CREATE',
  SUBSCRIPTION_UPDATE: 'SUBSCRIPTION_UPDATE',

  DASHBOARD_READ: 'DASHBOARD_READ',
  PROGRESS_READ: 'PROGRESS_READ',
  NOTIFICATION_READ: 'NOTIFICATION_READ',

  MASTER_READ: 'MASTER_READ',
  MASTER_CREATE: 'MASTER_CREATE',
  MASTER_UPDATE: 'MASTER_UPDATE',
  MASTER_DELETE: 'MASTER_DELETE',
});

const P = PERMISSIONS;

export const ROLE_PERMISSIONS = Object.freeze({
  [USER_ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),

  [USER_ROLES.STUDENT]: [
    P.ASSIGNMENT_READ,
    P.ASSIGNMENT_UPDATE,
    P.CHECKIN_CREATE,
    P.CHECKIN_READ,
    P.REWARD_READ,
    P.DASHBOARD_READ,
    P.PROGRESS_READ,
    P.NOTIFICATION_READ,
  ],

  [USER_ROLES.TEACHER]: [
    P.USER_READ,
    P.ASSIGNMENT_CREATE,
    P.ASSIGNMENT_READ,
    P.ASSIGNMENT_UPDATE,
    P.ASSIGNMENT_ASSIGN,
    P.ASSIGNMENT_DELETE,
    P.ASSIGNMENT_REVIEW,
    P.DASHBOARD_READ,
    P.PROGRESS_READ,
    P.NOTIFICATION_READ,
  ],

  [USER_ROLES.PARENT]: [
    P.USER_CREATE,
    P.USER_READ,
    P.USER_UPDATE,
    P.ASSIGNMENT_READ,
    P.CHECKIN_READ,
    P.REWARD_READ,
    P.SUBSCRIPTION_READ,
    P.SUBSCRIPTION_CREATE,
    P.SUBSCRIPTION_UPDATE,
    P.DASHBOARD_READ,
    P.PROGRESS_READ,
    P.NOTIFICATION_READ,
  ],
});

export const getPermissionsForRole = (role) => ROLE_PERMISSIONS[role] ?? [];

export const roleHasPermission = (role, permission) =>
  getPermissionsForRole(role).includes(permission);

/** Does the signed-in user hold every listed permission? */
export function can(...permissions) {
  const granted = getPermissionsForRole(getCurrentRole());
  return permissions.flat().every((p) => granted.includes(p));
}

/** Does the signed-in user hold at least one of them? */
export function canAny(...permissions) {
  const granted = getPermissionsForRole(getCurrentRole());
  return permissions.flat().some((p) => granted.includes(p));
}

export default { PERMISSIONS, ROLE_PERMISSIONS, can, canAny, getPermissionsForRole };
