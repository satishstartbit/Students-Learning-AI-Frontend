import { useCallback, useEffect, useState } from 'react';
import { LuArrowRightLeft, LuPencil, LuPlus, LuSend, LuTrash2 } from 'react-icons/lu';
import {
  Alert,
  Badge,
  Button,
  ConfirmationModal,
  DataTable,
  IconButton,
  Modal,
  PageHeader,
  SearchInput,
  Tabs,
  Textarea,
} from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { useDebounce } from '../../../hooks/useDebounce';
import { usePagination } from '../../../hooks/usePagination';
import { toast } from '../../../hooks/useToast';
import { formatDate, formatDateTime } from '../../../utils/date';
import { getErrorMessage } from '../../../utils/errorHandler';
import { formatSubjects, invitationStatusOf } from '../../invitations/invitationStatus';
import invitationService from '../../invitations/services/teacherInvitation.service';
import ConnectionModal from '../components/ConnectionModal';
import connectionService from '../services/teacherConnection.service';

/**
 * Teacher connections - how a teacher gets connected to a student, from
 * Super Admin's side.
 *
 * The flow the client set out:
 *
 *   1. the parent asks for a teacher - name, email and subject(s);
 *   2. Super Admin reviews the request here (Requests from parents) and
 *      approves it, or turns it down with a note the family sees;
 *   3. on approval the platform emails the teacher the client-written
 *      invitation (Relationships > Invitation email);
 *   4. the teacher accepts or declines from that email.
 *
 * The other tabs are the exceptions the client named - a family that needs
 * help, a student moving to a new teacher or class at year end. Everything
 * there that changes a connection asks WHY first, and the Change log keeps
 * every assisted change with its reason. The child's parents are told about
 * every one of those changes (backend: teacherConnection.service#tellFamily) -
 * what changed, never the internal reason.
 *
 * A connection is one teacher and one student for one academic year, with
 * however many subjects that teacher covers for them.
 */

const ACTION_LABEL = {
  create: 'Created',
  update: 'Edited',
  move: 'Moved to a new teacher',
  remove: 'Removed',
  accept_for_teacher: 'Accepted for the teacher',
};

const studentName = (row) => [row.student?.firstName, row.student?.lastName].filter(Boolean).join(' ') || '—';

/**
 * A note-then-confirm dialog: the reason for an assisted change, or the note
 * a family sees when their request is turned down.
 */
function NoteModal({
  isOpen,
  title,
  description,
  confirmLabel,
  variant = 'primary',
  label = 'Why does this need Super Admin?',
  hint = 'Kept in the change log for Super Admin only. The family is told what changed, not this reason.',
  onConfirm,
  onClose,
}) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm(note.trim());
      setNote('');
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant={variant} onClick={confirm} loading={busy} disabled={note.trim().length < 5}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {error && (
        <Alert variant="error" className="ui-field">
          {error}
        </Alert>
      )}
      <Textarea
        label={label}
        required
        rows={3}
        maxLength={500}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        hint={hint}
      />
    </Modal>
  );
}

/** Step 2 of the flow: every parent's request, waiting for a decision. */
function RequestsTab({ requests, onApprove, onReject, copyPending }) {
  const columns = [
    { key: 'requested', header: 'Requested', render: (row) => formatDate(row.createdAt) },
    {
      key: 'parent',
      header: 'From',
      render: (row) => (
        <>
          <strong>{row.invitedBy?.name ?? '—'}</strong>
          <div className="ui-hint">for {studentName(row)}</div>
        </>
      ),
    },
    {
      key: 'teacher',
      header: 'Teacher to invite',
      render: (row) => (
        <>
          <strong>{row.teacherName}</strong>
          <div className="ui-hint" style={{ overflowWrap: 'anywhere' }}>
            {row.teacherEmail}
            {row.teacher ? ' · has an account' : ' · not on the platform yet'}
          </div>
        </>
      ),
    },
    {
      key: 'subjects',
      header: 'Subjects',
      render: (row) => (
        <>
          {formatSubjects(row.subjects)}
          {row.grade && <div className="ui-hint">{row.grade}</div>}
        </>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 6 }}>
          <Button size="sm" startIcon={<LuSend aria-hidden="true" />} onClick={() => onApprove(row)}>
            Approve &amp; send
          </Button>
          <Button size="sm" variant="secondary" onClick={() => onReject(row)}>
            Reject
          </Button>
        </span>
      ),
    },
  ];

  return (
    <>
      <p className="ui-hint" style={{ marginTop: 0 }}>
        Parents ask for their child&apos;s teachers here. Approving a request emails the teacher the invitation;
        rejecting it tells the family why, and the teacher is never contacted.
      </p>

      {copyPending && (
        <Alert variant="warning" className="ui-field">
          The invitation email still has unfinished <strong>[CLIENT COPY PENDING]</strong> wording, so approvals are
          blocked on the live site until it is written.
        </Alert>
      )}

      <DataTable
        columns={columns}
        data={requests.data ?? []}
        rowKey="id"
        isLoading={requests.isLoading}
        error={requests.error}
        onRetry={() => requests.run().catch(() => {})}
        emptyTitle="No requests waiting"
        emptyDescription="When a parent asks for a teacher, the request appears here for review."
        caption="Parents' teacher requests"
      />
    </>
  );
}

function ConnectionsTab({ refreshKey, onEdit, onMove, onRemove }) {
  const pagination = usePagination();
  const { page, limit, applyMeta, goToPage } = pagination;
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const list = useApi(connectionService.listConnections);
  const { run, meta } = list;

  const load = useCallback(() => run({ page, limit, search: debouncedSearch }), [run, page, limit, debouncedSearch]);

  useEffect(() => {
    load().catch(() => {});
  }, [load, refreshKey]);

  useEffect(() => {
    if (meta?.total !== undefined) applyMeta(meta);
  }, [meta, applyMeta]);

  const columns = [
    { key: 'teacher', header: 'Teacher', render: (row) => <strong>{row.teacher?.name ?? '—'}</strong> },
    { key: 'student', header: 'Student', render: (row) => row.student?.name ?? '—' },
    {
      key: 'subjects',
      header: 'Subjects',
      render: (row) => (
        <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 4 }}>
          {row.subjects.map((s) => (
            <Badge key={s} variant="primary">
              {s}
            </Badge>
          ))}
        </span>
      ),
    },
    { key: 'year', header: 'Year', render: (row) => row.academicYear?.name ?? <span className="ui-hint">—</span> },
    { key: 'grade', header: 'Grade', render: (row) => row.grade ?? <span className="ui-hint">—</span> },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={row.status === 'active' ? 'success' : 'neutral'}>
          {row.status === 'mixed' ? 'Partly paused' : row.status === 'active' ? 'Active' : 'Paused'}
        </Badge>
      ),
    },
    { key: 'since', header: 'Since', render: (row) => formatDate(row.connectedAt) },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <span style={{ display: 'inline-flex', gap: 4 }}>
          <IconButton aria-label="Edit connection" onClick={() => onEdit(row)}>
            <LuPencil size={16} />
          </IconButton>
          <IconButton aria-label="Move to a new teacher" onClick={() => onMove(row)}>
            <LuArrowRightLeft size={16} />
          </IconButton>
          <IconButton aria-label="Remove connection" onClick={() => onRemove(row)}>
            <LuTrash2 size={16} />
          </IconButton>
        </span>
      ),
    },
  ];

  return (
    <>
      <p className="ui-hint" style={{ marginTop: 0 }}>
        Teachers connected once they accepted an invitation. Change one here only when a family needs help - for
        example a student moving to a new teacher or class at year end.
      </p>
      <div style={{ maxWidth: 360, marginBottom: 'var(--spacing-md)' }}>
        <SearchInput
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            goToPage(1);
          }}
          placeholder="Search teacher, student or subject"
        />
      </div>
      <DataTable
        columns={columns}
        data={list.data ?? []}
        rowKey="key"
        isLoading={list.isLoading}
        error={list.error}
        onRetry={load}
        pagination={pagination}
        onPageChange={goToPage}
        emptyTitle={debouncedSearch ? 'No connections match' : 'No teacher connections yet'}
        emptyDescription="Connections appear here once a teacher accepts an invitation."
        caption="Teacher connections"
      />
    </>
  );
}

/** Step 3: invitations that went to the teacher and haven't been answered. */
function WaitingTab({ refreshKey, onAcceptForTeacher }) {
  const list = useApi(invitationService.adminList);
  const { run } = list;
  const load = useCallback(() => run({ status: 'pending', limit: 100 }), [run]);

  useEffect(() => {
    load().catch(() => {});
  }, [load, refreshKey]);

  const columns = [
    {
      key: 'teacher',
      header: 'Teacher',
      render: (row) => (
        <>
          <strong>{row.teacherName}</strong>
          <div className="ui-hint">{row.teacherEmail}</div>
        </>
      ),
    },
    { key: 'student', header: 'Student', render: studentName },
    { key: 'subjects', header: 'Subjects', render: (row) => formatSubjects(row.subjects) },
    { key: 'by', header: 'Requested by', render: (row) => row.invitedBy?.name ?? '—' },
    { key: 'sent', header: 'Emailed', render: (row) => formatDate(row.approvedAt ?? row.lastSentAt ?? row.createdAt) },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const s = invitationStatusOf(row.status);
        return <Badge variant={s.variant}>{s.label}</Badge>;
      },
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <Button size="sm" variant="secondary" onClick={() => onAcceptForTeacher(row)}>
          Accept for teacher
        </Button>
      ),
    },
  ];

  return (
    <>
      <p className="ui-hint" style={{ marginTop: 0 }}>
        Invitations emailed to a teacher who hasn&apos;t answered yet. Accept one on their behalf only when the teacher
        has agreed but can&apos;t use the email - they need an account first.
      </p>
      <DataTable
        columns={columns}
        data={list.data ?? []}
        rowKey="id"
        isLoading={list.isLoading}
        error={list.error}
        onRetry={load}
        emptyTitle="Nothing waiting on a teacher"
        caption="Invitations waiting on a teacher"
      />
    </>
  );
}

function ChangesTab({ refreshKey }) {
  const pagination = usePagination();
  const { page, limit, applyMeta, goToPage } = pagination;
  const list = useApi(connectionService.listAssistedChanges);
  const { run, meta } = list;
  const load = useCallback(() => run({ page, limit }), [run, page, limit]);

  useEffect(() => {
    load().catch(() => {});
  }, [load, refreshKey]);

  useEffect(() => {
    if (meta?.total !== undefined) applyMeta(meta);
  }, [meta, applyMeta]);

  const columns = [
    { key: 'at', header: 'When', render: (row) => formatDateTime(row.at) },
    { key: 'action', header: 'What', render: (row) => <strong>{ACTION_LABEL[row.action] ?? row.action}</strong> },
    { key: 'by', header: 'By', render: (row) => row.actor?.name ?? '—' },
    {
      key: 'subjects',
      header: 'Subjects',
      render: (row) => (row.after?.subjects ?? row.before?.subjects ?? []).join(', ') || '—',
    },
    { key: 'reason', header: 'Reason', render: (row) => row.reason ?? <span className="ui-hint">—</span> },
  ];

  return (
    <DataTable
      columns={columns}
      data={list.data ?? []}
      rowKey="id"
      isLoading={list.isLoading}
      error={list.error}
      onRetry={load}
      pagination={pagination}
      onPageChange={goToPage}
      emptyTitle="No assisted changes yet"
      emptyDescription="Every connection Super Admin creates, edits, moves, accepts or removes on a family's behalf is listed here with its reason."
      caption="Assisted changes"
    />
  );
}

export default function TeacherConnectionsPage() {
  const [tab, setTab] = useState('requests');
  const [refreshKey, setRefreshKey] = useState(0);

  // Loaded here rather than in the tab, so the tab label can carry the count.
  const requests = useApi(connectionService.listRequests, { immediate: true });
  const { run: runRequests } = requests;
  const copy = useApi(connectionService.getEmailCopy, { immediate: true, args: ['teacher-invitation'] });

  const refresh = () => {
    setRefreshKey((k) => k + 1);
    runRequests().catch(() => {});
  };

  const [modal, setModal] = useState(null); // { mode, connection }
  const [removing, setRemoving] = useState(null);
  const [approving, setApproving] = useState(null);
  const [approvingBusy, setApprovingBusy] = useState(false);
  const [rejecting, setRejecting] = useState(null);
  const [acceptingFor, setAcceptingFor] = useState(null);

  const waiting = requests.data?.length ?? 0;
  const tabs = [
    { key: 'requests', label: waiting ? `Requests from parents (${waiting})` : 'Requests from parents' },
    { key: 'connections', label: 'Connections' },
    { key: 'waiting', label: 'Waiting on a teacher' },
    { key: 'changes', label: 'Change log' },
  ];

  const approve = async () => {
    setApprovingBusy(true);
    try {
      const { message } = await connectionService.approveRequest(approving.id);
      toast.success(message || 'Approved - the invitation has been emailed to the teacher');
      setApproving(null);
      refresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setApprovingBusy(false);
    }
  };

  return (
    <div className="td-page">
      <PageHeader
        title="Teacher connections"
        description="Parents ask for their child's teachers; you review each request, and the approved invitation is emailed to the teacher. The other tabs are for when a family needs help - every change asks why, and the child's parents are told what changed."
        actions={
          <Button variant="secondary" startIcon={<LuPlus aria-hidden="true" />} onClick={() => setModal({ mode: 'create' })}>
            Create connection
          </Button>
        }
      />

      <Tabs items={tabs} activeKey={tab} onChange={setTab} />

      <div style={{ marginTop: 'var(--spacing-md)' }}>
        {tab === 'requests' && (
          <RequestsTab
            requests={requests}
            copyPending={Boolean(copy.data?.hasPendingSlots)}
            onApprove={setApproving}
            onReject={setRejecting}
          />
        )}
        {tab === 'connections' && (
          <ConnectionsTab
            refreshKey={refreshKey}
            onEdit={(row) => setModal({ mode: 'edit', connection: row })}
            onMove={(row) => setModal({ mode: 'move', connection: row })}
            onRemove={setRemoving}
          />
        )}
        {tab === 'waiting' && <WaitingTab refreshKey={refreshKey} onAcceptForTeacher={setAcceptingFor} />}
        {tab === 'changes' && <ChangesTab refreshKey={refreshKey} />}
      </div>

      {modal && (
        <ConnectionModal
          key={`${modal.mode}-${modal.connection?.key ?? 'new'}`}
          isOpen
          mode={modal.mode}
          connection={modal.connection ?? null}
          onClose={() => setModal(null)}
          onSaved={refresh}
        />
      )}

      {/* Approving is the normal path, so no reason is asked - just a clear
          statement of what is about to be emailed, and to whom. */}
      <ConfirmationModal
        isOpen={Boolean(approving)}
        onClose={() => setApproving(null)}
        onConfirm={approve}
        loading={approvingBusy}
        title="Approve and send the invitation?"
        message={
          approving
            ? `${approving.teacherName} (${approving.teacherEmail}) will be emailed the invitation to connect with ${studentName(
                approving
              )} for ${formatSubjects(approving.subjects)}. ${approving.invitedBy?.name ?? 'The family'} will be told it has gone.`
            : ''
        }
        confirmLabel="Approve & send"
      />

      <NoteModal
        isOpen={Boolean(rejecting)}
        title="Reject this request?"
        description={
          rejecting
            ? `${rejecting.teacherName} will not be contacted. ${rejecting.invitedBy?.name ?? 'The family'} will see your note.`
            : ''
        }
        label="Note to the family"
        hint="They see this - say what to change, e.g. a school email address rather than a personal one."
        confirmLabel="Reject request"
        variant="danger"
        onClose={() => setRejecting(null)}
        onConfirm={async (note) => {
          await connectionService.rejectRequest(rejecting.id, note);
          toast.success('Request rejected - the family has been told');
          refresh();
        }}
      />

      <NoteModal
        isOpen={Boolean(removing)}
        title="Remove this connection?"
        description={
          removing
            ? `${removing.teacher?.name} will no longer be connected to ${removing.student?.name} for ${removing.subjects.join(', ')}. Neither account is deleted, and the family is told.`
            : ''
        }
        confirmLabel="Remove connection"
        variant="danger"
        onClose={() => setRemoving(null)}
        onConfirm={async (reason) => {
          await connectionService.removeConnection({
            teacherId: removing.teacher.id,
            studentId: removing.student.id,
            academicYearId: removing.academicYear?.id ?? null,
            reason,
          });
          toast.success('Connection removed - the family has been told');
          refresh();
        }}
      />

      <NoteModal
        isOpen={Boolean(acceptingFor)}
        title="Accept on the teacher's behalf?"
        description={
          acceptingFor
            ? `${acceptingFor.teacherName} will be connected for ${formatSubjects(acceptingFor.subjects)} as if they had accepted the invitation themselves. The family is told it was accepted.`
            : ''
        }
        confirmLabel="Accept for teacher"
        onClose={() => setAcceptingFor(null)}
        onConfirm={async (reason) => {
          await connectionService.acceptForTeacher(acceptingFor.id, reason);
          toast.success("Accepted on the teacher's behalf");
          refresh();
        }}
      />
    </div>
  );
}
