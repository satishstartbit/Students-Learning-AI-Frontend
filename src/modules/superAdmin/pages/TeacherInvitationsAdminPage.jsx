import { useCallback, useEffect, useState } from 'react';
import { LuBan, LuCheck, LuFilterX, LuSend, LuX } from 'react-icons/lu';
import {
  Alert,
  Badge,
  Button,
  ConfirmationModal,
  DataTable,
  FilterBar,
  IconButton,
  Modal,
  PageHeader,
  SearchInput,
  Select,
  Textarea,
} from '../../../components/common';
import { Tooltip } from '../../../components/ui/tooltip';
import { useApi } from '../../../hooks/useApi';
import { useDebounce } from '../../../hooks/useDebounce';
import { usePagination } from '../../../hooks/usePagination';
import { toast } from '../../../hooks/useToast';
import { formatDate } from '../../../utils/date';
import { getErrorMessage } from '../../../utils/errorHandler';
import { INVITATION_STATUS_OPTIONS, formatSubjects, invitationStatusOf } from '../../invitations/invitationStatus';
import invitationService from '../../invitations/services/teacherInvitation.service';

/**
 * /admin/relationships/invitations - every teacher invitation, whoever sent
 * it (a parent, or Super Admin via Invite Teachers on the Assignments page).
 * Nobody links a teacher directly; a teacher is connected only by accepting.
 * Pending/expired invitations can be re-sent or cancelled here.
 *
 * A parent's REQUEST (awaiting approval) is reviewed here (2026-10-19 - the
 * old Requests page was removed on 1 Oct, leaving requests stuck): Approve &
 * send emails the invitation to the teacher; Reject needs a note the family
 * sees. A banner says how many are waiting. The server re-checks one teacher
 * per subject on approval (409 with the reason).
 */
const NOTE_MIN = 5;

export default function TeacherInvitationsAdminPage() {
  const pagination = usePagination();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [acting, setActing] = useState(false);
  const [rejecting, setRejecting] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [rejectTried, setRejectTried] = useState(false);

  // How many parent requests are waiting, for the banner (whatever the filters).
  const waiting = useApi(invitationService.adminList);
  const { run: runWaiting } = waiting;
  const loadWaiting = useCallback(() => runWaiting({ page: 1, limit: 1, status: 'awaiting_approval' }).catch(() => {}), [runWaiting]);
  useEffect(() => {
    loadWaiting();
  }, [loadWaiting]);
  const waitingCount = Number(waiting.meta?.total ?? 0);

  const debouncedSearch = useDebounce(search, 350);
  const { data, meta, error, isLoading, run } = useApi(invitationService.adminList);
  const { page, limit, applyMeta, goToPage } = pagination;

  const load = useCallback(() => run({ page, limit, search: debouncedSearch, status }), [run, page, limit, debouncedSearch, status]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  useEffect(() => {
    if (meta?.total !== undefined) applyMeta(meta);
  }, [meta, applyMeta]);

  const resetTo = (setter) => (value) => {
    setter(value);
    goToPage(1);
  };

  const runAction = async () => {
    if (!confirm) return;
    setActing(true);
    try {
      if (confirm.type === 'approve') {
        const res = await invitationService.adminApprove(confirm.item.id);
        if (res?.data?.emailSent === false) toast.warning('Approved, but the email could not be sent. Re-send it from this list.');
        else toast.success(`Approved - the invitation was emailed to ${confirm.item.teacherEmail}. The family has been told.`);
      } else if (confirm.type === 'resend') {
        const res = await invitationService.adminResend(confirm.item.id);
        if (res?.data?.emailSent === false) toast.warning('The invitation was renewed, but the email could not be sent.');
        else toast.success(`Invitation re-sent to ${confirm.item.teacherEmail}`);
      } else {
        await invitationService.adminCancel(confirm.item.id);
        toast.success('Invitation cancelled');
      }
      setConfirm(null);
      load().catch(() => {});
      loadWaiting();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActing(false);
    }
  };

  const rejectNoteError = rejectNote.trim().length < NOTE_MIN ? 'Tell the family why (at least 5 characters) - they see this note' : null;
  const closeReject = () => {
    if (acting) return;
    setRejecting(null);
    setRejectNote('');
    setRejectTried(false);
  };
  const runReject = async () => {
    setRejectTried(true);
    if (rejectNoteError || !rejecting) return;
    setActing(true);
    try {
      await invitationService.adminReject(rejecting.id, rejectNote.trim());
      toast.success('Request not approved - the family has been told why.');
      setRejecting(null);
      setRejectNote('');
      setRejectTried(false);
      load().catch(() => {});
      loadWaiting();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActing(false);
    }
  };

  const studentName = (row) => [row?.student?.firstName, row?.student?.lastName].filter(Boolean).join(' ');

  const columns = [
    {
      key: 'teacher',
      header: 'Teacher invited',
      render: (row) => (
        <div style={{ minWidth: 0 }}>
          <strong>{row.teacherName}</strong>
          <div className="ui-hint" style={{ margin: 0, overflowWrap: 'anywhere' }}>
            {row.teacherEmail}
          </div>
        </div>
      ),
    },
    {
      key: 'student',
      header: 'Student',
      render: (row) => (
        <div style={{ minWidth: 0 }}>
          {[row.student?.firstName, row.student?.lastName].filter(Boolean).join(' ') || '—'}
          {row.grade && (
            <div className="ui-hint" style={{ margin: 0 }}>
              {row.grade}
              {row.academicYear ? ` · ${row.academicYear.name}` : ''}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'parent',
      header: 'Invited by',
      render: (row) => (
        <div style={{ minWidth: 0 }}>
          {row.invitedBy?.name ?? '—'}
          <div className="ui-hint" style={{ margin: 0, overflowWrap: 'anywhere' }}>
            {row.inviterEmail}
          </div>
        </div>
      ),
    },
    { key: 'subjects', header: 'Subjects', render: (row) => formatSubjects(row.subjects) },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const s = invitationStatusOf(row.status);
        return (
          <div>
            <Badge variant={s.variant}>{s.label}</Badge>
            {/* Private feedback (never shown to the family) vs. the message the teacher shared (PDF Q7). */}
            {row.declineReason && (
              <div className="ui-hint" style={{ margin: '2px 0 0' }} title={`Private feedback: ${row.declineReason}`}>
                Private: “{row.declineReason.length > 40 ? `${row.declineReason.slice(0, 40)}…` : row.declineReason}”
              </div>
            )}
            {row.declineMessage && (
              <div className="ui-hint" style={{ margin: '2px 0 0' }} title={`Shared with the family: ${row.declineMessage}`}>
                To family: “{row.declineMessage.length > 40 ? `${row.declineMessage.slice(0, 40)}…` : row.declineMessage}”
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'when',
      header: 'Sent / expires',
      render: (row) =>
        // A request (still waiting, or turned down) was never emailed: say when it was asked for.
        !row.sentCount ? (
          <div className="ui-hint" style={{ margin: 0 }}>
            Requested {formatDate(row.createdAt)}
            <div>{row.status === 'awaiting_approval' ? 'not sent yet' : 'never sent'}</div>
          </div>
        ) : (
          <div className="ui-hint" style={{ margin: 0 }}>
            {formatDate(row.lastSentAt)}
            {row.sentCount > 1 ? ` (×${row.sentCount})` : ''}
            {row.status === 'pending' && <div>expires {formatDate(row.expiresAt)}</div>}
          </div>
        ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) =>
        row.canReview ? (
          <div style={{ display: 'flex', gap: 'var(--spacing-xs)', justifyContent: 'flex-end' }}>
            <Tooltip label="Approve and send to the teacher" side="top">
              <IconButton
                icon={<LuCheck aria-hidden="true" />}
                label={`Approve request for ${row.teacherName}`}
                variant="success"
                size="sm"
                onClick={() => setConfirm({ type: 'approve', item: row })}
              />
            </Tooltip>
            <Tooltip label="Reject request" side="top">
              <IconButton
                icon={<LuX aria-hidden="true" />}
                label={`Reject request for ${row.teacherName}`}
                variant="danger"
                size="sm"
                onClick={() => setRejecting(row)}
              />
            </Tooltip>
          </div>
        ) : row.status === 'pending' || row.status === 'expired' ? (
          <div style={{ display: 'flex', gap: 'var(--spacing-xs)', justifyContent: 'flex-end' }}>
            <Tooltip label={row.canResend ? 'Re-send' : 'Just sent - wait a few minutes'} side="top">
              <IconButton
                icon={<LuSend aria-hidden="true" />}
                label="Re-send"
                variant="primary"
                size="sm"
                disabled={!row.canResend}
                onClick={() => setConfirm({ type: 'resend', item: row })}
              />
            </Tooltip>
            {row.canCancel && (
              <Tooltip label="Cancel invitation" side="top">
                <IconButton
                  icon={<LuBan aria-hidden="true" />}
                  label="Cancel invitation"
                  variant="danger"
                  size="sm"
                  onClick={() => setConfirm({ type: 'cancel', item: row })}
                />
              </Tooltip>
            )}
          </div>
        ) : null,
    },
  ];

  const hasFilters = Boolean(search || status);
  const clearFilters = () => {
    setSearch('');
    setStatus('');
    goToPage(1);
  };

  return (
    <div className="td-page">
      <PageHeader
        title="Teacher invitations"
        description="Every invitation to connect a teacher with a student. A parent's request waits here for your approval before the teacher hears anything; Super Admin's own invitations (Invite Teachers on the Assignments page) go straight out. A teacher is connected only when they accept."
        breadcrumbs={[{ label: 'Relationships', to: '/admin/relationships' }, { label: 'Teacher invitations' }]}
      />

      {waitingCount > 0 && status !== 'awaiting_approval' && (
        <Alert variant="info" className="ui-field" title={`${waitingCount} parent request${waitingCount === 1 ? '' : 's'} waiting for approval`}>
          <span>Nothing reaches the teacher until you approve it. </span>
          <Button size="sm" variant="secondary" onClick={() => resetTo(setStatus)('awaiting_approval')}>
            Show requests
          </Button>
        </Alert>
      )}

      <FilterBar>
        <SearchInput
          fieldClassName="ui-filterbar__search ui-field--compact"
          placeholder="Teacher, parent or student"
          value={search}
          onChange={(e) => resetTo(setSearch)(e.target.value)}
          onClear={() => resetTo(setSearch)('')}
        />
        <Select
          fieldClassName="ui-field--compact"
          label="Status"
          options={INVITATION_STATUS_OPTIONS}
          placeholder="All statuses"
          value={status}
          onChange={(e) => resetTo(setStatus)(e.target.value)}
        />
        <Tooltip label="Clear filters" side="top">
          <IconButton icon={<LuFilterX aria-hidden="true" />} label="Clear filters" size="sm" onClick={clearFilters} disabled={!hasFilters} />
        </Tooltip>
      </FilterBar>

      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        error={error}
        onRetry={load}
        pagination={pagination}
        onPageChange={goToPage}
        emptyTitle={hasFilters ? 'No invitations match those filters' : 'No invitations yet'}
        emptyDescription={hasFilters ? 'Try clearing the search or changing the status.' : 'Invitations appear here as parents invite teachers.'}
        caption="Teacher invitations"
      />

      <ConfirmationModal
        isOpen={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={runAction}
        loading={acting}
        variant={confirm?.type === 'cancel' ? 'danger' : 'primary'}
        title={
          confirm?.type === 'cancel' ? 'Cancel this invitation?' : confirm?.type === 'approve' ? 'Approve and send this request?' : 'Re-send this invitation?'
        }
        confirmLabel={confirm?.type === 'cancel' ? 'Cancel invitation' : confirm?.type === 'approve' ? 'Approve & send' : 'Re-send'}
        cancelLabel="Back"
        message={
          !confirm
            ? ''
            : confirm.type === 'cancel'
              ? `${confirm.item.teacherName} (${confirm.item.teacherEmail}) won't be able to accept it. The parent will see it as cancelled.`
              : confirm.type === 'approve'
                ? `${confirm.item.teacherName} (${confirm.item.teacherEmail}) is emailed an invitation to teach ${studentName(confirm.item)} ${formatSubjects(confirm.item.subjects)}${
                    confirm.item.academicYear ? ` (${confirm.item.academicYear.name})` : ''
                  }. The family is told, and they're connected once the teacher accepts.`
                : `${confirm.item.teacherEmail} gets a new link with a fresh expiry date. The previous link stops working.`
        }
      />

      <Modal
        isOpen={Boolean(rejecting)}
        onClose={closeReject}
        title="Reject this request?"
        description={rejecting ? `${rejecting.teacherName} won't be contacted. The family sees your note on My Children and can send a corrected request.` : undefined}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={closeReject} disabled={acting}>
              Back
            </Button>
            <Button variant="danger" onClick={runReject} loading={acting}>
              Reject request
            </Button>
          </>
        }
      >
        <Textarea
          label="Note for the family"
          required
          rows={3}
          maxLength={500}
          value={rejectNote}
          onChange={(e) => setRejectNote(e.target.value)}
          placeholder="e.g. This teacher doesn't teach Grade 7 - please choose another."
          error={rejectTried ? rejectNoteError : undefined}
        />
      </Modal>
    </div>
  );
}
