// With extensions, so node:test can load this file (familyLimits.test.js).
//
// The words for a family's places on its plan, for the parent (My Children,
// Subscription) and for Super Admin (a parent's record, `{ admin: true }`).
// Only ACTIVE members take a place; nothing can be added until the family has
// a plan in force (`planInForce` from GET /parent/family or /admin/users/:id/family).

const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** "2 of 3 children" · "2 children · no limit", plus " · 1 inactive" - `limit` is { used, max, inactive }. */
export function usageLabel(limit, one, many) {
  const used = limit?.used ?? 0;
  const base = limit?.max == null ? `${count(used, one, many)} · no limit` : `${used} of ${count(limit.max, one, many)}`;
  return limit?.inactive ? `${base} · ${limit.inactive} inactive` : base;
}

/** No plan in force yet: the words, by who is reading. */
function noPlanReason(family, admin, what) {
  if (admin) return `This parent hasn't subscribed to a plan yet. ${what} can be added once they choose a plan.`;
  if (family.isAccountHolder === false) return `The account holder needs to choose a subscription plan before ${what.toLowerCase()} can be added.`;
  return `Choose a subscription plan first - then you can add ${what.toLowerCase()}.`;
}

/** Why "Add child" (or bringing a child back) is off, or null when the plan has room. */
export function childLimitReason(family, { admin = false } = {}) {
  if (!family || family.children?.canAdd !== false) return null;
  if (family.planInForce === false || !family.plan) return noPlanReason(family, admin, 'Children');
  const plan = family.plan?.name ? `${family.plan.name} plan` : 'plan';
  const next = admin
    ? 'Deactivate a child, or the parent changes to a larger plan, to add another.'
    : family.isAccountHolder === false
      ? 'Deactivate a child, or the account holder can change to a larger plan, to add another.'
      : 'Deactivate a child or change to a larger plan to add another.';
  return `The ${plan} covers up to ${count(family.children.max, 'active child', 'active children')}, and ${admin ? 'the family has' : 'you have'} ${family.children.used}. ${next}`;
}

/** Why "Add parent" (or switching one back on) is off, or null when it's allowed. */
export function parentLimitReason(family, { admin = false } = {}) {
  if (!family || family.parents?.canAdd) return null;
  if (!admin && !family.isAccountHolder) return 'Only the account holder can add or remove parents.';
  if (family.planInForce === false || !family.plan) return noPlanReason(family, admin, 'Parents');
  return `The ${family.plan.name} plan includes up to ${count(family.parents.max, 'active parent', 'active parents')}, ${admin ? 'the account holder' : 'you'} included. ${
    admin ? 'Deactivate a parent, or the parent changes to a larger plan, to add another.' : 'Deactivate a parent or change to a larger plan to add another.'
  }`;
}

/** Whether one more member could be switched back on (a free place on a plan in force). */
export const hasRoomFor = (limit, family) => family?.planInForce !== false && Boolean(family?.plan) && (limit?.max == null || (limit?.used ?? 0) < limit.max);

/** Where a full family goes to pick a larger plan (the Subscription page opens its plan options). */
export const CHANGE_PLAN_PATH = '/parent/subscription?change=1';

/** Why a plan can't hold the family's ACTIVE members as they are now, or null. `family` = { childrenCount, parentsCount }. */
export function planFitReason(plan, family) {
  if (!plan || !family) return null;
  if (plan.maxChildren != null && family.childrenCount > plan.maxChildren) {
    return `Covers ${count(plan.maxChildren, 'child', 'children')} - you have ${family.childrenCount} active. Deactivate ${count(family.childrenCount - plan.maxChildren, 'child', 'children')} on My Children to choose it.`;
  }
  if (plan.maxParents != null && family.parentsCount > plan.maxParents) {
    return `Includes ${count(plan.maxParents, 'parent', 'parents')} - your family has ${family.parentsCount} active. Deactivate ${count(family.parentsCount - plan.maxParents, 'parent', 'parents')} on My Children to choose it.`;
  }
  return null;
}
