import { studentNotificationPath } from './studentNotificationPath.js';

/**
 * Where a notification takes the signed-in reader, per role - shared by the
 * notifications page (/student, /teacher, /parent `…/notifications`) and the
 * Super Admin's bell. Returns null when there is nowhere specific to go (the
 * notice is just informational; opening it only marks it read).
 *
 *   student  studentNotificationPath (assignments, own tasks, check-in, plan, rewards)
 *   teacher  an assignment -> its page; a student (check-in / safety alert) ->
 *            the student's page; an invitation -> Invitations; a connection ->
 *            Students; shared work -> Shared with me
 *   parent   a child's assignment or the child (help asked, alerts) -> Progress;
 *            an invitation or connection -> My Children; billing -> Subscription
 *
 * relatedType values come from the backend's notify() calls.
 */
export function notificationPathFor(role, notification) {
  if (!notification) return null;
  const { relatedType, relatedId } = notification;
  switch (role) {
    case 'STUDENT':
      return studentNotificationPath(notification);
    case 'TEACHER':
      if (relatedType === 'assignment' && relatedId) return `/teacher/assignments/${relatedId}`;
      if (relatedType === 'student' && relatedId) return `/teacher/students/${relatedId}`;
      if (relatedType === 'teacher_invitation') return '/teacher/invitations';
      if (relatedType === 'teacher_connection') return '/teacher/students';
      if (relatedType === 'assignment_share') return '/teacher/shared-work';
      return null;
    case 'PARENT':
      // Overdue work (a child's copy of a teacher assignment, or their own task) also opens Progress.
      if (['assignment', 'student', 'assignment_recipient', 'student_task'].includes(relatedType)) return '/parent/progress';
      if (relatedType === 'teacher_invitation' || relatedType === 'teacher_connection') return '/parent/children';
      if (relatedType === 'subscriptions' || relatedType === 'payment_transactions') return '/parent/subscription';
      return null;
    default:
      return null;
  }
}

/** Each role's notifications page (Super Admin has none - it keeps the bell's list). */
export const NOTIFICATIONS_PAGE_BY_ROLE = {
  STUDENT: '/student/notifications',
  TEACHER: '/teacher/notifications',
  PARENT: '/parent/notifications',
};

/** Tells the bell's unread badge to look again (after reading on the page). */
export const NOTIFICATIONS_CHANGED_EVENT = 'notifications:changed';

export default notificationPathFor;
