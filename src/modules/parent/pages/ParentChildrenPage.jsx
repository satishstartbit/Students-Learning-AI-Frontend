import { useCallback, useEffect, useMemo } from 'react';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  ButtonGroup,
  Card,
  ConfirmationModal,
  EmptyState,
  Loader,
  PageHeader,
  StatusBadge,
} from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { useModal } from '../../../hooks/useModal';
import { toast } from '../../../hooks/useToast';
import { getErrorMessage } from '../../../utils/errorHandler';
import { formatName } from '../../../utils/format';
import parentService from '../services/parent.service';
import AddChildModal from '../components/AddChildModal';
import EditChildModal from '../components/EditChildModal';
import ChildDetailsModal from '../components/ChildDetailsModal';

/** One child, as a "clean and friendly" card - the ticket's primary layout. */
function ChildCard({ child, onView, onEdit, onRemove }) {
  const subjects = useMemo(
    () => [...new Set((child.teachers ?? []).map((t) => t.subject).filter(Boolean))],
    [child.teachers]
  );

  return (
    <Card className="ui-field">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-md)' }}>
        <Avatar src={child.profileImageUrl} name={formatName(child)} size="lg" />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>{formatName(child)}</div>
          <div className="ui-hint">@{child.username}</div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 'var(--spacing-sm)' }}>
            {child.grade && <Badge variant="neutral">{child.grade}</Badge>}
            <StatusBadge status={child.status} />
            {child.emailVerified ? (
              <Badge variant="success" dot>
                Verified
              </Badge>
            ) : (
              <Badge variant="warning" dot>
                Pending
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 'var(--spacing-md)' }}>
        <span className="ui-hint">Subjects</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
          {subjects.length ? (
            subjects.map((s) => (
              <Badge key={s} variant="primary">
                {s}
              </Badge>
            ))
          ) : (
            <span className="ui-hint">No subjects assigned yet</span>
          )}
        </div>
      </div>

      <div style={{ marginTop: 'var(--spacing-md)' }}>
        <span className="ui-hint">Teachers</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
          {child.teachers?.length ? (
            child.teachers.map((t) => {
              const offGrade = t.grade && child.grade && t.grade !== child.grade;
              return (
                <Badge key={t.id} variant="neutral">
                  {formatName(t.owner)} · {t.subject}
                  {t.grade ? ` · ${t.grade}` : ''}
                  {t.academicYear?.name ? ` · ${t.academicYear.name}` : ''}
                  {offGrade ? ' · off-grade' : ''}
                </Badge>
              );
            })
          ) : (
            <span className="ui-hint">No teachers assigned yet</span>
          )}
        </div>
      </div>

      <ButtonGroup style={{ marginTop: 'var(--spacing-lg)' }}>
        <Button size="sm" onClick={() => onView(child)}>
          View Details
        </Button>
        <Button size="sm" variant="secondary" onClick={() => onEdit(child)}>
          Edit
        </Button>
        <Button size="sm" variant="secondary" onClick={() => onRemove(child)}>
          Remove
        </Button>
      </ButtonGroup>
    </Card>
  );
}

/** /parent/children - the parent's "My Children" hub. */
export default function ParentChildrenPage() {
  const children = useApi(parentService.listChildren);
  const { run: runChildren } = children;

  const addModal = useModal();
  const editModal = useModal();
  const detailsModal = useModal();
  const removeModal = useModal();

  const load = useCallback(() => runChildren({ limit: 100 }), [runChildren]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const handleRemove = async () => {
    try {
      await parentService.removeChild(removeModal.payload.id);
      toast.success('Child removed from your account');
      removeModal.close();
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const rows = children.data ?? [];

  return (
    <>
      <PageHeader
        title="My Children"
        description="View and manage your children, their subjects and their teachers."
        actions={<Button onClick={addModal.open}>+ Add Child</Button>}
      />

      {children.isLoading && rows.length === 0 && <Loader message="Loading your children…" />}

      {children.error && <Alert variant="error">{getErrorMessage(children.error)}</Alert>}

      {!children.isLoading && rows.length === 0 && !children.error && (
        <EmptyState
          icon="👨‍👩‍👧"
          title="No children added yet"
          description="Add your first child to get started - you'll be able to assign teachers and track their subjects right away."
          action={<Button onClick={addModal.open}>+ Add Child</Button>}
        />
      )}

      {rows.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 'var(--spacing-lg)',
          }}
        >
          {rows.map((child) => (
            <ChildCard
              key={child.id}
              child={child}
              onView={(c) => detailsModal.open(c.id)}
              onEdit={(c) => editModal.open(c.id)}
              onRemove={(c) => removeModal.open(c)}
            />
          ))}
        </div>
      )}

      <AddChildModal isOpen={addModal.isOpen} onClose={addModal.close} onCreated={load} />

      <EditChildModal
        isOpen={editModal.isOpen}
        childId={editModal.payload}
        onClose={editModal.close}
        onUpdated={load}
      />

      <ChildDetailsModal
        isOpen={detailsModal.isOpen}
        childId={detailsModal.payload}
        onClose={detailsModal.close}
        onChanged={load}
      />

      <ConfirmationModal
        isOpen={removeModal.isOpen}
        onClose={removeModal.close}
        onConfirm={handleRemove}
        title="Remove this child?"
        message={
          removeModal.payload
            ? `${formatName(removeModal.payload)} will be removed from your account. Their account itself is kept in case another parent or a teacher is still linked to it.`
            : ''
        }
        confirmLabel="Remove"
        variant="danger"
      />
    </>
  );
}
