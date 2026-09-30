import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, ButtonGroup, Card, EmptyState, ErrorState, Loader, Modal, PageHeader } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { toast } from '../../../hooks/useToast';
import { formatDate } from '../../../utils/date';
import { getErrorMessage } from '../../../utils/errorHandler';
import { formatSubjects, invitationStatusOf } from '../../invitations/invitationStatus';
import invitationService from '../../invitations/services/teacherInvitation.service';
import DeclineFields from '../../invitations/components/DeclineFields';

/**
 * /teacher/invitations - parents' invitations to connect with their child,
 * for the signed-in teacher (matched by their account email). Pending ones
 * can be accepted or declined here - the same actions as the email link.
 * Accepting links the teacher to that student for the listed subjects.
 */
function InvitationRow({ inv, busy, onAccept, onDecline }) {
  const status = invitationStatusOf(inv.status);
  const pending = inv.status === 'pending';
  return (
    <li
      data-status={inv.status}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 'var(--spacing-sm) var(--spacing-md)',
        padding: 'var(--spacing-md)',
        border: '1px solid var(--color-border-default)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--color-bg-surface)',
      }}
    >
      <div style={{ flex: '1 1 280px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', flexWrap: 'wrap' }}>
          <strong>
            {inv.student?.firstName ?? 'A student'}
            {inv.grade ?? inv.student?.grade ? ` · ${inv.grade ?? inv.student.grade}` : ''}
          </strong>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        <div className="ui-hint" style={{ margin: '2px 0 0' }}>
          {formatSubjects(inv.subjects)} · invited by {inv.invitedBy?.name ?? 'a parent'}
        </div>
        <div className="ui-hint" style={{ margin: '2px 0 0' }}>
          {pending ? `Expires ${formatDate(inv.expiresAt)}` : inv.respondedAt ? `Answered ${formatDate(inv.respondedAt)}` : `Sent ${formatDate(inv.createdAt)}`}
        </div>
      </div>
      {pending && (
        <ButtonGroup>
          <Button size="sm" loading={busy === `accept:${inv.id}`} disabled={Boolean(busy)} onClick={() => onAccept(inv)}>
            Accept
          </Button>
          <Button size="sm" variant="secondary" disabled={Boolean(busy)} onClick={() => onDecline(inv)}>
            Decline
          </Button>
        </ButtonGroup>
      )}
    </li>
  );
}

export default function TeacherInvitationsPage() {
  const list = useApi(invitationService.listMine, { immediate: true });
  const [busy, setBusy] = useState(null);
  const [declining, setDeclining] = useState(null);
  const [answer, setAnswer] = useState({ reason: '', sharedMessage: '' });

  const items = Array.isArray(list.data) ? list.data : [];
  const pending = items.filter((i) => i.status === 'pending');
  const past = items.filter((i) => i.status !== 'pending');
  const reload = () => list.run().catch(() => {});

  const accept = async (inv) => {
    setBusy(`accept:${inv.id}`);
    try {
      await invitationService.accept(inv.id);
      toast.success(`You're now connected with ${inv.student?.firstName ?? 'the student'}`);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
      reload();
    } finally {
      setBusy(null);
    }
  };

  const confirmDecline = async () => {
    setBusy(`decline:${declining.id}`);
    try {
      await invitationService.decline(declining.id, answer);
      toast.success('Invitation declined - the parent has been told');
      setDeclining(null);
      setAnswer({ reason: '', sharedMessage: '' });
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="td-page">
      <PageHeader
        title="Invitations"
        description="Parents invite you to connect with their child. Accept to see that student on your Students page."
      />

      {list.isLoading && !list.data ? (
        <Loader message="Loading invitations…" />
      ) : list.error && !list.data ? (
        <ErrorState title="We couldn't load your invitations" error={list.error} onRetry={reload} />
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            icon="✉"
            title="No invitations yet"
            description="When a parent invites you to connect with their child, it will show up here and in your email."
          />
        </Card>
      ) : (
        <>
          <Card title="Waiting for you" subtitle={`${pending.length} pending`}>
            {pending.length === 0 ? (
              <p className="ui-hint" style={{ margin: 0 }}>
                You&apos;re all caught up. <Link to="/teacher/students">See your students</Link>
              </p>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 'var(--spacing-sm)' }} data-testid="pending-invitations">
                {pending.map((inv) => (
                  <InvitationRow key={inv.id} inv={inv} busy={busy} onAccept={accept} onDecline={setDeclining} />
                ))}
              </ul>
            )}
          </Card>

          {past.length > 0 && (
            <Card title="Earlier" style={{ marginTop: 'var(--spacing-lg)' }}>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 'var(--spacing-sm)' }}>
                {past.map((inv) => (
                  <InvitationRow key={inv.id} inv={inv} busy={busy} onAccept={accept} onDecline={setDeclining} />
                ))}
              </ul>
            </Card>
          )}
        </>
      )}

      <Modal
        isOpen={Boolean(declining)}
        onClose={() => setDeclining(null)}
        title="Decline this invitation?"
        description={
          declining
            ? `${declining.invitedBy?.name ?? 'The parent'} will see that you declined, so they can follow up or correct a mistake.`
            : ''
        }
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeclining(null)} disabled={Boolean(busy)}>
              Back
            </Button>
            <Button variant="danger" loading={busy?.startsWith('decline:')} onClick={confirmDecline}>
              Decline
            </Button>
          </>
        }
      >
        <DeclineFields
          value={answer}
          onChange={setAnswer}
          familyName={declining?.invitedBy?.name ?? 'the family'}
        />
      </Modal>
    </div>
  );
}
