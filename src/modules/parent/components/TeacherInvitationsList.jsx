import { useState } from 'react';
import { Badge, Button, ButtonGroup, ConfirmationModal } from '../../../components/common';
import { useModal } from '../../../hooks/useModal';
import { toast } from '../../../hooks/useToast';
import { formatDate } from '../../../utils/date';
import { getErrorMessage } from '../../../utils/errorHandler';
import { formatSubjects, invitationStatusOf } from '../../invitations/invitationStatus';
import invitationService from '../../invitations/services/teacherInvitation.service';

/** One line of context under each invitation: when it was sent / answered / expires. */
function whenLine(inv) {
  switch (inv.status) {
    // Requests go to Growing Focus first; the teacher is emailed on approval.
    case 'awaiting_approval':
      return `Requested ${formatDate(inv.createdAt)} · we're reviewing it before emailing the teacher`;
    case 'rejected':
      return `Not approved ${formatDate(inv.respondedAt)} - the teacher was not contacted`;
    case 'pending':
      return `Sent ${formatDate(inv.lastSentAt)}${inv.sentCount > 1 ? ` (${inv.sentCount} times)` : ''} · expires ${formatDate(inv.expiresAt)}`;
    case 'accepted':
      return `Accepted ${formatDate(inv.respondedAt)}`;
    case 'declined':
      return `Declined ${formatDate(inv.respondedAt)}`;
    case 'expired':
      return `Expired ${formatDate(inv.expiresAt)} - never answered`;
    case 'cancelled':
      return `Cancelled`;
    default:
      return '';
  }
}

/**
 * Every teacher invitation for one child, newest first, with its status -
 * the parent's own, and any the platform team (Super Admin) sent. The parent
 * can re-send (fresh link and expiry) or cancel the ones they sent. A declined one shows the
 * teacher's note, so a wrong email address is easy to spot and fix with a
 * new invitation.
 */
export default function TeacherInvitationsList({ invitations, onChanged }) {
  const cancelModal = useModal();
  const [busyId, setBusyId] = useState(null);

  const handleResend = async (inv) => {
    setBusyId(inv.id);
    try {
      const { data } = await invitationService.resend(inv.id);
      if (data?.emailSent === false) toast.warning('The email could not be sent. Please try again in a moment.');
      else toast.success(`Invitation re-sent to ${inv.teacherEmail}`);
      onChanged?.();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async () => {
    const inv = cancelModal.payload;
    try {
      await invitationService.cancel(inv.id);
      toast.success('Invitation cancelled');
      cancelModal.close();
      onChanged?.();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (!invitations.length) return null;

  return (
    <>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 'var(--spacing-sm)' }} data-testid="teacher-invitations">
        {invitations.map((inv) => {
          const status = invitationStatusOf(inv.status);
          return (
            <li
              key={inv.id}
              data-status={inv.status}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 'var(--spacing-sm) var(--spacing-md)',
                padding: 'var(--spacing-sm) var(--spacing-md)',
                border: '1px solid var(--color-border-default)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-bg-surface)',
              }}
            >
              <div style={{ flex: '1 1 240px', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', flexWrap: 'wrap' }}>
                  <strong>{inv.teacherName}</strong>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
                <div className="ui-hint" style={{ margin: '2px 0 0', overflowWrap: 'anywhere' }}>
                  {inv.teacherEmail} · {formatSubjects(inv.subjects)}
                  {inv.grade ? ` · ${inv.grade}` : ''}
                </div>
                {!inv.sentByMe && inv.invitedBy && (
                  <div className="ui-hint" style={{ margin: '2px 0 0' }}>
                    Sent by {inv.invitedBy.role === 'SUPER_ADMIN' ? 'the platform team' : inv.invitedBy.name}
                  </div>
                )}
                <div className="ui-hint" style={{ margin: '2px 0 0' }}>
                  {whenLine(inv)}
                </div>
                {inv.status === 'rejected' && inv.reviewNote && (
                  <div className="ui-hint" style={{ margin: '4px 0 0', color: 'var(--color-text-primary)' }}>
                    Our note: &ldquo;{inv.reviewNote}&rdquo; You can send a new request with the details corrected.
                  </div>
                )}
                {inv.status === 'declined' && (
                  <div className="ui-hint" style={{ margin: '4px 0 0', color: 'var(--color-text-primary)' }}>
                    {inv.declineReason ? `Their note: "${inv.declineReason}"` : 'No note left.'} If the email was wrong, send a new
                    invitation.
                  </div>
                )}
              </div>
              {inv.sentByMe && inv.status === 'awaiting_approval' && inv.canCancel && (
                <ButtonGroup>
                  <Button size="sm" variant="secondary" onClick={() => cancelModal.open(inv)}>
                    Withdraw request
                  </Button>
                </ButtonGroup>
              )}
              {inv.sentByMe && (inv.status === 'pending' || inv.status === 'expired') && (
                <ButtonGroup>
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={busyId === inv.id}
                    disabled={!inv.canResend || busyId === inv.id}
                    title={inv.canResend ? undefined : 'Just sent - you can re-send it in a few minutes'}
                    onClick={() => handleResend(inv)}
                  >
                    Re-send
                  </Button>
                  {inv.canCancel && (
                    <Button size="sm" variant="secondary" onClick={() => cancelModal.open(inv)}>
                      Cancel
                    </Button>
                  )}
                </ButtonGroup>
              )}
            </li>
          );
        })}
      </ul>

      <ConfirmationModal
        isOpen={cancelModal.isOpen}
        onClose={cancelModal.close}
        onConfirm={handleCancel}
        title="Cancel this invitation?"
        message={
          cancelModal.payload
            ? `${cancelModal.payload.teacherName} won't be able to accept it. You can send a new invitation later.`
            : ''
        }
        confirmLabel="Cancel invitation"
        cancelLabel="Keep it"
        variant="danger"
      />
    </>
  );
}
