import { useCallback, useEffect, useState } from 'react';
import { LuBan, LuFilterX, LuSend } from 'react-icons/lu';
import {
  Badge,
  ConfirmationModal,
  DataTable,
  FilterBar,
  IconButton,
  PageHeader,
  SearchInput,
  Select,
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
 */
export default function TeacherInvitationsAdminPage() {
  const pagination = usePagination();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [acting, setActing] = useState(false);

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
      if (confirm.type === 'resend') {
        const res = await invitationService.adminResend(confirm.item.id);
        if (res?.data?.emailSent === false) toast.warning('The invitation was renewed, but the email could not be sent.');
        else toast.success(`Invitation re-sent to ${confirm.item.teacherEmail}`);
      } else {
        await invitationService.adminCancel(confirm.item.id);
        toast.success('Invitation cancelled');
      }
      setConfirm(null);
      load().catch(() => {});
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActing(false);
    }
  };

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
      render: (row) => (
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
        row.status === 'pending' || row.status === 'expired' ? (
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
        description="Every invitation to connect a teacher with a student - sent by parents, or by Super Admin with Invite Teachers on the Assignments page. A teacher is connected only when they accept."
        breadcrumbs={[{ label: 'Relationships', to: '/admin/relationships' }, { label: 'Teacher invitations' }]}
      />

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
        title={confirm?.type === 'cancel' ? 'Cancel this invitation?' : 'Re-send this invitation?'}
        confirmLabel={confirm?.type === 'cancel' ? 'Cancel invitation' : 'Re-send'}
        cancelLabel="Back"
        message={
          confirm
            ? confirm.type === 'cancel'
              ? `${confirm.item.teacherName} (${confirm.item.teacherEmail}) won't be able to accept it. The parent will see it as cancelled.`
              : `${confirm.item.teacherEmail} gets a new link with a fresh expiry date. The previous link stops working.`
            : ''
        }
      />
    </div>
  );
}
