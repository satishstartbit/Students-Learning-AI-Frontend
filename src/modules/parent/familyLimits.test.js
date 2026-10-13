import { test } from 'node:test';
import assert from 'node:assert/strict';
import { childLimitReason, hasRoomFor, parentLimitReason, planFitReason, usageLabel } from './familyLimits.js';

const family = (over = {}) => ({
  isAccountHolder: true,
  planInForce: true,
  plan: { name: 'Family', maxChildren: 2, maxParents: 2 },
  children: { used: 2, max: 2, inactive: 0, canAdd: false },
  parents: { used: 1, max: 2, inactive: 0, canAdd: true },
  ...over,
});

test('usage label shows the plan limit, or no limit, and who is inactive', () => {
  assert.equal(usageLabel({ used: 2, max: 3 }, 'child', 'children'), '2 of 3 children');
  assert.equal(usageLabel({ used: 1, max: 1 }, 'parent', 'parents'), '1 of 1 parent');
  assert.equal(usageLabel({ used: 4, max: null }, 'child', 'children'), '4 children · no limit');
  assert.equal(usageLabel({ used: 2, max: 2, inactive: 1 }, 'child', 'children'), '2 of 2 children · 1 inactive');
});

test('add child is explained only when the plan is full, with the way out', () => {
  assert.match(childLimitReason(family()), /Family plan covers up to 2 active children, and you have 2\. Deactivate a child or change to a larger plan/);
  // An extra parent can't change the plan themselves.
  assert.match(childLimitReason(family({ isAccountHolder: false })), /the account holder can change to a larger plan/);
  assert.match(childLimitReason(family(), { admin: true }), /the family has 2\. Deactivate a child, or the parent changes to a larger plan/);
  assert.equal(childLimitReason(family({ children: { used: 1, max: 2, canAdd: true } })), null);
  assert.equal(childLimitReason(null), null);
});

test('nothing can be added before the family has a plan in force', () => {
  const none = family({ planInForce: false, plan: null, children: { used: 0, max: null, canAdd: false }, parents: { used: 1, max: null, canAdd: false } });
  assert.match(childLimitReason(none), /Choose a subscription plan first/);
  assert.match(childLimitReason(none, { admin: true }), /This parent hasn't subscribed to a plan yet\. Children can be added once they choose a plan/);
  assert.match(parentLimitReason(none, { admin: true }), /Parents can be added once they choose a plan/);
  assert.match(childLimitReason({ ...none, isAccountHolder: false }), /The account holder needs to choose a subscription plan/);
});

test('add parent: account holder only (or Super Admin), then the plan limit', () => {
  assert.equal(parentLimitReason(family()), null);
  assert.match(parentLimitReason(family({ isAccountHolder: false, parents: { used: 2, max: 2, canAdd: false } })), /Only the account holder/);
  assert.match(parentLimitReason(family({ parents: { used: 2, max: 2, canAdd: false } })), /up to 2 active parents, you included/);
  assert.match(parentLimitReason(family({ isAccountHolder: false, parents: { used: 2, max: 2, canAdd: false } }), { admin: true }), /the account holder included/);
  assert.match(parentLimitReason(family({ plan: null, parents: { used: 1, max: null, canAdd: false } })), /Choose a subscription plan/);
});

test('switching a member back on needs a free place on a plan in force', () => {
  assert.equal(hasRoomFor({ used: 1, max: 2 }, family()), true);
  assert.equal(hasRoomFor({ used: 2, max: 2 }, family()), false);
  assert.equal(hasRoomFor({ used: 5, max: null }, family()), true);
  assert.equal(hasRoomFor({ used: 0, max: 2 }, family({ planInForce: false })), false);
});

test('a plan too small for the active family is flagged, with what to switch off', () => {
  const size = { childrenCount: 3, parentsCount: 2 };
  assert.match(planFitReason({ maxChildren: 2, maxParents: 4 }, size), /Covers 2 children - you have 3 active\. Deactivate 1 child on My Children/);
  assert.match(planFitReason({ maxChildren: 5, maxParents: 1 }, size), /Includes 1 parent - your family has 2 active\. Deactivate 1 parent/);
  assert.equal(planFitReason({ maxChildren: null, maxParents: null }, size), null);
  assert.equal(planFitReason({ maxChildren: 3, maxParents: 2 }, size), null);
});
