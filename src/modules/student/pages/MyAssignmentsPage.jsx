import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Card, DataTable, StatusBadge, Select } from '../../../components/common';
import { SearchableSelect } from '../../../components/ui/searchable-select';
import { useApi } from '../../../hooks/useApi';
import { usePagination } from '../../../hooks/usePagination';
import { formatDueDate, isOverdue } from '../../../utils/date';
import { ASSIGNMENT_RECIPIENT_STATUS } from '../../../utils/constants';
import assignmentService from '../../assignments/services/assignment.service';
import SubjectIcon from '../components/SubjectIcon';

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All' },
  { value: ASSIGNMENT_RECIPIENT_STATUS.ASSIGNED, label: 'Assigned' },
  { value: ASSIGNMENT_RECIPIENT_STATUS.IN_PROGRESS, label: 'In progress' },
  { value: ASSIGNMENT_RECIPIENT_STATUS.SUBMITTED, label: 'Submitted' },
  { value: ASSIGNMENT_RECIPIENT_STATUS.REVIEWED, label: 'Reviewed' },
  { value: ASSIGNMENT_RECIPIENT_STATUS.COMPLETED, label: 'Completed' },
  { value: ASSIGNMENT_RECIPIENT_STATUS.RETURNED, label: 'Returned' },
];

/** "Overdue" is derived for display only - never a stored backend status. */
function displayStatus(row) {
  const dueDate = row.assignment?.dueDate;
  if (['assigned', 'in_progress'].includes(row.status) && dueDate && isOverdue(dueDate)) {
    return { status: 'overdue', label: 'Overdue' };
  }
  return { status: row.status, label: undefined };
}

/** Everything a student has been given to do, across every subject. */
export default function MyAssignmentsPage() {
  const navigate = useNavigate();
  const pagination = usePagination();
  const { page, limit, applyMeta, goToPage } = pagination;

  const [status, setStatus] = useState('');
  const [subject, setSubject] = useState(null);

  const list = useApi(assignmentService.listAssignments);
  const { run, meta } = list;

  const query = useMemo(
    () => ({ page, limit, status: status || undefined, subject: subject || undefined }),
    [page, limit, status, subject]
  );
  const load = useCallback(() => run(query), [run, query]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  useEffect(() => {
    if (meta?.total !== undefined) applyMeta(meta);
  }, [meta, applyMeta]);

  const items = list.data ?? [];

  // No dedicated student-facing subjects lookup exists; this page's own data
  // is small enough that deriving the filter options locally is enough.
  const subjectOptions = useMemo(() => {
    const set = new Set(items.map((i) => i.assignment?.subject).filter(Boolean));
    return [...set].map((s) => ({ value: s, label: s }));
  }, [items]);

  const columns = [
    {
      key: 'title',
      header: 'Assignment',
      render: (row) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <SubjectIcon subject={row.assignment?.subject} size="sm" />
          <span style={{ fontWeight: 600 }}>{row.assignment?.title}</span>
        </span>
      ),
    },
    { key: 'subject', header: 'Subject', render: (row) => row.assignment?.subject || '—' },
    { key: 'grade', header: 'Grade', render: (row) => row.assignment?.grade || '—' },
    { key: 'due', header: 'Due', render: (row) => formatDueDate(row.assignment?.dueDate) },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const { status: derivedStatus, label } = displayStatus(row);
        return <StatusBadge status={derivedStatus} label={label} />;
      },
    },
  ];

  const hasActiveFilters = Boolean(status) || Boolean(subject);

  return (
    <>
      <PageHeader title="My Assignments" description="Everything your teachers have given you to do." />

      <Card className="ui-field">
        <div className="grid gap-4 md:grid-cols-2">
          <Select
            label="Status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              goToPage(1);
            }}
            options={STATUS_FILTER_OPTIONS}
          />
          <SearchableSelect
            label="Subject"
            options={subjectOptions}
            value={subject}
            onChange={(v) => {
              setSubject(v);
              goToPage(1);
            }}
            placeholder="All subjects"
          />
        </div>
      </Card>

      <DataTable
        columns={columns}
        data={items}
        rowKey="recipientId"
        isLoading={list.isLoading}
        error={list.error}
        onRetry={load}
        onRowClick={(row) => navigate(`/student/assignments/${row.assignment.id}`)}
        pagination={pagination}
        onPageChange={goToPage}
        emptyTitle="No assignments yet"
        emptyDescription={
          hasActiveFilters ? 'Try a different filter.' : 'When your teacher gives you an assignment, it will show up here.'
        }
        caption="My assignments"
      />
    </>
  );
}
