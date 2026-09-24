/**
 * Display for a teacher invitation's status - shared by the parent, teacher
 * and Super Admin views so a status always reads the same way.
 */
export const INVITATION_STATUS = Object.freeze({
  // A parent's request, waiting for Super Admin to review it - the teacher
  // hasn't been emailed yet.
  awaiting_approval: { label: 'Awaiting approval', variant: 'info' },
  pending: { label: 'Pending', variant: 'warning' },
  accepted: { label: 'Accepted', variant: 'success' },
  declined: { label: 'Declined', variant: 'danger' },
  expired: { label: 'Expired', variant: 'neutral' },
  cancelled: { label: 'Cancelled', variant: 'neutral' },
  // Super Admin turned the request down; the teacher was never contacted.
  rejected: { label: 'Not approved', variant: 'danger' },
});

export const INVITATION_STATUS_OPTIONS = Object.entries(INVITATION_STATUS).map(([value, { label }]) => ({ value, label }));

export function invitationStatusOf(status) {
  return INVITATION_STATUS[status] ?? { label: status, variant: 'neutral' };
}

/** "Mathematics", "Mathematics and Science", "Art, Music and Science" */
export function formatSubjects(subjects = []) {
  const list = subjects.filter(Boolean);
  if (list.length <= 1) return list[0] ?? '';
  return `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`;
}
