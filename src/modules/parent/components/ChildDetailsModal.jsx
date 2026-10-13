import { useCallback, useEffect, useState } from 'react';
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
import { formatDate, formatDateTime } from '../../../utils/date';
import { splitCsv } from '../../auth/components/profilePayload';
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
  const [disconnecting, setDisconnecting] = useState(false);

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

  const child = detail.data?.id === childId ? detail.data : null;
  const teacherAssignments = (child?.relationships ?? []).filter(
    (r) => r.relationshipType === 'teacher_student'
  );

  const refresh = () => {
    load();
    onChanged?.();
  };

  const handleRemove = async () => {
    if (disconnecting) return;
    setDisconnecting(true);
    try {
      if (removeModal.payload.allSubjects) {
        await parentService.disconnectTeacher(childId, removeModal.payload.owner.id);
      } else {
        await parentService.removeTeacherAssignment(childId, removeModal.payload.id);
      }
      toast.success(removeModal.payload.allSubjects ? 'Teacher disconnected from this child' : 'Subject connection removed');
      removeModal.close();
      refresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDisconnecting(false);
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
    { key: 'grade', header: 'Grade', render: (r) => r.grade || child?.profile?.grade || '—' },
    { key: 'academicYear', header: 'Academic year', render: (r) => r.academicYear?.name ?? '—' },
    { key: 'createdAt', header: 'Connected on', render: (r) => r.createdAt ? formatDateTime(r.createdAt) : 'Not recorded' },
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
          Remove subject
        </Button>
      ),
    },
  ];

  const teachers = [...new Map(teacherAssignments.filter((r) => r.owner?.id).map((r) => [r.owner.id, r.owner])).values()];

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
                <span className="ui-hint">Signs in with username</span>
                <div>{child.username || '—'}</div>
              </div>
            </div>

            <SectionHeader title="Learning profile" as="h3" className="ui-field" />
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {['subjects', 'strengths', 'challenges', 'interests'].map((field) => (
                <div key={field}>
                  <dt className="ui-hint">{titleCase(field)}</dt>
                  <dd className="m-0">{splitCsv(child.profile?.[field]).join(', ') || 'Not selected in the profile yet'}</dd>
                </div>
              ))}
            </dl>

            <SectionHeader
              title="Connected teachers"
              description="Each teacher’s subjects and connection dates for this child. Remove one subject or disconnect the teacher completely."
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
              <div className="grid gap-4">
                {teachers.map((teacher) => (
                  <section key={teacher.id} className="rounded-xl border border-[var(--color-border-default)] p-3">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <strong>{formatName(teacher)}</strong>
                        <p className="ui-hint m-0 break-all">{teacher.email}</p>
                      </div>
                      <Button size="sm" variant="secondary" onClick={() => removeModal.open({ owner: teacher, allSubjects: true })}>
                        Disconnect teacher
                      </Button>
                    </div>
                    <Table columns={columns} data={teacherAssignments.filter((r) => r.owner?.id === teacher.id)} rowKey="id" />
                  </section>
                ))}
              </div>
            )}

            {child.teacherConnectionHistory?.length > 0 && (
              <>
                <SectionHeader title="Connection history" as="h3" className="ui-field" />
                <ul className="grid list-none gap-3 p-0">
                  {child.teacherConnectionHistory.map((entry) => (
                    <li key={entry.id}>
                      <strong>{entry.teacher?.name || entry.teacher?.email || 'Teacher'}</strong>
                      <p className="ui-hint m-0">Disconnected {formatDateTime(entry.disconnectedAt)}</p>
                      {entry.assignments.map((assignment) => (
                        <p key={assignment.id} className="ui-hint m-0">
                          {assignment.subject || 'All subjects'}{assignment.grade ? ` · ${assignment.grade}` : ''}
                          {assignment.academicYear ? ` · ${assignment.academicYear}` : ''}
                          {assignment.connectedAt ? ` · Connected ${formatDateTime(assignment.connectedAt)}` : ''}
                        </p>
                      ))}
                    </li>
                  ))}
                </ul>
              </>
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
        title={removeModal.payload?.allSubjects ? 'Disconnect this teacher?' : 'Remove this subject connection?'}
        message={
          removeModal.payload
            ? `${formatName(removeModal.payload.owner)} will no longer be connected to ${
                child ? formatName(child) : 'this child'
              } for ${removeModal.payload.allSubjects ? 'all their subjects and academic years' : removeModal.payload.subject ?? 'this subject'}${
                removeModal.payload.academicYear?.name ? ` (${removeModal.payload.academicYear.name})` : ''
              }. Saved work and learning history stay. To reconnect later, send a new invitation.`
            : ''
        }
        confirmLabel={removeModal.payload?.allSubjects ? 'Disconnect teacher' : 'Remove subject'}
        loading={disconnecting}
        variant="danger"
      />
    </>
  );
}
