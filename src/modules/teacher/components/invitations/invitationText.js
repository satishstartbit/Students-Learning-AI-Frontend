/**
 * Wording for the teacher's Invitations page (pure, tested in
 * invitationText.test.js). Dates arrive already formatted by the caller
 * (utils/date), so these stay free of locale and time zone.
 */

/** Days left before a pending invitation runs out → "Expires today" / "tomorrow" / "in 5 days". */
export function expiryText(daysLeft) {
  if (daysLeft == null) return 'Expires soon';
  if (daysLeft <= 0) return 'Expires today';
  if (daysLeft === 1) return 'Expires tomorrow';
  return `Expires in ${daysLeft} days`;
}

/** Three days or fewer is worth a warning colour. */
export const expiresSoon = (daysLeft) => daysLeft != null && daysLeft <= 3;

/** "Invited by Priya Sharma, parent" / "Sent by Growing Focus for the family". */
export function inviterText(invitedBy) {
  if (!invitedBy?.name) return 'Invited by a parent';
  return invitedBy.role === 'SUPER_ADMIN' ? `Sent by ${invitedBy.name} for the family` : `Invited by ${invitedBy.name}, parent`;
}

/** What happened to an answered invitation: "Accepted Sep 21, 2026", "Expired Sep 10, 2026", "Withdrawn by the family". */
export function outcomeText(status, { respondedOn, expiredOn, sentOn } = {}) {
  if (status === 'accepted') return respondedOn ? `Accepted ${respondedOn}` : 'Accepted';
  if (status === 'declined') return respondedOn ? `Declined ${respondedOn}` : 'Declined';
  if (status === 'expired') return expiredOn ? `Expired ${expiredOn}` : 'Expired';
  if (status === 'cancelled') return 'Withdrawn by the family';
  return sentOn ? `Sent ${sentOn}` : '';
}

/** Counts for the summary strip. */
export function invitationCounts(items = []) {
  const count = (s) => items.filter((i) => i.status === s).length;
  return { pending: count('pending'), accepted: count('accepted'), declined: count('declined'), closed: count('expired') + count('cancelled') };
}
