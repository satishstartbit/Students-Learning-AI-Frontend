/**
 * Where a student's notification should take them - shared by the header bell
 * and /student/notifications so both agree. Returns null when there's nowhere
 * specific to go (the notification is just informational).
 *
 * Reminder types come from the Settings page's reminders
 * (backend services/studentReminder.service.js).
 */
export function studentNotificationPath(notification) {
  const { relatedType, relatedId, type } = notification;
  if (relatedType === 'assignment' && relatedId) return `/student/assignments/${relatedId}`;
  // A task the student added themselves - listed under "My own tasks".
  if (relatedType === 'student_task') return '/student/assignments';
  // A reminder on one of their Home notes (a note on an assignment comes as 'assignment').
  if (relatedType === 'sticky_note') return '/student';
  if (type === 'checkin_reminder') return '/student/check-in';
  if (type === 'weekly_plan_nudge') return '/student/calendar';
  if (type === 'reward_unlocked' || type === 'points_earned') return '/student/rewards';
  return null;
}

export default studentNotificationPath;
