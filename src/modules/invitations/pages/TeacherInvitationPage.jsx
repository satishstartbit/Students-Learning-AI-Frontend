import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Alert, Badge, Button, Card, EmptyState, Loader, Textarea } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { useAuth } from '../../../hooks/useAuth';
import { toast } from '../../../hooks/useToast';
import { formatDate } from '../../../utils/date';
import { getErrorMessage } from '../../../utils/errorHandler';
import { USER_ROLES } from '../../../utils/constants';
import { formatSubjects, invitationStatusOf } from '../invitationStatus';
import invitationService from '../services/teacherInvitation.service';

/**
 * /invitations/teacher/:token - where a teacher lands from a parent's
 * invitation email (Accept / Decline both link here, with ?action=).
 *
 * Works signed in or out, so it is not behind the signed-out-only guard the
 * other public pages use:
 *
 *   signed in as the invited teacher   Accept / Decline right here
 *   signed out, has an account         Sign in to accept (comes back here)
 *   signed out, no account yet         Create a teacher account (RegisterPage
 *                                      with ?invite=) - that accepts it too
 *   anyone holding the link            Decline, no account needed
 *
 * Accepting is always a button press here, never the email link itself -
 * mail scanners open links, and must not accept on the teacher's behalf.
 */

function Detail({ label, children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--spacing-md)', padding: '8px 0', borderBottom: '1px solid var(--color-border-default)' }}>
      <span className="ui-hint" style={{ margin: 0 }}>
        {label}
      </span>
      <strong style={{ textAlign: 'right' }}>{children}</strong>
    </div>
  );
}

export default function TeacherInvitationPage() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, role, isAuthenticated, isReady, signOut } = useAuth();

  const invitation = useApi(invitationService.getByToken, { immediate: true, args: [token] });
  const [declining, setDeclining] = useState(searchParams.get('action') === 'decline');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(null);
  const [outcome, setOutcome] = useState(null);

  // Wait for a stored session to be restored, so a signed-in teacher isn't briefly shown "Sign in".
  if (!isReady || (invitation.isLoading && !invitation.data)) return <Loader message="Loading your invitation…" />;
  if (!invitation.data) {
    return (
      <Card>
        <EmptyState
          icon="✉"
          title="This invitation link isn't valid"
          description={getErrorMessage(invitation.error) || 'It may have been replaced by a newer invitation. Check your email for the latest one.'}
        />
      </Card>
    );
  }

  const inv = invitation.data;
  const status = invitationStatusOf(inv.status);
  const here = `/invitations/teacher/${token}`;
  const signedInAsInvitee =
    isAuthenticated && role === USER_ROLES.TEACHER && user?.email?.toLowerCase() === inv.teacherEmail?.toLowerCase();

  const run = async (kind, fn, success) => {
    setBusy(kind);
    try {
      await fn();
      setOutcome(kind);
      toast.success(success);
    } catch (err) {
      toast.error(getErrorMessage(err));
      invitation.run(token).catch(() => {});
    } finally {
      setBusy(null);
    }
  };

  if (outcome === 'accepted') {
    return (
      <Card>
        <EmptyState
          icon="✓"
          title="You're connected"
          description={`You can now see ${inv.student?.firstName ?? 'the student'} on your My Students page.`}
          action={
            <Button as={Link} to="/teacher/students">
              Go to My Students
            </Button>
          }
        />
      </Card>
    );
  }
  if (outcome === 'declined') {
    return (
      <Card>
        <EmptyState
          icon="✓"
          title="Invitation declined"
          description={`We've let ${inv.invitedBy?.name ?? 'the parent'} know. Nothing was shared with you.`}
        />
      </Card>
    );
  }

  const details = (
    <div className="ui-field" data-testid="invitation-details">
      <Detail label="Invited by">{inv.invitedBy?.name ?? '—'}</Detail>
      <Detail label="Student">
        {inv.student?.firstName ?? '—'}
        {inv.grade ?? inv.student?.grade ? ` · ${inv.grade ?? inv.student.grade}` : ''}
      </Detail>
      <Detail label={inv.subjects.length === 1 ? 'Subject' : 'Subjects'}>{formatSubjects(inv.subjects)}</Detail>
      <Detail label="Sent to">{inv.teacherEmail}</Detail>
      {inv.status === 'pending' && <Detail label="Expires">{formatDate(inv.expiresAt)}</Detail>}
    </div>
  );

  // Already answered, expired or cancelled - nothing left to do here.
  if (inv.status !== 'pending') {
    const text = {
      accepted: 'This invitation has already been accepted.',
      declined: 'This invitation was declined.',
      expired: 'This invitation has expired. Ask the parent to send it again if you would still like to connect.',
      cancelled: 'The parent cancelled this invitation.',
    }[inv.status];
    return (
      <Card title="Invitation to connect" actions={<Badge variant={status.variant}>{status.label}</Badge>}>
        {details}
        <Alert variant="info">{text}</Alert>
        {inv.status === 'accepted' && signedInAsInvitee && (
          <Button as={Link} to="/teacher/students" style={{ marginTop: 'var(--spacing-md)' }}>
            Go to My Students
          </Button>
        )}
      </Card>
    );
  }

  const declineForm = (
    <div className="ui-field" data-testid="decline-form">
      <Textarea
        label="Anything the parent should know? (optional)"
        hint="For example, if the invitation reached the wrong teacher."
        rows={3}
        maxLength={500}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
        <Button
          variant="danger"
          loading={busy === 'declined'}
          disabled={Boolean(busy)}
          onClick={() => run('declined', () => invitationService.declineByToken(token, reason), 'Invitation declined')}
        >
          Decline invitation
        </Button>
        <Button variant="secondary" disabled={Boolean(busy)} onClick={() => setDeclining(false)}>
          Back
        </Button>
      </div>
    </div>
  );

  let respond;
  if (declining) {
    respond = declineForm;
  } else if (signedInAsInvitee) {
    respond = (
      <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
        <Button
          loading={busy === 'accepted'}
          disabled={Boolean(busy)}
          onClick={() => run('accepted', () => invitationService.acceptByToken(token), 'Invitation accepted')}
        >
          Accept invitation
        </Button>
        <Button variant="secondary" disabled={Boolean(busy)} onClick={() => setDeclining(true)}>
          Decline
        </Button>
      </div>
    );
  } else if (isAuthenticated) {
    // Signed in, but as someone else (another teacher, or a parent account).
    respond = (
      <>
        <Alert variant="warning" className="ui-field">
          You&apos;re signed in as {user?.email}. This invitation was sent to {inv.teacherEmail} - sign in with that
          teacher account to accept it.
        </Alert>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
          <Button
            onClick={async () => {
              await signOut();
              navigate('/login', { state: { from: { pathname: here } } });
            }}
          >
            Switch account
          </Button>
          <Button variant="secondary" onClick={() => setDeclining(true)}>
            Decline
          </Button>
        </div>
      </>
    );
  } else if (inv.emailInUseByOtherRole) {
    respond = (
      <>
        <Alert variant="warning" className="ui-field">
          {inv.teacherEmail} belongs to an account that isn&apos;t a teacher account, so it can&apos;t accept this
          invitation. Ask the parent to invite the email address you use as a teacher.
        </Alert>
        <Button variant="secondary" onClick={() => setDeclining(true)}>
          Decline
        </Button>
      </>
    );
  } else {
    respond = (
      <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
        {inv.hasAccount ? (
          <Button onClick={() => navigate('/login', { state: { from: { pathname: here } } })}>Sign in to accept</Button>
        ) : (
          <Button as={Link} to={`/register?invite=${encodeURIComponent(token)}`}>
            Create your account to accept
          </Button>
        )}
        <Button variant="secondary" onClick={() => setDeclining(true)}>
          Decline
        </Button>
      </div>
    );
  }

  return (
    <Card
      title="Invitation to connect"
      subtitle={`${inv.invitedBy?.name ?? 'A parent'} invited you to connect with ${inv.student?.firstName ?? 'their child'}.`}
      actions={<Badge variant={status.variant}>{status.label}</Badge>}
    >
      {details}
      {!signedInAsInvitee && !isAuthenticated && !declining && (
        <p className="ui-hint">
          {inv.hasAccount
            ? 'Sign in with the account for this email address, then accept.'
            : "You don't have an account yet - creating one takes a couple of minutes and accepts this invitation."}{' '}
          You can decline without an account.
        </p>
      )}
      {respond}
    </Card>
  );
}
