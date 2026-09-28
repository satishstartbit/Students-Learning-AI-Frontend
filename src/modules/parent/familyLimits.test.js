import { test } from 'node:test';
import assert from 'node:assert/strict';
import { childLimitReason, parentLimitReason, planFitReason, usageLabel } from './familyLimits.js';

const family = (over = {}) => ({
  isAccountHolder: true,
  plan: { name: 'Family', maxChildren: 2, maxParents: 2 },
  children: { used: 2, max: 2, canAdd: false },
  parents: { used: 1, max: 2, canAdd: true },
  ...over,
});

test('usage label shows the plan limit, or no limit', () => {
  assert.equal(usageLabel({ used: 2, max: 3 }, 'child', 'children'), '2 of 3 children');
  assert.equal(usageLabel({ used: 1, max: 1 }, 'parent', 'parents'), '1 of 1 parent');
  assert.equal(usageLabel({ used: 4, max: null }, 'child', 'children'), '4 children · no limit');
});

test('add child is explained only when the plan is full', () => {
  assert.match(childLimitReason(family()), /Family plan covers up to 2 children, and you have 2/);
  assert.equal(childLimitReason(family({ children: { used: 1, max: 2, canAdd: true } })), null);
  assert.equal(childLimitReason(null), null);
});

test('add parent: account holder only, then the plan limit', () => {
  assert.equal(parentLimitReason(family()), null);
  assert.match(parentLimitReason(family({ isAccountHolder: false, parents: { used: 2, max: 2, canAdd: false } })), /Only the account holder/);
  assert.match(parentLimitReason(family({ parents: { used: 2, max: 2, canAdd: false } })), /up to 2 parents, including you/);
  assert.match(parentLimitReason(family({ plan: null, parents: { used: 1, max: null, canAdd: false } })), /Choose a subscription plan/);
});

test('a plan too small for the family is flagged', () => {
  const size = { childrenCount: 3, parentsCount: 2 };
  assert.match(planFitReason({ maxChildren: 2, maxParents: 4 }, size), /Covers 2 children - you have 3/);
  assert.match(planFitReason({ maxChildren: 5, maxParents: 1 }, size), /Includes 1 parent - your family has 2/);
  assert.equal(planFitReason({ maxChildren: null, maxParents: null }, size), null);
  assert.equal(planFitReason({ maxChildren: 3, maxParents: 2 }, size), null);
});
