import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LuFilterX } from 'react-icons/lu';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  IconButton,
  DataTable,
  StatusBadge,
  Button,
  ConfirmationModal,
  ProgressBar,
  Select,
  DatePicker,
  Toast,
} from '../../../components/common';
import { SearchableSelect } from '../../../components/ui/searchable-select';
import { Tooltip } from '../../../components/ui/tooltip';
import { useApi } from '../../../hooks/useApi';
import { usePagination } from '../../../hooks/usePagination';
import { useDebounce } from '../../../hooks/useDebounce';
import { useModal } from '../../../hooks/useModal';
import { toast } from '../../../hooks/useToast';
import { formatDate, isOverdue } from '../../../utils/date';
import { getErrorMessage } from '../../../utils/errorHandler';
import { ASSIGNMENT_CRUD_STATUS } from '../../../utils/constants';
import assignmentService from '../../assignments/services/assignment.service';
import teacherStudentService from '../services/teacherStudent.service';

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Any status' },
  { value: ASSIGNMENT_CRUD_STATUS.DRAFT, label: 'Draft' },
  { value: ASSIGNMENT_CRUD_STATUS.PUBLISHED, label: 'Published' },
  { value: ASSIGNMENT_CRUD_STATUS.ARCHIVED, label: 'Archived' },
  { value: ASSIGNMENT_CRUD_STATUS.COMPLETED, label: 'Completed' },
];

/** "Overdue" is derived for display only - never a stored backend status. */
function displayStatus(row) {
  if (row.status === ASSIGNMENT_CRUD_STATUS.PUBLISHED && row.dueDate && isOverdue(row.dueDate)) {
    return { status: 'overdue', label: 'Overdue' };
  }
  return { status: row.status, label: undefined };
}

export default function AssignmentsListPage() {
  const pagination = usePagination();
  const { page, limit, applyMeta, goToPage } = pagination;

  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState(null);
  const [grade, setGrade] = useState(null);
  const [status, setStatus] = useState('');
  const [dueBefore, setDueBefore] = useState('');
  const [dueAfter, setDueAfter] = useState('');

  const debouncedSearch = useDebounce(search, 350);

  const subjects = useApi(teacherStudentService.listLookupSubjects);
  const grades = useApi(teacherStudentService.listLookupGrades);
  const { run: runSubjects } = subjects;
  const { run: runGrades } = grades;

  useEffect(() => {
    runSubjects().catch(() => {});
  }, [runSubjects]);

  useEffect(() => {
    runGrades().catch(() => {});
  }, [runGrades]);

  const subjectOptions = useMemo(
    () => (subjects.data ?? []).map((s) => ({ value: s.name, label: s.name })),
    [subjects.data]
  );
  const gradeOptions = useMemo(
    () => (grades.data ?? []).map((g) => ({ value: g.name, label: g.name })),
    [grades.data]
  );

  const list = useApi(assignmentService.listAssignments);
  const { run: runList, meta } = list;

  const query = useMemo(
    () => ({
      page,
      limit,
      search: debouncedSearch || undefined,
      subject: subject || undefined,
      grade: grade || undefined,
      status: status || undefined,
      dueBefore: dueBefore || undefined,
      dueAfter: dueAfter || undefined,
    }),
    [page, limit, debouncedSearch, subject, grade, status, dueBefore, dueAfter]
  );

  const load = useCallback(() => runList(query), [runList, query]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  useEffect(() => {
    if (meta?.total !== undefined) applyMeta(meta);
  }, [meta, applyMeta]);

  const hasActiveFilters =
    Boolean(search) || Boolean(subject) || Boolean(grade) || Boolean(status) || Boolean(dueBefore) || Boolean(dueAfter);

  const clearFilters = () => {
    setSearch('');
    setSubject(null);
    setGrade(null);
    setStatus('');
    setDueBefore('');
    setDueAfter('');
    goToPage(1);
  };

  const withFilterReset = (setter) => (next) => {
    setter(next);
    goToPage(1);
  };

  // --- row actions -------------------------------------------------------
  const [busyId, setBusyId] = useState(null);
  const deleteModal = useModal();
  const [deleting, setDeleting] = useState(false);

  const handlePublish = async (row) => {
    setBusyId(row.id);
    try {
      await assignmentService.publishAssignment(row.id);
      toast.success('Assignment published');
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleArchive = async (row) => {
    setBusyId(row.id);
    try {
      await assignmentService.archiveAssignment(row.id);
      toast.success('Assignment archived');
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await assignmentService.deleteAssignment(deleteModal.payload.id);
      toast.success('Assignment deleted');
      deleteModal.close();
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'title',
      header: 'Assignment',
      render: (row) => (
        <Link to={`/teacher/assignments/${row.id}`} style={{ fontWeight: 600 }}>
          {row.title}
        </Link>
      ),
    },
    { key: 'subject', header: 'Subject', render: (row) => row.subject || '—' },
    { key: 'grade', header: 'Grade', render: (row) => row.grade || '—' },
    {
      key: 'recipients',
      header: 'Students',
      render: (row) => `${row.recipientCount ?? 0} student${row.recipientCount === 1 ? '' : 's'}`,
    },
    {
      key: 'progress',
      header: 'Submitted',
      render: (row) => {
        const total = row.recipientCount ?? 0;
        const submitted = row.submittedCount ?? 0;
        return (
          <div style={{ minWidth: 120 }}>
            <ProgressBar value={total ? submitted : 0} max={total || 1} size="sm" />
            <span className="ui-hint">
              {submitted}/{total} submitted
            </span>
          </div>
        );
      },
    },
    {
      key: 'dueDate',
      header: 'Due',
      render: (row) => {
        const { status: derivedStatus, label } = displayStatus(row);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span>{row.dueDate ? formatDate(row.dueDate) : 'No due date'}</span>
            {derivedStatus === 'overdue' && <StatusBadge status={derivedStatus} label={label} />}
          </div>
        );
      },
    },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'createdAt', header: 'Created', render: (row) => formatDate(row.createdAt) },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <Button size="sm" variant="secondary" as={Link} to={`/teacher/assignments/${row.id}`}>
            View
          </Button>
          {row.status !== ASSIGNMENT_CRUD_STATUS.ARCHIVED && (
            <Button size="sm" variant="secondary" as={Link} to={`/teacher/assignments/${row.id}/edit`}>
              Edit
            </Button>
          )}
          {row.status === ASSIGNMENT_CRUD_STATUS.DRAFT && (
            <Button size="sm" onClick={() => handlePublish(row)} loading={busyId === row.id}>
              Publish
            </Button>
          )}
          {row.status === ASSIGNMENT_CRUD_STATUS.PUBLISHED && (
            <Button size="sm" variant="secondary" onClick={() => handleArchive(row)} loading={busyId === row.id}>
              Archive
            </Button>
          )}
          {row.status === ASSIGNMENT_CRUD_STATUS.DRAFT && (
            <Button size="sm" variant="danger" onClick={() => deleteModal.open(row)}>
              Delete
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Assignments"
        description="Everything you've created, published or archived."
        actions={
          <Button as={Link} to="/teacher/assignments/new">
            Create assignment
          </Button>
        }
      />

      <FilterBar>
        <SearchInput
          fieldClassName="ui-filterbar__search ui-field--compact"
          placeholder="Search by title"
          value={search}
          onChange={(e) => withFilterReset(setSearch)(e.target.value)}
          onClear={() => withFilterReset(setSearch)('')}
        />
        <SearchableSelect
          className="ui-field--compact"
          label="Subject"
          options={subjectOptions}
          value={subject}
          onChange={withFilterReset(setSubject)}
          loading={subjects.isLoading}
          placeholder="Any subject"
          searchPlaceholder="Search subjects…"
        />
        <SearchableSelect
          className="ui-field--compact"
          label="Grade"
          options={gradeOptions}
          value={grade}
          onChange={withFilterReset(setGrade)}
          loading={grades.isLoading}
          placeholder="Any grade"
          searchPlaceholder="Search grades…"
        />
        <Select
          fieldClassName="ui-field--compact"
          label="Status"
          value={status}
          onChange={(e) => withFilterReset(setStatus)(e.target.value)}
          options={STATUS_FILTER_OPTIONS}
        />
        <DatePicker
          fieldClassName="ui-field--compact-labeled"
          label="Due after"
          value={dueAfter}
          onChange={(e) => withFilterReset(setDueAfter)(e.target.value)}
        />
        <DatePicker
          fieldClassName="ui-field--compact-labeled"
          label="Due before"
          value={dueBefore}
          onChange={(e) => withFilterReset(setDueBefore)(e.target.value)}
        />

        <Tooltip label="Clear filters" side="top">
          <IconButton
            icon={<LuFilterX aria-hidden="true" />}
            label="Clear filters"
            size="sm"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
          />
        </Tooltip>
      </FilterBar>

      <DataTable
        columns={columns}
        data={list.data ?? []}
        isLoading={list.isLoading}
        error={list.error}
        onRetry={load}
        pagination={pagination}
        onPageChange={goToPage}
        emptyTitle={hasActiveFilters ? 'No assignments match these filters' : 'No assignments yet'}
        emptyDescription={
          hasActiveFilters ? 'Try adjusting the filters above.' : 'Create your first assignment to get started.'
        }
        emptyAction={
          !hasActiveFilters && (
            <Button as={Link} to="/teacher/assignments/new">
              Create assignment
            </Button>
          )
        }
        caption="Assignments"
      />

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={handleDelete}
        title="Delete this draft?"
        message={
          deleteModal.payload
            ? `"${deleteModal.payload.title}" will be permanently deleted. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
      />

      <Toast />
    </>
  );
}
