import test from 'node:test';
import assert from 'node:assert/strict';
import { expiresSoon, expiryText, invitationCounts, inviterText, outcomeText } from './invitationText.js';

test('expiry wording and the "soon" warning', () => {
  assert.equal(expiryText(0), 'Expires today');
  assert.equal(expiryText(-1), 'Expires today');
  assert.equal(expiryText(1), 'Expires tomorrow');
  assert.equal(expiryText(13), 'Expires in 13 days');
  assert.equal(expiryText(null), 'Expires soon');
  assert.equal(expiresSoon(3), true);
  assert.equal(expiresSoon(4), false);
  assert.equal(expiresSoon(null), false);
});

test('who invited: a parent, or the platform for the family', () => {
  assert.equal(inviterText({ name: 'Priya Sharma', role: 'PARENT' }), 'Invited by Priya Sharma, parent');
  assert.equal(inviterText({ name: 'Growing Focus', role: 'SUPER_ADMIN' }), 'Sent by Growing Focus for the family');
  assert.equal(inviterText(null), 'Invited by a parent');
});

test('outcome of an answered invitation', () => {
  assert.equal(outcomeText('accepted', { respondedOn: 'Sep 21, 2026' }), 'Accepted Sep 21, 2026');
  assert.equal(outcomeText('declined', { respondedOn: 'Sep 16, 2026' }), 'Declined Sep 16, 2026');
  assert.equal(outcomeText('expired', { expiredOn: 'Sep 10, 2026' }), 'Expired Sep 10, 2026');
  assert.equal(outcomeText('cancelled'), 'Withdrawn by the family');
});

test('summary counts', () => {
  const items = ['pending', 'pending', 'accepted', 'declined', 'expired', 'cancelled'].map((status) => ({ status }));
  assert.deepEqual(invitationCounts(items), { pending: 2, accepted: 1, declined: 1, closed: 2 });
});
