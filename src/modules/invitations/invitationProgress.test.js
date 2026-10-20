import test from 'node:test';
import assert from 'node:assert/strict';
import { invitationSteps, subjectChoices } from './invitationProgress.js';

const states = (inv) => invitationSteps(inv).map((s) => `${s.label}:${s.state}`);
const parentAsk = { invitedBy: { role: 'PARENT' }, createdAt: '2026-10-01T10:00:00Z' };

test('a parent’s request: requested → reviewed → the teacher’s answer', () => {
  assert.deepEqual(states({ ...parentAsk, status: 'awaiting_approval' }), ['Requested:done', 'Being reviewed:current', 'Teacher answers:todo']);
  assert.deepEqual(states({ ...parentAsk, status: 'pending', approvedAt: '2026-10-02T10:00:00Z' }), [
    'Requested:done',
    'Approved and sent:done',
    'Waiting for the teacher:current',
  ]);
  assert.deepEqual(states({ ...parentAsk, status: 'accepted', approvedAt: 'x', respondedAt: 'y' }).at(-1), 'Teacher accepted - connected:done');
  assert.deepEqual(states({ ...parentAsk, status: 'declined', approvedAt: 'x' }).at(-1), 'Teacher declined:stopped');
  assert.deepEqual(states({ ...parentAsk, status: 'expired', approvedAt: 'x' }).at(-1), 'No answer - it expired:stopped');
});

test('stopped at review: no teacher step', () => {
  assert.deepEqual(states({ ...parentAsk, status: 'rejected' }), ['Requested:done', 'Not approved:stopped']);
  assert.deepEqual(states({ ...parentAsk, status: 'cancelled' }), ['Requested:done', 'Withdrawn:stopped']);
  assert.deepEqual(states({ ...parentAsk, status: 'cancelled', approvedAt: 'x' }).at(-1), 'Cancelled:stopped');
});

test('sent by the platform team: two steps', () => {
  assert.deepEqual(states({ invitedBy: { role: 'SUPER_ADMIN' }, status: 'pending', lastSentAt: 'x' }), [
    'Sent by the platform team:done',
    'Waiting for the teacher:current',
  ]);
  assert.deepEqual(invitationSteps(null), []);
});

test('the parent is offered only subjects still free, and told why the others are not', () => {
  const choice = subjectChoices({
    subjects: [
      { name: 'Mathematics', available: false, reason: 'connected', teacherName: 'Naveen B' },
      { name: 'English', available: true },
      { name: 'Science', available: false, reason: 'requested' },
      { name: 'History', available: false, reason: 'invited', teacherName: 'Jane Rivera' },
    ],
  });
  assert.deepEqual(choice.options, [{ value: 'English', label: 'English' }]);
  assert.deepEqual(choice.taken.map((t) => `${t.name}: ${t.why}`), [
    'Mathematics: taught by Naveen B',
    'Science: a request is waiting for approval',
    'History: invitation sent to Jane Rivera',
  ]);
  assert.deepEqual(subjectChoices(null), { options: [], taken: [] });
});
