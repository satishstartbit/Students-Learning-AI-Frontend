/**
 * Centralised frontend enumerations.
 * Values mirror the backend's utils/constants.js and the database CHECK
 * constraints - keep the three in sync.
 */

export const USER_ROLES = Object.freeze({
  SUPER_ADMIN: 'SUPER_ADMIN',
  STUDENT: 'STUDENT',
  TEACHER: 'TEACHER',
  PARENT: 'PARENT',
});

export const ROLE_LABELS = Object.freeze({
  [USER_ROLES.SUPER_ADMIN]: 'Super Admin',
  [USER_ROLES.STUDENT]: 'Student',
  [USER_ROLES.TEACHER]: 'Teacher',
  [USER_ROLES.PARENT]: 'Parent',
});

/** Landing route per role, used after login and by role guards. */
export const ROLE_HOME_PATH = Object.freeze({
  [USER_ROLES.SUPER_ADMIN]: '/admin/dashboard',
  [USER_ROLES.STUDENT]: '/student/dashboard',
  [USER_ROLES.TEACHER]: '/teacher/dashboard',
  [USER_ROLES.PARENT]: '/parent/dashboard',
});

/**
 * Where an unauthenticated visitor is sent per area.
 * Super Admin has its own sign-in page, so an expired admin session returns
 * there rather than to the shared user login.
 */
export const ROLE_LOGIN_PATH = Object.freeze({
  [USER_ROLES.SUPER_ADMIN]: '/admin/login',
  default: '/login',
});

export const USER_STATUS = Object.freeze({
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  DELETED: 'deleted',
});

export const ASSIGNMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
});

export const ASSIGNMENT_SOURCE_TYPE = Object.freeze({
  MANUAL: 'manual',
  TEACHER: 'teacher',
  PHOTO: 'photo',
  OCR: 'ocr',
});

export const TASK_STATUS = Object.freeze({
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  SKIPPED: 'skipped',
});

export const CHECKIN_STATUS = Object.freeze({
  PENDING: 'pending',
  COMPLETED: 'completed',
});

/** Scale used by the daily check-in sliders (matches the DB CHECK of 1..10). */
export const CHECKIN_SCALE = Object.freeze({ MIN: 1, MAX: 10 });

export const FOCUS_STATUS = Object.freeze({
  PLANNED: 'planned',
  IN_PROGRESS: 'in_progress',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  ABANDONED: 'abandoned',
});

export const REWARD_ACTIVITY_TYPES = Object.freeze({
  TASK_STEP_COMPLETED: 'task_step_completed',
  TASK_COMPLETED: 'task_completed',
  FOCUS_SESSION_COMPLETED: 'focus_session_completed',
  DAILY_CHECKIN_COMPLETED: 'daily_checkin_completed',
});

export const SUBSCRIPTION_STATUS = Object.freeze({
  TRIALING: 'trialing',
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
  CANCELLED: 'cancelled',
  INCOMPLETE: 'incomplete',
});

export const BILLING_CYCLE = Object.freeze({
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
});

export const PLAN_TYPE = Object.freeze({
  INDIVIDUAL: 'individual',
  FAMILY: 'family',
});

export const NOTIFICATION_CHANNEL = Object.freeze({
  IN_APP: 'in_app',
  EMAIL: 'email',
  BROWSER_PUSH: 'browser_push',
});

export const NOTIFICATION_TYPES = Object.freeze({
  ASSIGNMENT_DUE: 'assignment_due',
  ASSIGNMENT_ASSIGNED: 'assignment_assigned',
  CHECKIN_REMINDER: 'checkin_reminder',
  REWARD_UNLOCKED: 'reward_unlocked',
  SUBSCRIPTION_UPDATED: 'subscription_updated',
  PAYMENT_FAILED: 'payment_failed',
  SAFETY_ALERT: 'safety_alert',
});

/** Maps a status value to a StatusBadge tone. */
export const STATUS_TONE = Object.freeze({
  pending: 'neutral',
  planned: 'neutral',
  in_progress: 'info',
  trialing: 'info',
  completed: 'success',
  active: 'success',
  skipped: 'warning',
  paused: 'warning',
  past_due: 'warning',
  cancelled: 'danger',
  suspended: 'danger',
  deleted: 'danger',
  abandoned: 'danger',
  incomplete: 'danger',
});

export const STORAGE_KEYS = Object.freeze({
  ACCESS_TOKEN: 'eflp.accessToken',
  REFRESH_TOKEN: 'eflp.refreshToken',
  USER: 'eflp.user',
});

export const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
});
