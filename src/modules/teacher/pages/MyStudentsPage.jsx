import { useCallback, useEffect, useMemo, useState } from 'react';
import { LuFilterX } from 'react-icons/lu';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  IconButton,
  DataTable,
  Avatar,
  Badge,
  StatusBadge,
  Toast,
} from '../../../components/common';
import { SearchableSelect } from '../../../components/ui/searchable-select';
import { Tooltip } from '../../../components/ui/tooltip';
import { useApi } from '../../../hooks/useApi';
import { usePagination } from '../../../hooks/usePagination';
import { useDebounce } from '../../../hooks/useDebounce';
import { useModal } from '../../../hooks/useModal';
import { formatDateTime } from '../../../utils/date';
import { formatName } from '../../../utils/format';
import teacherStudentService from '../services/teacherStudent.service';
import StudentDetailModal from '../components/StudentDetailModal';

/**
 * Teacher's roster - every student assigned to them, across every subject
 * and grade. Search + filter + paginate, following the pattern already
 * established by `superAdmin/pages/RelationshipsPage.jsx`.
 */
export default function MyStudentsPage() {
  const pagination = usePagination();
  const { page, limit, applyMeta, goToPage } = pagination;

  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState(null);
  const [grade, setGrade] = useState(null);

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

  const list = useApi(teacherStudentService.listMyStudents);
  const { run: runList, meta } = list;

  const query = useMemo(
    () => ({
      page,
      limit,
      search: debouncedSearch || undefined,
      subject: subject || undefined,
      grade: grade || undefined,
    }),
    [page, limit, debouncedSearch, subject, grade]
  );

  const load = useCallback(() => runList(query), [runList, query]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  useEffect(() => {
    if (meta?.total !== undefined) applyMeta(meta);
  }, [meta, applyMeta]);

  const hasActiveFilters = Boolean(search) || Boolean(subject) || Boolean(grade);

  const clearFilters = () => {
    setSearch('');
    setSubject(null);
    setGrade(null);
    goToPage(1);
  };

  const withFilterReset = (setter) => (next) => {
    setter(next);
    goToPage(1);
  };

  const detailModal = useModal();

  const columns = [
    {
      key: 'name',
      header: 'Student',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <Avatar src={row.profileImageUrl} name={formatName(row)} size="sm" />
          <div>
            <div style={{ fontWeight: 600 }}>{formatName(row)}</div>
            <div className="ui-hint">{row.email}</div>
          </div>
        </div>
      ),
    },
    { key: 'grade', header: 'Grade', render: (row) => row.grade || '—' },
    {
      key: 'subjects',
      header: 'Subjects',
      render: (row) => {
        const relationships = row.relationships ?? [];
        if (relationships.length === 0) return row.subjects || '—';
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {relationships.map((r) => (
              <Badge key={r.id} variant="neutral">
                {r.subject}
                {r.grade ? ` (${r.grade})` : ''}
              </Badge>
            ))}
          </div>
        );
      },
    },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'lastActive',
      header: 'Last active',
      render: (row) => (row.lastLoginAt ? formatDateTime(row.lastLoginAt) : 'Never'),
    },
  ];

  return (
    <>
      <PageHeader title="My Students" description="Students you teach, across every subject and grade." />

      <FilterBar>
        <SearchInput
          fieldClassName="ui-filterbar__search ui-field--compact"
          placeholder="Search by name or email"
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
        onRowClick={(row) => detailModal.open(row.id)}
        pagination={pagination}
        onPageChange={goToPage}
        emptyTitle={hasActiveFilters ? 'No students match these filters' : 'No students assigned yet'}
        emptyDescription={
          hasActiveFilters
            ? 'Try adjusting the filters above.'
            : 'Students you are assigned to teach will show up here.'
        }
        caption="My students"
      />

      <StudentDetailModal isOpen={detailModal.isOpen} studentId={detailModal.payload} onClose={detailModal.close} />

      <Toast />
    </>
  );
}
