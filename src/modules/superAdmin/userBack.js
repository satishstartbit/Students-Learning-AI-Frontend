import { listAddress } from '../../utils/listQuery.js';
import { ROLE_LABELS, listPathForRole } from '../../utils/constants.js';

/**
 * Router state for a link to a user's record (`<Link to=… state={backTo(…)}>`):
 * where that record's Back button returns, e.g. the parent whose family panel
 * opened a child's record.
 */
export const backTo = (path, label) => ({ backTo: path, backLabel: label });

/**
 * Where a user record's Back button goes: the page that opened it (from
 * `backTo` state), otherwise the role's list - both as they were left
 * (utils/listQuery#listAddress keeps filters, sort and page).
 */
export function userBackTarget(state, role) {
  if (typeof state?.backTo === 'string' && state.backTo.startsWith('/admin/')) {
    return { to: listAddress(state.backTo), label: state.backLabel || 'Back' };
  }
  return { to: listAddress(listPathForRole(role)), label: `Back to ${ROLE_LABELS[role] ?? 'User'}s` };
}
