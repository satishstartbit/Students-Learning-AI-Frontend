import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LuCheck, LuEllipsisVertical, LuEye, LuPlus, LuSearch, LuSend, LuArchive, LuTrash2, LuUndo2 } from 'react-icons/lu';
import { PageHeader, DataTable, Button, ConfirmationModal, Dropdown, Toast } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { usePagination } from '../../../hooks/usePagination';
import { useDebounce } from '../../../hooks/useDebounce';
import { toast } from '../../../hooks/useToast';
import { addDaysToKey, daysUntilDateKey, formatDateKey, getDateKey } from '../../../utils/date';
import { getErrorMessage } from '../../../utils/errorHandler';
import { ASSIGNMENT_CRUD_STATUS } from '../../../utils/constants';
import assignmentService from '../../assignments/services/assignment.service';
import teacherStudentService from '../services/teacherStudent.service';
import { getSubjectVisual } from '../../student/components/subjectVisual';
import '../components/assignmentsList/assignmentsList.css';

/** Status tabs, in the mockup's order. Archived only shows once there is something archived. */
const TABS = [
  { view: '', label: 'All', countKey: 'all' },
  { view: 'published', label: 'Published', countKey: 'published' },
  { view: 'scheduled', label: 'Scheduled', countKey: 'scheduled' },
  { view: 'draft', label: 'Drafts', countKey: 'draft' },
  { view: 'completed', label: 'Completed', countKey: 'completed' },
  { view: 'archived', label: 'Archived', countKey: 'archived', hideWhenEmpty: true },
];
const VIEWS = new Set(TABS.map((t) => t.view));

const DUE_OPTIONS = [
  { value: '', label: 'Any due date' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'today', label: 'Due today' },
  { value: 'week', label: 'Next 7 days' },
  { value: 'later', label: 'Later' },
  { value: 'none', label: 'No due date' },
];

/** The due-date dropdown as API params, in the teacher's own calendar (utils/date reads their timezone). */
function dueParams(due, today) {
  switch (due) {
    case 'overdue':
      return { dueBefore: addDaysToKey(today, -1) };
    case 'today':
      return { dueAfter: today, dueBefore: today };
    case 'week':
      return { dueAfter: today, dueBefore: addDaysToKey(today, 6) };
    case 'later':
      return { dueAfter: addDaysToKey(today, 7) };
    case 'none':
      return { noDueDate: true };
    default:
      return {};
  }
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

/**
 * What a row's status chip says. The stored status is draft/published/
 * archived (+ derived "completed"); Scheduled / Due today / Overdue are read
 * from the dates so the teacher sees what the student sees today.
 */
function rowState(row, today) {
  if (row.status === ASSIGNMENT_CRUD_STATUS.ARCHIVED) return { key: 'archived', label: 'Archived' };
  if (row.status === ASSIGNMENT_CRUD_STATUS.DRAFT) return { key: 'draft', label: 'Draft' };
  if (row.status === ASSIGNMENT_CRUD_STATUS.COMPLETED) return { key: 'completed', label: 'Completed' };
  if (row.startDate && row.startDate.slice(0, 10) > today) return { key: 'scheduled', label: 'Scheduled' };
  const days = row.dueDate ? daysUntilDateKey(row.dueDate) : null;
  if (days !== null && days < 0) return { key: 'overdue', label: 'Overdue' };
  if (days === 0) return { key: 'due-today', label: 'Due today' };
  return { key: 'published', label: 'Published' };
}

function dueLabel(dueDate) {
  if (!dueDate) return '—';
  const days = daysUntilDateKey(dueDate);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  return formatDateKey(dueDate.slice(0, 10));
}

function SubjectCell({ subject }) {
  if (!subject) return <span className="al-muted">—</span>;
  const { icon: Icon, tone } = getSubjectVisual(subject);
  return (
    <span className="al-subject">
      <span className="al-subject__tile" data-tone={tone} aria-hidden="true">
        <Icon size={14} strokeWidth={2.1} />
      </span>
      {subject}
    </span>
  );
}

function SubmittedCell({ row, state }) {
  let label;
  let percent = 0;
  if (state.key === 'draft') label = 'Not published';
  else if (state.key === 'scheduled') label = `Opens ${formatDateKey(row.startDate.slice(0, 10), { year: undefined })}`;
  else if (!row.recipientCount) label = 'No students';
  else {
    percent = Math.round(((row.submittedCount ?? 0) / row.recipientCount) * 100);
    label = `${row.submittedCount ?? 0} of ${row.recipientCount} submitted`;
  }
  return (
    <div className="al-progress">
      <div className="al-progress__track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-label={label}>
        <div className="al-progress__fill" style={{ width: `${percent}%` }} />
      </div>
      <span className="al-progress__label">{label}</span>
    </div>
  );
}

export default function AssignmentsListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = VIEWS.has(searchParams.get('view') ?? '') ? (searchParams.get('view') ?? '') : '';

  const pagination = usePagination();
  const { page, limit, applyMeta, goToPage } = pagination;

  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [due, setDue] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const today = getDateKey();

  const subjects = useApi(teacherStudentService.listLookupSubjects, { immediate: true });
  const grades = useApi(teacherStudentService.listLookupGrades, { immediate: true });

  // Filters shared by the list and the tab counts.
  const filters = useMemo(
    () => ({ search: debouncedSearch || undefined, subject: subject || undefined, grade: grade || undefined, ...dueParams(due, today) }),
    [debouncedSearch, subject, grade, due, today]
  );

  const list = useApi(assignmentService.listAssignments);
  const counts = useApi(assignmentService.getAssignmentCounts);
  const { run: runList, meta } = list;
  const { run: runCounts } = counts;

  const load = useCallback(() => {
    runCounts(filters).catch(() => {});
    return runList({ ...filters, view: view || undefined, page, limit }).catch(() => {});
  }, [runList, runCounts, filters, view, page, limit]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (meta?.total !== undefined) applyMeta(meta);
  }, [meta, applyMeta]);

  const hasFilters = Boolean(search || subject || grade || due);

  const withReset = (setter) => (value) => {
    setter(value);
    goToPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setSubject('');
    setGrade('');
    setDue('');
    goToPage(1);
  };

  const pickTab = (next) => {
    const params = new URLSearchParams(searchParams);
    if (next) params.set('view', next);
    else params.delete('view');
    setSearchParams(params, { replace: true });
    goToPage(1);
  };

  // ---- row actions ----
  const [busyId, setBusyId] = useState(null);
  const [confirm, setConfirm] = useState(null); // { kind: 'delete'|'archive'|'unpublish', row }

  const act = async (row, fn, message) => {
    setBusyId(row.id);
    try {
      await fn(row.id);
      toast.success(message);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const runConfirmed = async () => {
    const { kind, row } = confirm;
    setConfirm(null);
    if (kind === 'delete') await act(row, assignmentService.deleteAssignment, 'Draft deleted');
    if (kind === 'archive') await act(row, assignmentService.archiveAssignment, 'Assignment archived');
    if (kind === 'unpublish') await act(row, assignmentService.unpublishAssignment, 'Moved back to drafts');
  };

  const menuItems = (row, state) => {
    const items = [{ key: 'view', label: 'View details', icon: <LuEye aria-hidden="true" />, onClick: () => navigate(`/teacher/assignments/${row.id}`) }];
    if (state.key === 'draft') {
      items.push({
        key: 'publish',
        label: row.recipientCount ? 'Publish' : 'Publish (add students first)',
        icon: <LuSend aria-hidden="true" />,
        disabled: !row.recipientCount,
        onClick: () => act(row, assignmentService.publishAssignment, 'Assignment published'),
      });
    }
    const isLive = row.status === ASSIGNMENT_CRUD_STATUS.PUBLISHED;
    if (isLive && !row.startedCount) {
      items.push({ key: 'unpublish', label: 'Unpublish', icon: <LuUndo2 aria-hidden="true" />, onClick: () => setConfirm({ kind: 'unpublish', row }) });
    }
    if (isLive || row.status === ASSIGNMENT_CRUD_STATUS.COMPLETED) {
      items.push({ key: 'archive', label: 'Archive', icon: <LuArchive aria-hidden="true" />, onClick: () => setConfirm({ kind: 'archive', row }) });
    }
    if (state.key === 'draft') {
      items.push({ divider: true }, { key: 'delete', label: 'Delete draft', icon: <LuTrash2 aria-hidden="true" />, danger: true, onClick: () => setConfirm({ kind: 'delete', row }) });
    }
    return items;
  };

  const columns = [
    {
      key: 'title',
      header: 'Assignment',
      render: (row) => {
        const meta = [row.questionCount ? plural(row.questionCount, 'question') : 'No questions', row.estimatedMinutes ? `${row.estimatedMinutes} min` : null].filter(Boolean).join(' · ');
        return (
          <div className="al-title">
            <Link to={`/teacher/assignments/${row.id}`}>{row.title}</Link>
            <span className="al-meta">{meta}</span>
          </div>
        );
      },
    },
    { key: 'subject', header: 'Subject', render: (row) => <SubjectCell subject={row.subject} /> },
    { key: 'grade', header: 'Grade', render: (row) => (row.grade ? <span style={{ whiteSpace: 'nowrap' }}>{row.grade}</span> : <span className="al-muted">—</span>) },
    { key: 'recipients', header: 'Students', render: (row) => (row.recipientCount ? row.recipientCount : <span className="al-muted">—</span>) },
    { key: 'submitted', header: 'Submitted', render: (row) => <SubmittedCell row={row} state={rowState(row, today)} /> },
    { key: 'dueDate', header: 'Due', render: (row) => <span className={`al-due ${row.dueDate ? '' : 'al-muted'}`.trim()}>{dueLabel(row.dueDate)}</span> },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const state = rowState(row, today);
        return <span className={`al-status al-status--${state.key}`}>{state.label}</span>;
      },
    },
    {
      key: 'actions',
      header: <span className="ui-sr-only">Actions</span>,
      align: 'right',
      render: (row) => {
        const state = rowState(row, today);
        const archived = state.key === 'archived';
        return (
          <div className="al-actions">
            <Button size="sm" variant="secondary" as={Link} to={archived ? `/teacher/assignments/${row.id}` : `/teacher/assignments/${row.id}/edit`}>
              {archived ? 'View' : 'Edit'}
            </Button>
            <Dropdown
              align="end"
              trigger={
                <button type="button" className="al-kebab" aria-label={`More actions for ${row.title}`} disabled={busyId === row.id}>
                  <LuEllipsisVertical size={16} aria-hidden="true" />
                </button>
              }
              items={menuItems(row, state)}
            />
          </div>
        );
      },
    },
  ];

  const rows = Array.isArray(list.data) ? list.data : [];
  const tabCounts = counts.data ?? {};
  const total = pagination.total;

  const confirmCopy = {
    delete: { title: 'Delete this draft?', message: (r) => `"${r.title}" will be permanently deleted. This can't be undone.`, label: 'Delete draft', variant: 'danger' },
    archive: { title: 'Archive this assignment?', message: (r) => `"${r.title}" moves to Archived. Students keep their work, but it can no longer be edited.`, label: 'Archive' },
    unpublish: { title: 'Unpublish this assignment?', message: (r) => `"${r.title}" goes back to your drafts and ${plural(r.recipientCount ?? 0, 'student')} stop seeing it.`, label: 'Unpublish' },
  };
  const copy = confirm ? confirmCopy[confirm.kind] : null;

  const emptyTitle = hasFilters || view ? 'No assignments match' : 'No assignments yet';
  const emptyDescription = hasFilters || view ? 'Try another tab, or clear the filters.' : 'Create your first assignment to get started.';

  return (
    <div className="al-page td-page">
      <PageHeader
        title="Assignments"
        description="Everything you have created, published or saved as a draft."
        actions={
          <Button as={Link} to="/teacher/assignments/new" startIcon={<LuPlus />}>
            Create assignment
          </Button>
        }
        style={{ marginBottom: 0 }}
      />

      <ul className="al-tabs" aria-label="Filter by status">
        {TABS.filter((t) => !t.hideWhenEmpty || tabCounts[t.countKey] > 0 || view === t.view).map((t) => {
          const selected = view === t.view;
          const n = tabCounts[t.countKey];
          return (
            <li key={t.countKey}>
              <button type="button" className="al-tab" aria-pressed={selected} onClick={() => pickTab(t.view)}>
                {selected && <LuCheck size={13} strokeWidth={2.6} aria-hidden="true" />}
                {t.label}
                {n !== undefined && <span aria-label={`, ${n}`}> · {n}</span>}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="al-filters" role="search">
        <label className="al-search">
          <span className="ui-sr-only">Search by title</span>
          <LuSearch size={16} aria-hidden="true" />
          <input type="search" placeholder="Search by title" value={search} onChange={(e) => withReset(setSearch)(e.target.value)} />
        </label>
        <select
          className={`al-select ${subject ? '' : 'al-select--placeholder'}`.trim()}
          aria-label="Subject"
          value={subject}
          onChange={(e) => withReset(setSubject)(e.target.value)}
        >
          <option value="">All subjects</option>
          {(subjects.data ?? []).map((s) => (
            <option key={s.id ?? s.name} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
        <select className={`al-select ${grade ? '' : 'al-select--placeholder'}`.trim()} aria-label="Grade" value={grade} onChange={(e) => withReset(setGrade)(e.target.value)}>
          <option value="">All grades</option>
          {(grades.data ?? []).map((g) => (
            <option key={g.id ?? g.name} value={g.name}>
              {g.name}
            </option>
          ))}
        </select>
        <select className={`al-select ${due ? '' : 'al-select--placeholder'}`.trim()} aria-label="Due date" value={due} onChange={(e) => withReset(setDue)(e.target.value)}>
          {DUE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button type="button" className="al-clear" onClick={clearFilters} disabled={!hasFilters}>
          Clear
        </button>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        isLoading={list.isLoading}
        error={list.error}
        onRetry={load}
        pagination={pagination}
        onPageChange={goToPage}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        emptyAction={
          !hasFilters && !view ? (
            <Button as={Link} to="/teacher/assignments/new" startIcon={<LuPlus />}>
              Create assignment
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => { clearFilters(); pickTab(''); }}>
              Show all assignments
            </Button>
          )
        }
        caption="Assignments"
      />

      {pagination.totalPages <= 1 && total > 0 && (
        <p className="al-footer" role="status">
          Showing {rows.length} of {plural(total, 'assignment')}
        </p>
      )}

      <ConfirmationModal
        isOpen={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={runConfirmed}
        title={copy?.title ?? ''}
        message={confirm ? copy.message(confirm.row) : ''}
        confirmLabel={copy?.label}
        variant={copy?.variant}
        loading={Boolean(busyId)}
      />

      <Toast />
    </div>
  );
}
