import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  PageHeader,
  Card,
  Button,
  Badge,
  StatusBadge,
  Loader,
  ErrorState,
  ConfirmationModal,
  Alert,
  Toast,
} from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { useModal } from '../../../hooks/useModal';
import { toast } from '../../../hooks/useToast';
import { formatDateTime } from '../../../utils/date';
import { formatName } from '../../../utils/format';
import { formatPhoneForDisplay } from '../../../utils/phone';
import { formatMailingAddress } from '../../../utils/address';
import { ROLE_LABELS, USER_ROLES, USER_STATUS, listPathForRole } from '../../../utils/constants';
import { emailProblemText } from '../../../utils/emailProblem';
import { getErrorMessage, parseApiError } from '../../../utils/errorHandler';
import adminUserService from '../services/adminUser.service';
import ParentFamilyPanel from '../components/ParentFamilyPanel';
import SetChildPasswordModal from '../../parent/components/SetChildPasswordModal';

/** One labelled value in the detail grid. */
function Field({ label, children }) {
  return (
    <div>
      <p className="ui-statcard__label">{label}</p>
      <div>{children ?? '—'}</div>
    </div>
  );
}

const GRID = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
  gap: 'var(--spacing-lg)',
};

/**
 * Full account view with the administrative actions.
 *
 * Deletion is destructive and irreversible, so it is confirmed by typing the
 * user's email - a single click cannot remove an account. When the API
 * refuses because the account still owns records, the reasons are shown
 * rather than swallowed.
 */
export default function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: user, error, isLoading, run } = useApi(adminUserService.getUser);

  const suspendModal = useModal();
  const deleteModal = useModal();
  const resetModal = useModal();
  const passwordModal = useModal();

  const [busy, setBusy] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [deleteBlockers, setDeleteBlockers] = useState([]);
  // Why the last reset email didn't go out (an email problem code), if it didn't.
  const [resetIssue, setResetIssue] = useState(null);

  const load = useCallback(() => run(id), [run, id]);

  useEffect(() => {
    load().catch(() => {
      /* surfaced through `error` */
    });
  }, [load]);

  // A parent's family: plan, places, children and parents (also decides whether they can be deleted).
  const family = useApi(adminUserService.getParentFamily);
  const { run: runFamily } = family;
  const isParentRecord = user?.role === USER_ROLES.PARENT;
  const loadFamily = useCallback(() => runFamily(id), [runFamily, id]);
  useEffect(() => {
    if (isParentRecord) loadFamily().catch(() => {});
  }, [isParentRecord, loadFamily]);

  /** Runs an admin action, refreshing the record afterwards. */
  const act = async (fn, successMessage) => {
    setBusy(true);
    try {
      await fn();
      toast.success(successMessage);
      await load();
      return true;
    } catch (err) {
      toast.error(getErrorMessage(err));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    setDeleteBlockers([]);

    try {
      await adminUserService.deleteUser(id);
      toast.success('User permanently deleted');
      // Return to the list the deleted account came from.
      navigate(listPathForRole(user?.role), { replace: true });
    } catch (err) {
      const parsed = parseApiError(err);
      // 409 means the account still owns records that must be handled first.
      if (parsed.status === 409 && parsed.errors.length) setDeleteBlockers(parsed.errors);
      else toast.error(parsed.message);
    } finally {
      setBusy(false);
    }
  };

  if (isLoading && !user) return <Loader message="Loading user…" />;
  if (error) return <ErrorState error={error} onRetry={load} />;
  if (!user) return null;

  const isSuspended = user.status === USER_STATUS.SUSPENDED;
  // Students have no email or phone: they sign in with their username, and
  // their password is set here rather than by an emailed link.
  const isStudent = user.role === USER_ROLES.STUDENT;
  // Canada Post block: "JANE DOE / 309-11211 85 ST NW / EDMONTON AB  T5G 0G9".
  const mailingLines = formatMailingAddress(user, { recipient: formatName(user) });
  const needsVerification =
    !user.emailVerified && (user.role === USER_ROLES.TEACHER || user.role === USER_ROLES.PARENT);
  // What the delete dialog asks the admin to type.
  const confirmValue = user.email ?? user.username ?? '';
  // A family's account holder is deleted last: their children and other
  // parents first (the API refuses otherwise - deleting them used to orphan the children).
  const familyData = isParentRecord ? family.data : null;
  const familyLeft =
    familyData?.isAccountHolder
      ? [
          familyData.children?.total ? `${familyData.children.total} ${familyData.children.total === 1 ? 'child' : 'children'}` : null,
          familyData.parents?.total > 1 ? `${familyData.parents.total - 1} other ${familyData.parents.total - 1 === 1 ? 'parent' : 'parents'}` : null,
        ].filter(Boolean)
      : [];

  /*
   * The reset link is created and the user signed out whatever happens to
   * the email - so a failed email is said plainly and stays on the page,
   * instead of "Reset link sent" for a message that never left the server.
   */
  const sendReset = async () => {
    setBusy(true);
    try {
      const { data } = await adminUserService.resetUserPassword(id);
      if (data?.emailSent === false) {
        setResetIssue(data.emailProblem ?? 'unknown');
        toast.error(emailProblemText(data.emailProblem), { title: "The reset email didn't go out" });
      } else {
        setResetIssue(null);
        toast.success(`Reset link sent to ${user.email}. They have been signed out everywhere.`);
      }
      resetModal.close();
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const resendVerification = async () => {
    setBusy(true);
    try {
      const { data } = await adminUserService.resendVerification(id);
      if (data?.emailSent) toast.success(`Verification email sent to ${user.email}`);
      else toast.error('The email could not be sent. Check the email settings on the server, or mark the address as verified.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="td-page">
      <PageHeader
        title={formatName(user)}
        description={isStudent ? `@${user.username} · signs in with username` : user.email}
        breadcrumbs={[
          // Back to the list this account actually belongs to.
          { label: `${ROLE_LABELS[user.role] ?? 'User'}s`, to: listPathForRole(user.role) },
          { label: formatName(user) },
        ]}
        actions={
          <>
            <Button as={Link} to={`/admin/users/${id}/edit`} variant="secondary">
              Edit
            </Button>
            {isStudent ? (
              <Button variant="secondary" onClick={passwordModal.open}>
                Set password
              </Button>
            ) : (
              <Button variant="secondary" onClick={resetModal.open}>
                Reset password
              </Button>
            )}
            {isSuspended ? (
              <Button onClick={() => act(() => adminUserService.reactivateUser(id), 'User reactivated')}>
                Reactivate
              </Button>
            ) : (
              <Button variant="secondary" onClick={suspendModal.open}>
                Suspend
              </Button>
            )}
            <Button variant="danger" onClick={deleteModal.open}>
              Delete
            </Button>
          </>
        }
      />

      {isSuspended && (
        <Alert variant="warning" title="This account is suspended" className="ui-field">
          The user cannot sign in and all their sessions have been revoked.
        </Alert>
      )}

      {resetIssue && (
        <Alert variant="error" title="The reset email didn't go out" className="ui-field" onDismiss={() => setResetIssue(null)}>
          {emailProblemText(resetIssue)} {formatName(user)} has been signed out everywhere and can&apos;t sign in until a
          reset email reaches them. Once email works, send the reset again.
          {/* System status (/admin/system) is switched off for now; put back
              <Link to="/admin/system">Check email on System status</Link> when its route returns. */}
        </Alert>
      )}

      {/* {needsVerification && (
        <Alert variant="warning" title="Email not verified" className="ui-field">
          <p style={{ margin: '0 0 var(--spacing-sm)' }}>
            {formatName(user)} can&apos;t sign in until they enter the code emailed to {user.email}. If it
            never arrived, send a new one, or mark the address as verified if you know it&apos;s theirs.
          </p>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
            <Button size="sm" variant="secondary" onClick={resendVerification} disabled={busy}>
              Resend verification email
            </Button>
            <Button
              size="sm"
              onClick={() => act(() => adminUserService.markEmailVerified(id), 'Email marked as verified')}
              disabled={busy}
            >
              Mark as verified
            </Button>
          </div>
        </Alert>
      )} */}

      <Card title="Account" className="ui-field">
        <div style={GRID}>
          <Field label="Username">{user.username}</Field>
          <Field label="Role">
            <Badge variant="primary">{ROLE_LABELS[user.role] ?? user.role}</Badge>
          </Field>
          <Field label="Status">
            <StatusBadge status={user.status} />
          </Field>
          {!isStudent && (
            <Field label="Email verified">
              {user.emailVerified ? (
                <Badge variant="success" dot>
                  {formatDateTime(user.emailVerifiedAt)}
                </Badge>
              ) : (
                <Badge variant="warning" dot>
                  Not verified
                </Badge>
              )}
            </Field>
          )}
          {!isStudent && <Field label="Phone">{formatPhoneForDisplay(user.phone)}</Field>}
          <Field label="Mailing address">
            {mailingLines.length ? <span style={{ whiteSpace: 'pre-wrap' }}>{mailingLines.join('\n')}</span> : null}
          </Field>
          <Field label="Last login">
            {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Never'}
          </Field>
          <Field label="Created">{formatDateTime(user.createdAt)}</Field>
          <Field label="Active sessions">{user.activeSessions}</Field>
        </div>
      </Card>

      {/* Phase 1 §12: who agreed to which version of the Terms/Privacy, and a child's guardian consent. */}
      {user.consents && user.role !== USER_ROLES.SUPER_ADMIN && (
        <Card title="Consent" subtitle={`Current documents: version ${user.consents.currentVersion}`} className="ui-field">
          <div style={GRID}>
            {isStudent ? (
              <Field label="Parent's consent">
                {user.consents.guardian ? (
                  <Badge variant={user.consents.guardian.current ? 'success' : 'warning'} dot>
                    {[user.consents.guardian.by, formatDateTime(user.consents.guardian.consentedAt), `v${user.consents.guardian.version}`].filter(Boolean).join(' · ')}
                  </Badge>
                ) : (
                  <Badge variant="warning" dot>
                    Not given yet
                  </Badge>
                )}
              </Field>
            ) : (
              <Field label="Terms of Use and Privacy Policy">
                {user.consents.terms ? (
                  <Badge variant={user.consents.terms.current ? 'success' : 'warning'} dot>
                    {`Agreed ${formatDateTime(user.consents.terms.acceptedAt)} · v${user.consents.terms.version}`}
                  </Badge>
                ) : (
                  <Badge variant="warning" dot>
                    Not agreed yet - asked on their next visit
                  </Badge>
                )}
              </Field>
            )}
          </div>
        </Card>
      )}



      {/*
        A parent's children are managed here rather than on the relationships
        page, because adding a child creates the account and the link together.
      */}
      {isParentRecord && (
        <ParentFamilyPanel parent={user} family={family.data} familyError={family.error} onChanged={loadFamily} />
      )}


      {/* --- Suspend ------------------------------------------------------ */}
      <ConfirmationModal
        isOpen={suspendModal.isOpen}
        onClose={suspendModal.close}
        onConfirm={async () => {
          const ok = await act(() => adminUserService.suspendUser(id), 'User suspended');
          if (ok) suspendModal.close();
        }}
        title="Suspend this account?"
        message={`${formatName(user)} will be signed out everywhere and will not be able to sign in. Their data is kept.`}
        confirmLabel="Suspend"
        variant="danger"
        loading={busy}
      />

      {/* --- Admin reset -------------------------------------------------- */}
      <ConfirmationModal
        isOpen={resetModal.isOpen}
        onClose={resetModal.close}
        onConfirm={sendReset}
        title="Send a password reset?"
        message={`${user.email} will be emailed a link to set a new password, and all their sessions will be revoked immediately. You will not see their password.`}
        confirmLabel="Send reset link"
        loading={busy}
      />

      {/* --- Student password (no email to send a link to) ---------------- */}
      <SetChildPasswordModal
        isOpen={passwordModal.isOpen}
        child={isStudent ? user : null}
        onClose={passwordModal.close}
        onUpdated={() => load().catch(() => {})}
        save={adminUserService.setStudentPassword}
      />

      {/* --- Permanent delete --------------------------------------------- */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => {
          deleteModal.close();
          setConfirmEmail('');
          setDeleteBlockers([]);
        }}
        onConfirm={handleDelete}
        title="Permanently delete this account?"
        confirmLabel="Delete permanently"
        variant="danger"
        loading={busy}
        // Typing the exact email is the guard against an accidental delete.
        confirmDisabled={familyLeft.length > 0 || !confirmValue || confirmEmail.trim().toLowerCase() !== confirmValue.toLowerCase()}
      >
        {familyLeft.length > 0 ? (
          <Alert variant="warning" title="Empty the family first" className="ui-field">
            {formatName(user)} still has {familyLeft.join(' and ')} in their family (active or not). Delete them in the
            Children and Parents sections below first - a parent can only be deleted once their family is empty, so no
            child is ever left without a parent.
          </Alert>
        ) : (
          <Alert variant="error" title="This cannot be undone" className="ui-field">
            The account, its profile, relationships, sessions and consent records will be removed.
          </Alert>
        )}

        {deleteBlockers.length > 0 && (
          <Alert variant="warning" title="This account still owns records" className="ui-field">
            <ul style={{ margin: '4px 0 0', paddingLeft: 'var(--spacing-lg)' }}>
              {deleteBlockers.map((b) => (
                <li key={b.field}>{b.message}</li>
              ))}
            </ul>
          </Alert>
        )}

        <label className="ui-label" htmlFor="confirm-email">
          Type <strong>{confirmValue}</strong> to confirm
        </label>
        <input
          id="confirm-email"
          className="ui-input"
          value={confirmEmail}
          onChange={(e) => setConfirmEmail(e.target.value)}
          autoComplete="off"
        />
      </ConfirmationModal>

      <Toast />
    </div>
  );
}
