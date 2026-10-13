import { session } from './storage';

/**
 * Why the app signed someone out, for the sign-in page to say (it survives the
 * redirect, not a new tab). Today: a child or extra parent whose family has no
 * plan in force (backend subscriptionAccess.service#signInBlock, error code
 * FAMILY_PLAN_INACTIVE) - signed out on their next request, wherever they were.
 */
export const FAMILY_PLAN_INACTIVE = 'FAMILY_PLAN_INACTIVE';
const KEY = 'eflp.signOutReason';

/** The API error's FAMILY_PLAN_INACTIVE detail (`errors` from the response body), or null. */
export function familyPlanProblem(errors) {
  return (Array.isArray(errors) ? errors : []).find((e) => e?.code === FAMILY_PLAN_INACTIVE) ?? null;
}

/**
 * Fired when a reason is remembered. Parallel requests race: one can come back
 * "session ended" (the server already signed them out) and open /login before
 * the one that says why arrives - the sign-in page listens for it.
 */
export const SIGN_OUT_REASON_EVENT = 'eflp:sign-out-reason';

export function rememberSignOutReason(reason) {
  const value = { code: reason.code, message: reason.message ?? null, at: Date.now() };
  session.set(KEY, value);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(SIGN_OUT_REASON_EVENT, { detail: value }));
}

/** The reason, if any, from the last 10 minutes (read without forgetting it - React may render twice). */
export function peekSignOutReason() {
  const value = session.get(KEY);
  if (!value || typeof value !== 'object' || Date.now() - Number(value.at ?? 0) > 10 * 60_000) return null;
  return value;
}

/** Once shown. */
export function forgetSignOutReason() {
  session.remove(KEY);
}
