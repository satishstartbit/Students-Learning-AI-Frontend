import { useCallback, useEffect } from 'react';
import {
  Alert,
  Avatar,
  Button,
  EmptyState,
  ConfirmationModal,
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
import invitationService from '../../invitations/services/teacherInvitation.service';
import parentService from '../services/parent.service';
import InviteTeacherModal from './InviteTeacherModal';
import TeacherInvitationsList from './TeacherInvitationsList';

/**
 * "View Details" - the child's own info plus their teachers.
 *
 * A parent connects a teacher by inviting them (InviteTeacherModal); the
 * teacher has to accept before they appear under "Connected teachers". Every
 * invitation's status - pending, accepted, declined, expired, cancelled - is
 * listed underneath, with re-send / cancel for open ones.
 */
export default function ChildDetailsModal({ isOpen, childId, onClose, onChanged }) {
  const detail = useApi(parentService.getChild);
  const invitations = useApi(invitationService.listForChild);
  const inviteModal = useModal();
  const removeModal = useModal();

  const load = useCallback(() => {
    if (childId) {
      detail.run(childId).catch(() => {});
      invitations.run(childId).catch(() => {});
    }
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

  const invitationItems = Array.isArray(invitations.data) ? invitations.data : [];
  // Requests Growing Focus is still reviewing, and invitations already
  // emailed to a teacher - both mean "a teacher is on the way".
  const reviewCount = invitationItems.filter((i) => i.status === 'awaiting_approval').length;
  const sentCount = invitationItems.filter((i) => i.status === 'pending').length;
  const pendingCount = reviewCount + sentCount;

  const columns = [
    { key: 'subject', header: 'Subject', render: (r) => r.subject ?? '—' },
    { key: 'teacher', header: 'Teacher', render: (r) => formatName(r.owner) },
    { key: 'academicYear', header: 'Academic year', render: (r) => r.academicYear?.name ?? '—' },
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
        <Button size="sm" variant="secondary" onClick={() => removeModal.open(r)}>
          Remove
        </Button>
      ),
    },
  ];

  const inviteButton = (
    <Button size="sm" onClick={() => inviteModal.open()}>
      + Invite a teacher
    </Button>
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={child ? formatName(child) : 'Child details'}
        size="lg"
        className="pc-details"
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
            <div className="grid grid-cols-2 gap-3">
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
              title="Connected teachers"
              description="Teachers who accepted your invitation. Each subject they teach is listed on its own row."
              as="h3"
              className="ui-field"
              actions={inviteButton}
            />

            {teacherAssignments.length === 0 ? (
              <EmptyState
                icon="🧑‍🏫"
                title="No teachers connected yet"
                description={
                  pendingCount
                    ? [
                        reviewCount
                          ? `${reviewCount} request${reviewCount === 1 ? ' is' : 's are'} with us for review - we email the teacher once approved.`
                          : null,
                        sentCount
                          ? `${sentCount} invitation${sentCount === 1 ? ' is' : 's are'} waiting for the teacher to accept.`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(' ')
                    : "Invite your child's teachers - we review each request, then email the teacher. They'll appear here once they accept."
                }
                action={pendingCount ? null : inviteButton}
              />
            ) : (
              <Table columns={columns} data={teacherAssignments} rowKey="id" />
            )}

            {invitationItems.length > 0 && (
              <>
                <SectionHeader
                  title="Invitations"
                  description="Every teacher you've invited for this child, and where each invitation stands."
                  as="h3"
                  className="ui-field"
                />
                <TeacherInvitationsList invitations={invitationItems} onChanged={refresh} />
              </>
            )}
            {invitations.error && <Alert variant="error">{getErrorMessage(invitations.error)}</Alert>}
          </>
        )}
      </Modal>

      <InviteTeacherModal
        key={`invite-${inviteModal.isOpen}`}
        isOpen={inviteModal.isOpen}
        child={child}
        onClose={inviteModal.close}
        onInvited={refresh}
      />

      <ConfirmationModal
        isOpen={removeModal.isOpen}
        onClose={removeModal.close}
        onConfirm={handleRemove}
        title="Remove this teacher?"
        message={
          removeModal.payload
            ? `${formatName(removeModal.payload.owner)} will no longer be connected to ${
                child ? formatName(child) : 'this child'
              } for ${removeModal.payload.subject ?? 'this subject'}${
                removeModal.payload.academicYear?.name ? ` (${removeModal.payload.academicYear.name})` : ''
              }. To reconnect later, send them a new invitation.`
            : ''
        }
        confirmLabel="Remove"
        variant="danger"
      />
    </>
  );
}
