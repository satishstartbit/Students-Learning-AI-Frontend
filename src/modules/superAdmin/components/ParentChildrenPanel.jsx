import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LuPencil, LuUnlink } from 'react-icons/lu';
import {
  Card,
  Button,
  ButtonGroup,
  IconButton,
  Input,
  PasswordInput,
  Select,
  SearchInput,
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
import { useDebounce } from '../../../hooks/useDebounce';
import { toast } from '../../../hooks/useToast';
import { required, password as passwordRule, matches } from '../../../utils/validation';
import { formatName } from '../../../utils/format';
import { getErrorMessage } from '../../../utils/errorHandler';
import adminUserService from '../services/adminUser.service';
import RoleProfileFields from '../../auth/components/RoleProfileFields';
import { buildProfilePayload } from '../../auth/components/profilePayload';
import { usePhotoField } from '../../../hooks/usePhotoField';

/**
 * A parent's children, shown on the parent's own record.
 *
 * Two ways to add one, because they are genuinely different operations:
 *
 *   - Add a child   creates a new student account AND the parent_child link
 *                   in a single transaction, so no student can exist without
 *                   a parent.
 *   - Link existing attaches a student who already has an account (for
 *                   example a second parent, or a child added by mistake
 *                   under the wrong family).
 *
 * Unlinking removes the relationship only - the student account survives, so
 * a child linked to two parents is never destroyed by one of them.
 */
export default function ParentChildrenPanel({ parentId, parentName }) {
  const children = useApi(adminUserService.listParentChildren);
  const { run: runChildren } = children;

  const createModal = useModal();
  const linkModal = useModal();
  const unlinkModal = useModal();

  const [busy, setBusy] = useState(false);

  const load = useCallback(() => runChildren(parentId, { limit: 100 }), [runChildren, parentId]);

  useEffect(() => {
    load().catch(() => {
      /* surfaced through children.error */
    });
  }, [load]);

  // --- create a new child -------------------------------------------------
  // No email or phone: a student signs in with their username and the
  // password set here (backend user.service#createUser).
  const createPhoto = usePhotoField();
  const EMPTY_CHILD = { firstName: '', lastName: '', password: '', confirmPassword: '' };

  const createForm = useForm({
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

      toast.success(`Child created and linked. They sign in with the username "${data.username}".`);
      createModal.close();
      createForm.reset(EMPTY_CHILD);
      createPhoto.reset();
      await load();
    },
  });

  // --- link an existing student -------------------------------------------
  const [studentSearch, setStudentSearch] = useState('');
  const [studentId, setStudentId] = useState('');
  const [linkError, setLinkError] = useState(null);

  const debouncedSearch = useDebounce(studentSearch, 350);
  const candidates = useApi(adminUserService.listUsers);
  const { run: runCandidates } = candidates;

  useEffect(() => {
    if (!linkModal.isOpen) return;

    // Students who do not already belong to a parent - filtered server-side.
    runCandidates({
      role: 'STUDENT',
      status: 'active',
      search: debouncedSearch,
      relationshipType: 'parent_child',
      assigned: false,
      limit: 50,
    }).catch(() => {});
  }, [runCandidates, debouncedSearch, linkModal.isOpen]);

  const candidateOptions = useMemo(
    () =>
      (candidates.data ?? []).map((s) => ({
        value: s.id,
        label: [formatName(s), s.username ? `@${s.username}` : s.email].filter(Boolean).join(' · '),
      })),
    [candidates.data]
  );

  const handleLink = async () => {
    if (!studentId) return setLinkError('Choose a student');

    setBusy(true);
    setLinkError(null);
    try {
      await adminUserService.createRelationship({
        relationshipType: 'parent_child',
        userId: parentId,
        relatedUserId: studentId,
      });

      toast.success('Student linked to this parent');
      linkModal.close();
      setStudentId('');
      setStudentSearch('');
      await load();
    } catch (err) {
      setLinkError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  // --- unlink -------------------------------------------------------------
  const handleUnlink = async () => {
    setBusy(true);
    try {
      await adminUserService.deleteRelationship(unlinkModal.payload.relationshipId);
      toast.success('Child unlinked from this parent');
      unlinkModal.close();
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const rows = children.data ?? [];

  return (
    <>
      <Card
        title="Children"
        subtitle={`Students linked to ${parentName}`}
        className="ui-field"
        actions={
          <ButtonGroup>
            <Button size="sm" onClick={createModal.open}>
              Add child
            </Button>
          </ButtonGroup>
        }
      >
        {children.isLoading && rows.length === 0 && <Loader message="Loading children…" />}

        {children.error && (
          <Alert variant="error">{getErrorMessage(children.error)}</Alert>
        )}

        {!children.isLoading && rows.length === 0 && !children.error && (
          <EmptyState
            icon="👧"
            title="No children added yet"
            description="Add a child to create their student account and link it to this parent."
            action={<Button onClick={createModal.open}>Add child</Button>}
          />
        )}

        {rows.length > 0 && (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {rows.map((child) => (
              <li
                key={child.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-md)',
                  padding: 'var(--spacing-md) 0',
                  borderBottom: '1px solid var(--color-border-default)',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link to={`/admin/users/${child.id}`} style={{ fontWeight: 600 }}>
                    {formatName(child)}
                  </Link>
                  <div className="ui-hint">@{child.username}</div>
                </div>

                <StatusBadge status={child.status} />
                {/* Students have no email to verify - show whether they've signed in. */}
                {!child.lastLoginAt && (
                  <Badge variant="warning" dot>
                    Not signed in yet
                  </Badge>
                )}

                <ButtonGroup>
                  <Tooltip label="Edit" side="top">
                    <IconButton
                      icon={<LuPencil aria-hidden="true" />}
                      label="Edit"
                      variant="primary"
                      size="sm"
                      as={Link}
                      to={`/admin/users/${child.id}/edit`}
                    />
                  </Tooltip>
                  <Tooltip label="Unlink" side="top">
                    <IconButton
                      icon={<LuUnlink aria-hidden="true" />}
                      label="Unlink"
                      variant="danger"
                      size="sm"
                      onClick={() =>
                        unlinkModal.open({
                          child,
                          // The relationship id comes from the parent's own
                          // relationship list, loaded by the detail page.
                          relationshipId: child.relationshipId,
                        })
                      }
                      disabled={!child.relationshipId}
                    />
                  </Tooltip>
                </ButtonGroup>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* --- create a child ------------------------------------------------ */}
      <Modal
        isOpen={createModal.isOpen}
        onClose={createModal.close}
        title="Add a child"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={createModal.close} disabled={createForm.isSubmitting}>
              Cancel
            </Button>
            <Button onClick={createForm.handleSubmit} loading={createForm.isSubmitting}>
              Create and link
            </Button>
          </>
        }
      >
        {createForm.submitError && (
          <Alert variant="error" className="ui-field">
            {createForm.submitError}
          </Alert>
        )}

        <Alert variant="info" className="ui-field">
          The student account and its link to {parentName} are created together. Students have no
          email or phone: they sign in with their username, shown once created, and the password
          you set here.
        </Alert>

        <form onSubmit={createForm.handleSubmit} noValidate>
          <Input label="First name" required {...createForm.getFieldProps('firstName')} />
          <Input label="Last name" {...createForm.getFieldProps('lastName')} />
          <PasswordInput
            label="Password"
            required
            autoComplete="new-password"
            hint="8+ characters with upper case, lower case and a number"
            {...createForm.getFieldProps('password')}
          />
          <PasswordInput
            label="Confirm password"
            required
            autoComplete="new-password"
            {...createForm.getFieldProps('confirmPassword')}
          />

          <SectionHeader title="Student profile" as="h3" />
          <RoleProfileFields
            role="STUDENT"
            getProps={createForm.getFieldProps}
            includeAdminOnly
            photo={createPhoto}
          />
        </form>
      </Modal>

      {/* --- link an existing student --------------------------------------- */}
      <Modal
        isOpen={linkModal.isOpen}
        onClose={linkModal.close}
        title="Link an existing student"
        footer={
          <>
            <Button variant="secondary" onClick={linkModal.close} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={handleLink} loading={busy} disabled={!studentId}>
              Link student
            </Button>
          </>
        }
      >
        {linkError && (
          <Alert variant="error" className="ui-field">
            {linkError}
          </Alert>
        )}

        <SearchInput
          label="Find a student"
          placeholder="Name or username"
          value={studentSearch}
          onChange={(e) => setStudentSearch(e.target.value)}
          onClear={() => setStudentSearch('')}
        />

        <Select
          label="Student"
          options={candidateOptions}
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          placeholder={candidates.isLoading ? 'Loading…' : 'Select a student'}
          loading={candidates.isLoading}
          hint="Only students who do not already have a parent are listed."
          required
        />
      </Modal>

      {/* --- unlink --------------------------------------------------------- */}
      <ConfirmationModal
        isOpen={unlinkModal.isOpen}
        onClose={unlinkModal.close}
        onConfirm={handleUnlink}
        title="Unlink this child?"
        message={
          unlinkModal.payload
            ? `${formatName(unlinkModal.payload.child)} will no longer be linked to ${parentName}. The student account itself is kept.`
            : ''
        }
        confirmLabel="Unlink"
        variant="danger"
        loading={busy}
      />
    </>
  );
}
