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

test('Super Admin: a parent\'s teacher request opens the waiting requests', () => {
  assert.equal(notificationPathFor('SUPER_ADMIN', n('teacher_invitation', 'i1')), '/admin/relationships/invitations?status=awaiting_approval');
});

test('student: the student rules; Super Admin\'s other notices and unknown: nowhere', () => {
  assert.equal(notificationPathFor('STUDENT', n('assignment', 'a9')), '/student/assignments/a9');
  assert.equal(notificationPathFor('STUDENT', { type: 'reward_unlocked' }), '/student/rewards');
  // Note reminders: a Home note opens Home, a note on an assignment opens the assignment.
  assert.equal(notificationPathFor('STUDENT', { type: 'note_reminder', relatedType: 'sticky_note', relatedId: 'n1' }), '/student');
  assert.equal(notificationPathFor('STUDENT', { type: 'note_reminder', relatedType: 'assignment', relatedId: 'a9' }), '/student/assignments/a9');
  assert.equal(notificationPathFor('SUPER_ADMIN', n('assignment', 'a1')), null);
  assert.equal(notificationPathFor('TEACHER', null), null);
});

test('every signed-in role has a notifications page (Super Admin since 2026-10-20)', () => {
  assert.deepEqual(Object.keys(NOTIFICATIONS_PAGE_BY_ROLE).sort(), ['PARENT', 'STUDENT', 'SUPER_ADMIN', 'TEACHER']);
  assert.equal(NOTIFICATIONS_PAGE_BY_ROLE.SUPER_ADMIN, '/admin/notifications');
});
