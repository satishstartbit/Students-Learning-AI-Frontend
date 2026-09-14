import { useCallback, useEffect } from 'react';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  ButtonGroup,
  ConfirmationModal,
  EmptyState,
  Loader,
  Modal,
  SectionHeader,
  StatusBadge,
  Table,
} from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { useModal } from '../../../hooks/useModal';
import { toast } from '../../../hooks/useToast';
import { getErrorMessage } from '../../../utils/errorHandler';
import { formatName, titleCase } from '../../../utils/format';
import { formatDate } from '../../../utils/date';
import parentService from '../services/parent.service';
import AssignTeacherModal from './AssignTeacherModal';

/** "View Details" - the child's own info plus their subjects & teachers. */
export default function ChildDetailsModal({ isOpen, childId, onClose, onChanged }) {
  const detail = useApi(parentService.getChild);
  const assignModal = useModal();
  const removeModal = useModal();

  const load = useCallback(() => {
    if (childId) detail.run(childId).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId]);

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen, load]);

  const child = detail.data;
  const teacherAssignments = (child?.relationships ?? []).filter(
    (r) => r.relationshipType === 'teacher_student'
  );

  const refresh = () => {
    load();
    onChanged?.();
  };

  const handleRemove = async () => {
    try {
      await parentService.removeTeacherAssignment(childId, removeModal.payload.id);
      toast.success('Teacher removed');
      removeModal.close();
      refresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const childGrade = child?.profile?.grade ?? null;

  const columns = [
    { key: 'subject', header: 'Subject', render: (r) => r.subject ?? '—' },
    // {
    //   key: 'grade',
    //   header: 'Grade',
    //   render: (r) => (
    //     <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
    //       {r.grade ?? '—'}
    //       {r.grade && childGrade && r.grade !== childGrade && (
    //         <Badge variant="warning">Off-grade</Badge>
    //       )}
    //     </span>
    //   ),
    // },
    { key: 'academicYear', header: 'Academic year', render: (r) => r.academicYear?.name ?? '—' },
    { key: 'teacher', header: 'Teacher', render: (r) => formatName(r.owner) },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => (
        <ButtonGroup>
          <Button size="sm" variant="secondary" onClick={() => assignModal.open(r)}>
            Change teacher
          </Button>
          <Button size="sm" variant="secondary" onClick={() => removeModal.open(r)}>
            Remove
          </Button>
        </ButtonGroup>
      ),
    },
  ];

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={child ? formatName(child) : 'Child details'}
        size="lg"
        footer={<Button onClick={onClose}>Close</Button>}
      >
        {detail.isLoading && !child && <Loader message="Loading child…" />}
        {detail.error && <Alert variant="error">{getErrorMessage(detail.error)}</Alert>}

        {child && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
              <Avatar src={child.profile?.profileImageUrl} name={formatName(child)} size="lg" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{formatName(child)}</div>
                <div className="ui-hint">@{child.username}</div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <StatusBadge status={child.status} />
              </div>
            </div>

            <SectionHeader title="Child information" as="h3" className="ui-field" />
            <div className="grid gap-2 md:grid-cols-2">
              <div>
                <span className="ui-hint">Grade</span>
                <div>{child.profile?.grade || '—'}</div>
              </div>
              <div>
                <span className="ui-hint">Date of birth</span>
                <div>{child.profile?.date_of_birth ? formatDate(child.profile.date_of_birth) : '—'}</div>
              </div>
              <div>
                <span className="ui-hint">Gender</span>
                <div>{child.profile?.gender ? titleCase(child.profile.gender) : '—'}</div>
              </div>
              <div>
                <span className="ui-hint">Email</span>
                <div>{child.email}</div>
              </div>
            </div>

            <SectionHeader
              title="Subjects & teachers"
              as="h3"
              className="ui-field"
              actions={<Button size="sm" onClick={() => assignModal.open(null)}>+ Assign Teacher</Button>}
            />

            {teacherAssignments.length === 0 ? (
              <EmptyState
                icon="🧑‍🏫"
                title="No teachers assigned yet"
                description="Assign a teacher so this child's subjects show up here."
                action={<Button onClick={() => assignModal.open(null)}>+ Assign Teacher</Button>}
              />
            ) : (
              <Table columns={columns} data={teacherAssignments} rowKey="id" />
            )}
          </>
        )}
      </Modal>

      <AssignTeacherModal
        key={`${assignModal.payload?.id ?? 'new'}-${assignModal.isOpen}`}
        isOpen={assignModal.isOpen}
        child={child}
        replacing={assignModal.payload}
        onClose={assignModal.close}
        onAssigned={refresh}
      />

      <ConfirmationModal
        isOpen={removeModal.isOpen}
        onClose={removeModal.close}
        onConfirm={handleRemove}
        title="Remove this teacher?"
        message={
          removeModal.payload
            ? `${formatName(removeModal.payload.owner)} will no longer be assigned to ${
                removeModal.payload.subject
              } (${removeModal.payload.grade}${
                removeModal.payload.academicYear?.name
                  ? `, ${removeModal.payload.academicYear.name}`
                  : ''
              }) for ${child ? formatName(child) : 'this child'}.`
            : ''
        }
        confirmLabel="Remove"
        variant="danger"
      />
    </>
  );
}
