/**
 * Where a teacher invitation has got to, as steps a family can follow
 * (My Children, 2026-10-19: "show the request on the parent side to check
 * the progress"):
 *
 *   a parent's request   Requested → Approved → Teacher's answer
 *   Super Admin's        Sent by the platform team → Teacher's answer
 *
 * Each step: { key, label, state: 'done' | 'current' | 'todo' | 'stopped', at }.
 * Pure - the dates stay ISO strings; the component formats them.
 */
const fromPlatform = (inv) => inv?.invitedBy?.role === 'SUPER_ADMIN';

function answerStep(inv) {
  switch (inv.status) {
    case 'accepted':
      return { key: 'answer', label: 'Teacher accepted - connected', state: 'done', at: inv.respondedAt };
    case 'declined':
      return { key: 'answer', label: 'Teacher declined', state: 'stopped', at: inv.respondedAt };
    case 'expired':
      return { key: 'answer', label: 'No answer - it expired', state: 'stopped', at: inv.expiresAt };
    case 'cancelled':
      return { key: 'answer', label: 'Cancelled', state: 'stopped', at: null };
    case 'pending':
      return { key: 'answer', label: 'Waiting for the teacher', state: 'current', at: null };
    default:
      return { key: 'answer', label: 'Teacher answers', state: 'todo', at: null };
  }
}

export function invitationSteps(inv) {
  if (!inv) return [];
  if (fromPlatform(inv)) {
    return [{ key: 'sent', label: 'Sent by the platform team', state: 'done', at: inv.lastSentAt ?? inv.createdAt }, answerStep(inv)];
  }
  const review =
    inv.status === 'awaiting_approval'
      ? { key: 'review', label: 'Being reviewed', state: 'current', at: null }
      : inv.status === 'rejected'
        ? { key: 'review', label: 'Not approved', state: 'stopped', at: inv.respondedAt }
        : inv.status === 'cancelled' && !inv.approvedAt
          ? { key: 'review', label: 'Withdrawn', state: 'stopped', at: null }
          : { key: 'review', label: 'Approved and sent', state: 'done', at: inv.approvedAt ?? inv.lastSentAt };
  const steps = [{ key: 'requested', label: 'Requested', state: 'done', at: inv.createdAt }, review];
  // A request stopped at review never reached the teacher: no answer step.
  if (review.state === 'stopped') return steps;
  return [...steps, review.state === 'current' ? { key: 'answer', label: 'Teacher answers', state: 'todo', at: null } : answerStep(inv)];
}

/**
 * The parent's subject list (GET /parent/children/:id/teacher-subjects): only
 * subjects that can still get a teacher this year, plus the others with why
 * they aren't offered.
 */
export function subjectChoices(availability) {
  const subjects = availability?.subjects ?? [];
  return {
    options: subjects.filter((s) => s.available).map((s) => ({ value: s.name, label: s.name })),
    taken: subjects
      .filter((s) => !s.available)
      .map((s) => ({
        name: s.name,
        why:
          s.reason === 'connected'
            ? `taught by ${s.teacherName}`
            : s.reason === 'requested'
              ? 'a request is waiting for approval'
              : `invitation sent to ${s.teacherName}`,
      })),
  };
}
