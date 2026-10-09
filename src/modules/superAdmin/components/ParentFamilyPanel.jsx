import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LuPencil, LuTrash2, LuUserCheck, LuUserX } from 'react-icons/lu';
import {
  Card,
  Button,
  ButtonGroup,
  IconButton,
  Input,
  PasswordInput,
  Badge,
  StatusBadge,
  Alert,
  Modal,
  ConfirmationModal,
  EmptyState,
  Loader,
  SectionHeader,
} from '../../../components/common';
import { Tooltip } from '../../../components/ui/tooltip';
import { useApi } from '../../../hooks/useApi';
import { useForm } from '../../../hooks/useForm';
import { useModal } from '../../../hooks/useModal';
import { toast } from '../../../hooks/useToast';
import { required, password as passwordRule, matches } from '../../../utils/validation';
import { formatName } from '../../../utils/format';
import { formatDate } from '../../../utils/date';
import { getErrorMessage } from '../../../utils/errorHandler';
import adminUserService from '../services/adminUser.service';
import RoleProfileFields from '../../auth/components/RoleProfileFields';
import { buildProfilePayload } from '../../auth/components/profilePayload';
import { usePhotoField } from '../../../hooks/usePhotoField';
import AddParentModal from '../../parent/components/AddParentModal';
import { childLimitReason, hasRoomFor, parentLimitReason, usageLabel } from '../../parent/familyLimits';
import './parentFamilyPanel.css';

const SUBSCRIPTION_STATUS = {
  trialing: 'Free trial',
  active: 'Active',
  past_due: 'Payment due',
};

const EMPTY_CHILD = { firstName: '', lastName: '', password: '', confirmPassword: '' };

/** One person in the family: who, badges, and the row's icon actions. */
function MemberRow({ to, name, meta, badges, actions }) {
  return (
    <li className="fp-row">
      <div className="fp-row__who">
        <Link to={to} className="fp-row__name">
          {name}
        </Link>
        {meta && <div className="ui-hint">{meta}</div>}
      </div>
      <div className="fp-row__badges">{badges}</div>
      {actions && (
        <div className="fp-row__actions">
          <ButtonGroup>{actions}</ButtonGroup>
        </div>
      )}
    </li>
  );
}

function RowAction({ label, icon, variant, onClick, disabled, title }) {
  return (
    <Tooltip label={title ?? label} side="top">
      <IconButton icon={icon} label={label} variant={variant} size="sm" onClick={onClick} disabled={disabled} />
    </Tooltip>
  );
}

/**
 * A parent's family on their record, for Super Admin - the same rules as the
 * parent's own My Children (backend family.service):
 *
 *   - nothing is added before the family has a plan in force: Super Admin
 *     creates the parent, the parent subscribes, then children and parents
 *     can be added - up to the plan's limits;
 *   - only ACTIVE members take a place. Deactivate (always allowed) keeps the
 *     account and history but frees the place - how a family fits a smaller
 *     plan; Activate needs a free place;
 *   - Delete removes a child's or an extra parent's account for good. The
 *     parent themselves can only be deleted once this family is empty.
 *
 * `family` is GET /admin/users/:id/family (loaded by the page, which also
 * uses it for the delete check); `onChanged` reloads it.
 */
export default function ParentFamilyPanel({ parent, family, familyError, onChanged }) {
  const parentId = parent.id;
  const children = useApi(adminUserService.listParentChildren);
  const { run: runChildren } = children;

  const addChildModal = useModal();
  const addParentModal = useModal();
  const deleteModal = useModal(); // payload: { kind: 'child' | 'parent', member }
  const deactivateModal = useModal(); // payload: { kind, member }

  const [busy, setBusy] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const loadChildren = useCallback(() => runChildren(parentId, { limit: 100 }), [runChildren, parentId]);
  useEffect(() => {
    loadChildren().catch(() => {});
  }, [loadChildren]);

  const reload = useCallback(async () => {
    await Promise.all([loadChildren().catch(() => {}), onChanged?.()]);
  }, [loadChildren, onChanged]);

  // --- add a child: a new student account, linked to every parent in the family
  const createPhoto = usePhotoField();
  const childForm = useForm({
    initialValues: EMPTY_CHILD,
    validationSchema: {
      firstName: [required('Enter a first name')],
      password: [required('Choose a password for the student'), passwordRule()],
      confirmPassword: [required('Type the password again'), matches('password')],
    },
    async onSubmit(values) {
      const { data } = await adminUserService.createParentChild(parentId, {
        firstName: values.firstName,
        lastName: values.lastName || null,
        password: values.password,
        confirmPassword: values.confirmPassword,
        profile: buildProfilePayload('STUDENT', values),
        photoFile: createPhoto.file,
      });
      toast.success(`They sign in with the username "${data.username}".`, { title: 'Child added to the family' });
      closeAddChild();
      await reload();
    },
  });
  const closeAddChild = () => {
    addChildModal.close();
    childForm.reset(EMPTY_CHILD);
    createPhoto.reset();
  };

  // --- activate / deactivate / delete
  const setActive = async (kind, member, active) => {
    setBusy(true);
    try {
      if (kind === 'child') await adminUserService.setChildActive(parentId, member.id, active);
      else await adminUserService.setFamilyParentActive(parentId, member.id, active);
      toast.success(
        active ? `${formatName(member)} takes a place on the plan again.` : `${formatName(member)} no longer takes a place on the plan.`,
        { title: active ? `${kind === 'child' ? 'Child' : 'Parent'} activated` : `${kind === 'child' ? 'Child' : 'Parent'} deactivated` }
      );
      deactivateModal.close();
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const confirmValueFor = (payload) => (payload?.kind === 'child' ? payload.member.username : payload?.member.email) ?? '';
  const closeDelete = () => {
    deleteModal.close();
    setConfirmText('');
  };
  const handleDelete = async () => {
    const { kind, member } = deleteModal.payload;
    setBusy(true);
    try {
      await adminUserService.deleteUser(member.id);
      toast.success(`${formatName(member)}'s account was deleted.`, { title: kind === 'child' ? 'Child deleted' : 'Parent deleted' });
      closeDelete();
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (familyError) {
    return (
      <Alert variant="error" className="ui-field">
        {getErrorMessage(familyError)}
      </Alert>
    );
  }
  if (!family) return <Loader message="Loading the family…" />;

  const holderName = formatName(family.accountHolder, { fallback: 'the account holder' });
  const childReason = childLimitReason(family, { admin: true });
  const parentReason = parentLimitReason(family, { admin: true });
  const childRoom = hasRoomFor(family.children, family);
  const parentRoom = hasRoomFor(family.parents, family);
  const rows = children.data ?? [];
  const members = family.members ?? [];
  const extraParents = members.filter((m) => !m.isAccountHolder);
  const subscription = family.subscription;

  let planLine = "No plan yet - the parent hasn't subscribed.";
  if (family.plan) {
    const status = SUBSCRIPTION_STATUS[subscription?.status] ?? 'Not in force';
    const until = subscription?.currentPeriodEnd ? ` · until ${formatDate(subscription.currentPeriodEnd)}` : '';
    planLine = family.planInForce ? `${family.plan.name} · ${status}${until}` : `${family.plan.name} · no longer in force`;
  }

  return (
    <>
      {!family.isAccountHolder && (
        <Alert variant="info" className="ui-field">
          {formatName(parent)} is an extra parent in{' '}
          <Link to={`/admin/users/${family.accountHolder?.id}`}>{holderName}</Link>&apos;s family. The family&apos;s plan,
          children and parents are managed together; changes here apply to the whole family.
        </Alert>
      )}

      <Card title="Family plan" subtitle="Only active children and parents take a place on the plan." className="ui-field">
        <div className="fp-plan">
          <div>
            <p className="ui-statcard__label">Plan</p>
            <div className="fp-plan__value">{planLine}</div>
          </div>
          <div>
            <p className="ui-statcard__label">Children</p>
            <div className="fp-plan__value">{usageLabel(family.children, 'child', 'children')}</div>
          </div>
          <div>
            <p className="ui-statcard__label">Parents</p>
            <div className="fp-plan__value">{usageLabel(family.parents, 'parent', 'parents')}</div>
          </div>
        </div>
        {!family.planInForce && (
          <Alert variant="warning" title="Waiting for a plan" className="fp-plan__alert">
            Children and parents can be added once {holderName} signs in and subscribes to a plan. Whatever they choose sets
            how many active children and parents the family can have.
          </Alert>
        )}
      </Card>

      {/* --- Children ------------------------------------------------------- */}
      <Card
        title="Children"
        subtitle={`Students in ${holderName}'s family`}
        className="ui-field"
        actions={
          <Button size="sm" onClick={addChildModal.open} disabled={Boolean(childReason)}>
            Add child
          </Button>
        }
      >
        {childReason && (
          <Alert variant="info" className="fp-notice">
            {childReason}
          </Alert>
        )}
        {children.isLoading && rows.length === 0 && <Loader message="Loading children…" />}
        {children.error && <Alert variant="error">{getErrorMessage(children.error)}</Alert>}
        {!children.isLoading && rows.length === 0 && !children.error && (
          <EmptyState
            icon="👧"
            title="No children yet"
            description={childReason ? 'Children can be added here once the family has a plan with room.' : 'Add a child to create their student account in this family.'}
          />
        )}

        {rows.length > 0 && (
          <ul className="fp-list">
            {rows.map((child) => (
              <MemberRow
                key={child.id}
                to={`/admin/users/${child.id}`}
                name={formatName(child)}
                meta={`@${child.username}`}
                badges={
                  <>
                    {child.archived ? (
                      <Badge variant="neutral" dot>
                        Inactive
                      </Badge>
                    ) : (
                      <Badge variant="success" dot>
                        Active
                      </Badge>
                    )}
                    {child.status !== 'active' && <StatusBadge status={child.status} />}
                    {!child.lastLoginAt && (
                      <Badge variant="warning" dot>
                        Not signed in yet
                      </Badge>
                    )}
                  </>
                }
                actions={
                  <>
                    <Tooltip label="Edit" side="top">
                      <IconButton icon={<LuPencil aria-hidden="true" />} label="Edit" variant="primary" size="sm" as={Link} to={`/admin/users/${child.id}/edit`} />
                    </Tooltip>
                    {child.archived ? (
                      <RowAction
                        label="Activate"
                        title={childRoom ? 'Activate - takes a place on the plan' : childReason ?? 'No free place on the plan'}
                        icon={<LuUserCheck aria-hidden="true" />}
                        variant="success"
                        disabled={busy || !childRoom}
                        onClick={() => setActive('child', child, true)}
                      />
                    ) : (
                      <RowAction
                        label="Deactivate"
                        icon={<LuUserX aria-hidden="true" />}
                        variant="warning"
                        disabled={busy}
                        onClick={() => deactivateModal.open({ kind: 'child', member: child })}
                      />
                    )}
                    <RowAction
                      label="Delete"
                      icon={<LuTrash2 aria-hidden="true" />}
                      variant="danger"
                      disabled={busy}
                      onClick={() => deleteModal.open({ kind: 'child', member: child })}
                    />
                  </>
                }
              />
            ))}
          </ul>
        )}
      </Card>

      {/* --- Parents -------------------------------------------------------- */}
      <Card
        title="Parents"
        subtitle="The account holder pays; extra parents share the plan."
        className="ui-field"
        actions={
          <Button size="sm" onClick={addParentModal.open} disabled={Boolean(parentReason)}>
            Add parent
          </Button>
        }
      >
        {parentReason && (
          <Alert variant="info" className="fp-notice">
            {parentReason}
          </Alert>
        )}
        <ul className="fp-list">
          {members.map((member) => {
            const isViewed = member.id === parentId;
            const badges = (
              <>
                {member.isAccountHolder ? <Badge variant="primary">Account holder</Badge> : <Badge>Extra parent</Badge>}
                {isViewed && <Badge variant="info">This record</Badge>}
                {member.active === false ? (
                  <Badge variant="neutral" dot>
                    Inactive - no access
                  </Badge>
                ) : (
                  <Badge variant="success" dot>
                    Active
                  </Badge>
                )}
                {!member.emailVerified && (
                  <Badge variant="warning" dot>
                    Invite pending
                  </Badge>
                )}
              </>
            );
            const actions = member.isAccountHolder ? null : (
              <>
                {member.active === false ? (
                  <RowAction
                    label="Activate"
                    title={parentRoom ? 'Activate - takes a parent place on the plan' : parentReason ?? 'No free parent place on the plan'}
                    icon={<LuUserCheck aria-hidden="true" />}
                    variant="success"
                    disabled={busy || !parentRoom}
                    onClick={() => setActive('parent', member, true)}
                  />
                ) : (
                  <RowAction
                    label="Deactivate"
                    icon={<LuUserX aria-hidden="true" />}
                    variant="warning"
                    disabled={busy}
                    onClick={() => deactivateModal.open({ kind: 'parent', member })}
                  />
                )}
                {/* The record being viewed is deleted with the page's own Delete button. */}
                {!isViewed && (
                  <RowAction
                    label="Delete"
                    icon={<LuTrash2 aria-hidden="true" />}
                    variant="danger"
                    disabled={busy}
                    onClick={() => deleteModal.open({ kind: 'parent', member })}
                  />
                )}
              </>
            );
            return (
              <MemberRow key={member.id} to={`/admin/users/${member.id}`} name={formatName(member)} meta={member.email} badges={badges} actions={actions} />
            );
          })}
        </ul>
        {extraParents.length === 0 && <p className="ui-hint fp-empty">No extra parents in this family.</p>}
      </Card>

      {/* --- Add a child ---------------------------------------------------- */}
      <Modal
        isOpen={addChildModal.isOpen}
        onClose={closeAddChild}
        title="Add a child"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={closeAddChild} disabled={childForm.isSubmitting}>
              Cancel
            </Button>
            <Button onClick={childForm.handleSubmit} loading={childForm.isSubmitting}>
              Create and link
            </Button>
          </>
        }
      >
        {childForm.submitError && (
          <Alert variant="error" className="ui-field">
            {childForm.submitError}
          </Alert>
        )}
        <Alert variant="info" className="ui-field">
          The student account is created in {holderName}&apos;s family and linked to every parent in it, taking one child
          place on the plan. Students have no email or phone: they sign in with their username, shown once created, and
          the password you set here.
        </Alert>
        <form onSubmit={childForm.handleSubmit} noValidate>
          <Input label="First name" required {...childForm.getFieldProps('firstName')} />
          <Input label="Last name" {...childForm.getFieldProps('lastName')} />
          <PasswordInput
            label="Password"
            required
            autoComplete="new-password"
            hint="8+ characters with upper case, lower case and a number"
            {...childForm.getFieldProps('password')}
          />
          <PasswordInput label="Confirm password" required autoComplete="new-password" {...childForm.getFieldProps('confirmPassword')} />
          <SectionHeader title="Student profile" as="h3" />
          <RoleProfileFields role="STUDENT" getProps={childForm.getFieldProps} includeAdminOnly photo={createPhoto} />
        </form>
      </Modal>

      {/* --- Add a parent ---------------------------------------------------- */}
      <AddParentModal
        isOpen={addParentModal.isOpen}
        onClose={addParentModal.close}
        onCreated={reload}
        familyName={holderName}
        save={(payload) => adminUserService.addFamilyParent(parentId, payload)}
      />

      {/* --- Deactivate (activate needs no confirmation) --------------------- */}
      <ConfirmationModal
        isOpen={deactivateModal.isOpen}
        onClose={deactivateModal.close}
        onConfirm={() => setActive(deactivateModal.payload.kind, deactivateModal.payload.member, false)}
        loading={busy}
        title={deactivateModal.payload?.kind === 'child' ? 'Deactivate this child?' : 'Deactivate this parent?'}
        confirmLabel="Deactivate"
        message={
          deactivateModal.payload
            ? deactivateModal.payload.kind === 'child'
              ? `${formatName(deactivateModal.payload.member)} keeps their account and everything they saved (the family can still read it), but no longer takes a place on the plan, and planning and AI help stop for them.`
              : `${formatName(deactivateModal.payload.member)} stays in the family but no longer takes a place on the plan, and can't use the app until activated again.`
            : ''
        }
      />

      {/* --- Delete a child or an extra parent ------------------------------- */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDelete}
        onConfirm={handleDelete}
        loading={busy}
        variant="danger"
        title={deleteModal.payload?.kind === 'child' ? 'Delete this child permanently?' : 'Delete this parent permanently?'}
        confirmLabel="Delete permanently"
        confirmDisabled={!confirmValueFor(deleteModal.payload) || confirmText.trim().toLowerCase() !== confirmValueFor(deleteModal.payload).toLowerCase()}
      >
        <Alert variant="error" title="This cannot be undone" className="ui-field">
          {deleteModal.payload?.kind === 'child'
            ? 'The student account, everything they saved and their links to parents and teachers will be removed. To keep their history, deactivate them instead.'
            : "Their account will be removed. The family's children stay with the account holder. To keep the account, deactivate them instead."}
        </Alert>
        <label className="ui-label" htmlFor="family-delete-confirm">
          Type <strong>{confirmValueFor(deleteModal.payload)}</strong> to confirm
        </label>
        <input id="family-delete-confirm" className="ui-input" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" />
      </ConfirmationModal>
    </>
  );
}
