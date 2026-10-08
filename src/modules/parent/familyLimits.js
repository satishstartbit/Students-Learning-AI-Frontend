// With extensions, so node:test can load this file (familyLimits.test.js).

const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** "2 of 3 children" · "2 children · no limit" - `limit` is { used, max } from GET /parent/family. */
export function usageLabel(limit, one, many) {
  const used = limit?.used ?? 0;
  if (limit?.max == null) return `${count(used, one, many)} · no limit`;
  return `${used} of ${count(limit.max, one, many)}`;
}

/** Why "Add child" is off, or null when the plan has room. Only the account holder can change the plan. */
export function childLimitReason(family) {
  if (!family || family.children?.canAdd !== false) return null;
  const plan = family.plan?.name ? `${family.plan.name} plan` : 'plan';
  const next = family.isAccountHolder === false
    ? 'The account holder can change to a larger plan to add another child.'
    : 'Change to a larger plan to add another child.';
  return `Your ${plan} covers up to ${count(family.children.max, 'child', 'children')}, and you have ${family.children.used}. ${next}`;
}

/** Why "Add parent" is off, or null when it's allowed. */
export function parentLimitReason(family) {
  if (!family || family.parents?.canAdd) return null;
  if (!family.isAccountHolder) return 'Only the account holder can add or remove parents.';
  if (!family.plan) return 'Choose a subscription plan before adding another parent.';
  return `Your ${family.plan.name} plan includes up to ${count(family.parents.max, 'parent', 'parents')}, including you. Change to a larger plan to add another parent.`;
}

/** Where a full family goes to pick a larger plan (the Subscription page opens its plan options). */
export const CHANGE_PLAN_PATH = '/parent/subscription?change=1';

/** Why a plan can't hold the family as it is now, or null. `family` = { childrenCount, parentsCount }. */
export function planFitReason(plan, family) {
  if (!plan || !family) return null;
  if (plan.maxChildren != null && family.childrenCount > plan.maxChildren) {
    return `Covers ${count(plan.maxChildren, 'child', 'children')} - you have ${family.childrenCount}.`;
  }
  if (plan.maxParents != null && family.parentsCount > plan.maxParents) {
    return `Includes ${count(plan.maxParents, 'parent', 'parents')} - your family has ${family.parentsCount}.`;
  }
  return null;
}
