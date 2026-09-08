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
  EmptyState,
  Toast,
} from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { useModal } from '../../../hooks/useModal';
import { toast } from '../../../hooks/useToast';
import { formatDateTime } from '../../../utils/date';
import { formatName, titleCase } from '../../../utils/format';
import { ROLE_LABELS, USER_ROLES, USER_STATUS, listPathForRole } from '../../../utils/constants';
import { getErrorMessage, parseApiError } from '../../../utils/errorHandler';
import adminUserService from '../services/adminUser.service';
import ParentChildrenPanel from '../components/ParentChildrenPanel';

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

  const [busy, setBusy] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [deleteBlockers, setDeleteBlockers] = useState([]);

  const load = useCallback(() => run(id), [run, id]);

  useEffect(() => {
    load().catch(() => {
      /* surfaced through `error` */
    });
  }, [load]);

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

  return (
    <>
      <PageHeader
        title={formatName(user)}
        description={user.email}
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
            <Button variant="secondary" onClick={resetModal.open}>
              Reset password
            </Button>
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

      <Card title="Account" className="ui-field">
        <div style={GRID}>
          <Field label="Role">
            <Badge variant="primary">{ROLE_LABELS[user.role] ?? user.role}</Badge>
          </Field>
          <Field label="Status">
            <StatusBadge status={user.status} />
          </Field>
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
          <Field label="Phone">{user.phone}</Field>
          <Field label="Last login">
            {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Never'}
          </Field>
          <Field label="Created">{formatDateTime(user.createdAt)}</Field>
          <Field label="Active sessions">{user.activeSessions}</Field>
        </div>
      </Card>

      {user.profile && (
        <Card title={`${ROLE_LABELS[user.role]} profile`} className="ui-field">
          <div style={GRID}>
            {Object.entries(user.profile)
              .filter(([key]) => !key.endsWith('_at'))
              .map(([key, value]) => (
                <Field key={key} label={titleCase(key)}>
                  {typeof value === 'object' && value !== null ? (
                    <pre
                      style={{
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        fontSize: 'var(--font-size-sm)',
                      }}
                    >
                      {JSON.stringify(value, null, 2)}
                    </pre>
                  ) : (
                    (value ?? '—')
                  )}
                </Field>
              ))}
          </div>
        </Card>
      )}

      {/*
        A parent's children are managed here rather than on the relationships
        page, because adding a child creates the account and the link together.
      */}
      {user.role === USER_ROLES.PARENT && (
        <ParentChildrenPanel parentId={user.id} parentName={formatName(user)} />
      )}

      <Card title="Relationships" className="ui-field">
        {user.relationships.length === 0 ? (
          <EmptyState
            icon="🔗"
            title="No relationships"
            description="This user is not linked to anyone yet."
            action={
              <Button as={Link} to="/admin/relationships" variant="secondary">
                Manage relationships
              </Button>
            }
          />
        ) : (
          <ul style={{ margin: 0, paddingLeft: 'var(--spacing-lg)' }}>
            {user.relationships.map((rel) => (
              <li key={rel.id} style={{ marginBottom: 'var(--spacing-sm)' }}>
                <Badge variant="info">{titleCase(rel.relationshipType)}</Badge>{' '}
                {formatName(rel.owner)} → {formatName(rel.related)}
              </li>
            ))}
          </ul>
        )}
      </Card>

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
        onConfirm={async () => {
          const ok = await act(
            () => adminUserService.resetUserPassword(id),
            'Reset link sent and sessions revoked'
          );
          if (ok) resetModal.close();
        }}
        title="Send a password reset?"
        message={`${user.email} will be emailed a link to set a new password, and all their sessions will be revoked immediately. You will not see their password.`}
        confirmLabel="Send reset link"
        loading={busy}
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
        confirmDisabled={confirmEmail.trim().toLowerCase() !== user.email.toLowerCase()}
      >
        <Alert variant="error" title="This cannot be undone" className="ui-field">
          The account, its profile, relationships, sessions and consent records will be removed.
        </Alert>

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
          Type <strong>{user.email}</strong> to confirm
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
    </>
  );
}
