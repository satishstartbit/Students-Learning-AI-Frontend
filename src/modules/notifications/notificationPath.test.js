import test from 'node:test';
import assert from 'node:assert/strict';
import { NOTIFICATIONS_PAGE_BY_ROLE, notificationPathFor } from './notificationPath.js';

const n = (relatedType, relatedId = 'x1', type = 'info') => ({ relatedType, relatedId, type });

test('teacher: each notice opens the page it is about', () => {
  assert.equal(notificationPathFor('TEACHER', n('assignment', 'a1')), '/teacher/assignments/a1');
  assert.equal(notificationPathFor('TEACHER', n('student', 's1')), '/teacher/students/s1');
  assert.equal(notificationPathFor('TEACHER', n('teacher_invitation')), '/teacher/invitations');
  assert.equal(notificationPathFor('TEACHER', n('teacher_connection')), '/teacher/students');
  assert.equal(notificationPathFor('TEACHER', n('assignment_share')), '/teacher/shared-work');
  assert.equal(notificationPathFor('TEACHER', n('assignment', null)), null, 'no id, nowhere to go');
  assert.equal(notificationPathFor('TEACHER', n('subscriptions')), null);
});

test('parent: help and alerts to Progress, invitations to My Children, billing to Subscription', () => {
  assert.equal(notificationPathFor('PARENT', n('assignment', 'a1')), '/parent/progress');
  assert.equal(notificationPathFor('PARENT', n('student', 's1')), '/parent/progress');
  // Overdue work: a child's copy of a teacher assignment, or their own task.
  assert.equal(notificationPathFor('PARENT', n('assignment_recipient', 'r1')), '/parent/progress');
  assert.equal(notificationPathFor('PARENT', n('student_task', 't1')), '/parent/progress');
  assert.equal(notificationPathFor('PARENT', n('teacher_invitation')), '/parent/children');
  assert.equal(notificationPathFor('PARENT', n('teacher_connection')), '/parent/children');
  assert.equal(notificationPathFor('PARENT', n('subscriptions')), '/parent/subscription');
  assert.equal(notificationPathFor('PARENT', n('payment_transactions')), '/parent/subscription');
  assert.equal(notificationPathFor('PARENT', n('reward')), null);
});

test('student: the student rules; Super Admin and unknown: nowhere', () => {
  assert.equal(notificationPathFor('STUDENT', n('assignment', 'a9')), '/student/assignments/a9');
  assert.equal(notificationPathFor('STUDENT', { type: 'reward_unlocked' }), '/student/rewards');
  // Note reminders: a Home note opens Home, a note on an assignment opens the assignment.
  assert.equal(notificationPathFor('STUDENT', { type: 'note_reminder', relatedType: 'sticky_note', relatedId: 'n1' }), '/student');
  assert.equal(notificationPathFor('STUDENT', { type: 'note_reminder', relatedType: 'assignment', relatedId: 'a9' }), '/student/assignments/a9');
  assert.equal(notificationPathFor('SUPER_ADMIN', n('assignment', 'a1')), null);
  assert.equal(notificationPathFor('TEACHER', null), null);
});

test('a notifications page for student, teacher and parent only', () => {
  assert.deepEqual(Object.keys(NOTIFICATIONS_PAGE_BY_ROLE).sort(), ['PARENT', 'STUDENT', 'TEACHER']);
});
