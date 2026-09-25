import { useEffect, useState } from 'react';
import {
  DataTable,
  ErrorState,
  Loader,
  Modal,
  PageHeader,
  SearchInput,
  StatCard,
} from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { useDebounce } from '../../../hooks/useDebounce';
import { formatDateKey } from '../../../utils/date';
import { formatName } from '../../../utils/format';
import CheckInBadge from '../../progress/components/CheckInBadge';
import StudentProgressDetail from '../../progress/components/StudentProgressDetail';
import TaskCounts from '../../progress/components/TaskCounts';
import progressService from '../services/progress.service';

/**
 * /teacher/progress - for each student linked to this teacher: did they
 * check in today and how are they doing, and where are they on the tasks
 * this teacher assigned. Read-only; a row opens that student's detail.
 */
export default function TeacherProgressPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [selected, setSelected] = useState(null);

  const list = useApi(progressService.getProgress);
  const { run: runList } = list;
  const detail = useApi(progressService.getStudentProgress);
  const { run: runDetail } = detail;

  useEffect(() => {
    runList({ search: debouncedSearch }).catch(() => {});
  }, [debouncedSearch, runList]);

  useEffect(() => {
    if (selected) runDetail(selected.student.id).catch(() => {});
  }, [selected, runDetail]);

  const rows = list.data ?? [];
  const checkedIn = rows.filter((r) => r.today?.checkedIn).length;
  const overdue = rows.reduce((sum, r) => sum + (r.counts?.overdue ?? 0), 0);
  const toReview = rows.reduce((sum, r) => sum + (r.counts?.submitted ?? 0), 0);
  const loading = list.isLoading && !list.data;

  const columns = [
    {
      key: 'student',
      header: 'Student',
      render: (row) => (
        <>
          <div style={{ fontWeight: 600 }}>{formatName(row.student)}</div>
          {row.student.grade && <div className="ui-hint">{row.student.grade}</div>}
        </>
      ),
    },
    { key: 'today', header: 'Check-in today', render: (row) => <CheckInBadge today={row.today} /> },
    { key: 'counts', header: 'Your tasks', render: (row) => <TaskCounts counts={row.counts} /> },
    {
      key: 'nextDue',
      header: 'Next due',
      render: (row) =>
        row.nextDue ? (
          <>
            <div>{formatDateKey(row.nextDue.dueDate)}</div>
            <div className="ui-hint">{row.nextDue.title}</div>
          </>
        ) : (
          <span className="ui-hint">—</span>
        ),
    },
  ];

  return (
    <div className="td-page">
      <PageHeader title="Progress" description="Today's check-ins and progress on the tasks you've assigned." />

      <div className="ui-statgrid" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <StatCard label="Checked in today" value={loading ? '—' : `${checkedIn} / ${rows.length}`} icon="🙂" loading={loading} />
        <StatCard label="Waiting for your review" value={toReview} icon="📥" loading={loading} />
        <StatCard label="Overdue tasks" value={overdue} icon="⏰" loading={loading} />
      </div>

      <div style={{ maxWidth: 360, marginBottom: 'var(--spacing-md)' }}>
        <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search students" />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(row) => row.student.id}
        isLoading={loading}
        error={list.error}
        onRetry={() => runList({ search: debouncedSearch }).catch(() => {})}
        onRowClick={(row) => setSelected(row)}
        emptyTitle={debouncedSearch ? 'No students match your search' : 'No students linked to you yet'}
        emptyDescription="Students appear here once they're assigned to you."
        caption="Student progress"
      />

      {/* A wide modal rather than the 420px Drawer - the task and check-in tables need the room. */}
      <Modal
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? formatName(selected.student) : ''}
        size="lg"
      >
        {detail.isLoading && <Loader message="Loading progress…" />}
        {detail.error && !detail.isLoading && (
          <ErrorState title="We couldn't load this student" error={detail.error} onRetry={() => runDetail(selected.student.id).catch(() => {})} />
        )}
        {/* The same detail the parent's Progress panel shows - today's
            check-in/tasks/focus cards, the 14-day check-in strip and the task
            table - with this teacher's own wording for the stages. */}
        {!detail.isLoading && !detail.error && detail.data?.student?.id === selected?.student.id && (
          <StudentProgressDetail progress={detail.data} name={selected?.student?.firstName} />
        )}
      </Modal>
    </div>
  );
}
