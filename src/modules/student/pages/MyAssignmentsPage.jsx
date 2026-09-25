import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LuListChecks, LuPlus } from 'react-icons/lu';
import { Button, DataTable, StatusBadge, Select } from '../../../components/common';
import { SearchableSelect } from '../../../components/ui/searchable-select';
import { useApi } from '../../../hooks/useApi';
import { usePagination } from '../../../hooks/usePagination';
import { formatDueDate, isOverdue, daysUntilDateKey } from '../../../utils/date';
import { ASSIGNMENT_RECIPIENT_STATUS } from '../../../utils/constants';
import assignmentService from '../../assignments/services/assignment.service';
import SubjectIcon from '../components/SubjectIcon';
import OwnTaskModal from '../components/home/OwnTaskModal';
import studentTaskService from '../services/studentTask.service';
import '../components/assignments/studentAssignments.css';

/** Due label for a DATE value ("2026-10-14") - the user's own calendar day, not UTC. */
function ownDueLabel(dueDate) {
  const days = daysUntilDateKey(dueDate);
  if (days === null) return 'No due date';
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days < 0) return `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}`;
  return `Due in ${days} days`;
}

/** Tasks the student added for themselves (Home's "Add assignment"); the page owns the list and the dialog. */
function MyOwnTasksSection({ own, onAdd, onEdit, onRetry }) {
  const columns = [
    {
      key: 'title',
      header: 'Task',
      render: (row) => (
        <span className="sa-task">
          <SubjectIcon subject={row.subject} size="sm" />
          <span className="sa-task__title">{row.title}</span>
        </span>
      ),
    },
    {
      key: 'subject',
      header: 'Subject',
      render: (row) => row.subject || <span className="sa-muted">—</span>,
    },
    { key: 'due', header: 'Due', render: (row) => ownDueLabel(row.dueDate) },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <StatusBadge status={row.status === 'completed' ? 'completed' : 'assigned'} label={row.status === 'completed' ? 'Done' : 'To do'} />
      ),
    },
  ];

  return (
    <section className="sa-section">
      <div className="sa-section__head">
        <div>
          <h2 className="sa-section__title">My own tasks</h2>
          <p className="sa-section__subtitle">Things you added for yourself - only you can see these.</p>
        </div>
        <Button size="sm" variant="secondary" startIcon={<LuPlus aria-hidden="true" />} onClick={onAdd}>
          Add a task
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={own.data ?? []}
        rowKey="id"
        isLoading={own.isLoading}
        error={own.error}
        onRetry={onRetry}
        onRowClick={onEdit}
        renderCard={(row) => (
          <button type="button" className="sa-mcard" onClick={() => onEdit(row)}>
            <SubjectIcon subject={row.subject} size="sm" />
            <span className="sa-mcard__body">
              <span className="sa-mcard__title">{row.title}</span>
              <span className="sa-mcard__meta">{[row.subject, ownDueLabel(row.dueDate)].filter(Boolean).join(' · ')}</span>
            </span>
            <StatusBadge status={row.status === 'completed' ? 'completed' : 'assigned'} label={row.status === 'completed' ? 'Done' : 'To do'} />
          </button>
        )}
        emptyTitle="No tasks of your own yet"
        emptyDescription="Add anything you need to remember - it shows up on your Home too."
        caption="My own tasks"
      />
    </section>
  );
}

// No '' entry: Select draws its own blank option, shown here as "All statuses".
const STATUS_FILTER_OPTIONS = [
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

  // The student's own tasks and the add/edit dialog - the header's Add assignment opens it too.
  const own = useApi(studentTaskService.list, { immediate: true });
  const reloadOwn = () => own.run().catch(() => {});
  const [dialog, setDialog] = useState(null);

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

  const items = useMemo(() => list.data ?? [], [list.data]);

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
        <span className="sa-task">
          <SubjectIcon subject={row.assignment?.subject} size="sm" />
          <span className="sa-task__title">{row.assignment?.title}</span>
        </span>
      ),
    },
    {
      key: 'subject',
      header: 'Subject',
      render: (row) => row.assignment?.subject || <span className="sa-muted">—</span>,
    },
    {
      key: 'grade',
      header: 'Grade',
      render: (row) => row.assignment?.grade || <span className="sa-muted">—</span>,
    },
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
  const ownTasks = own.data ?? [];
  // Nothing at all yet (the mockup's empty page): one card and one button, not
  // a filter box over two empty tables.
  const nothingYet =
    !hasActiveFilters && !list.isLoading && !own.isLoading && !list.error && !own.error && items.length === 0 && ownTasks.length === 0;
  const addButton = (
    <Button startIcon={<LuPlus aria-hidden="true" />} onClick={() => setDialog({ mode: 'type' })}>
      Add assignment
    </Button>
  );

  return (
    // The page's own header and type scale, matching Home/Plan/Notifications/
    // Settings (components/assignments/studentAssignments.css) rather than the
    // console-sized PageHeader and Card this page used to borrow.
    <div className="sa-page td-page">
      <header className="sa-head">
        <div>
          <h1 className="sa-title">Assignments</h1>
          <p className="sa-subtitle">Everything you have on, and how far along it is.</p>
        </div>
        <div className="sa-head__actions">{addButton}</div>
      </header>

      {nothingYet ? (
        <section className="sa-section">
          <div className="sa-card sa-empty">
            <span className="sa-empty__icon" aria-hidden="true">
              <LuListChecks />
            </span>
            <h2 className="sa-empty__title">No assignments yet</h2>
            <p className="sa-empty__text">Add your first one and we will break it into small steps you can actually start.</p>
            <Button onClick={() => setDialog({ mode: 'type' })}>Add assignment</Button>
          </div>
        </section>
      ) : (
        <>
          <section className="sa-section">
            <p className="sa-eyebrow">Filter</p>
            <div className="sa-card">
              <div className="sa-filters">
                <Select
                  label="Status"
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    goToPage(1);
                  }}
                  options={STATUS_FILTER_OPTIONS}
                  placeholder="All statuses"
                  reserveHelper={false}
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
            </div>
          </section>

          <section className="sa-section">
            <div className="sa-section__head">
              <div>
                <h2 className="sa-section__title">From your teachers</h2>
                <p className="sa-section__subtitle">Open one to see what to do and hand it in.</p>
              </div>
            </div>

            <DataTable
              columns={columns}
              data={items}
              rowKey="recipientId"
              isLoading={list.isLoading}
              error={list.error}
              onRetry={load}
              onRowClick={(row) => navigate(`/student/assignments/${row.assignment.id}`)}
              renderCard={(row) => {
                const { status: derivedStatus, label } = displayStatus(row);
                return (
                  <Link to={`/student/assignments/${row.assignment.id}`} className="sa-mcard">
                    <SubjectIcon subject={row.assignment?.subject} size="sm" />
                    <span className="sa-mcard__body">
                      <span className="sa-mcard__title">{row.assignment?.title}</span>
                      <span className="sa-mcard__meta">
                        {[row.assignment?.subject, formatDueDate(row.assignment?.dueDate)].filter(Boolean).join(' · ')}
                      </span>
                    </span>
                    <StatusBadge status={derivedStatus} label={label} />
                  </Link>
                );
              }}
              pagination={pagination}
              onPageChange={goToPage}
              emptyTitle="No assignments yet"
              emptyDescription={
                hasActiveFilters
                  ? 'Try a different filter.'
                  : 'When your teacher gives you an assignment, it will show up here.'
              }
              caption="My assignments"
            />
          </section>

          <MyOwnTasksSection
            own={own}
            onAdd={() => setDialog({ mode: 'type' })}
            onEdit={(task) => setDialog({ mode: 'edit', task })}
            onRetry={reloadOwn}
          />
        </>
      )}

      <OwnTaskModal mode={dialog?.mode ?? null} task={dialog?.task ?? null} onClose={() => setDialog(null)} onChanged={reloadOwn} />
    </div>
  );
}
