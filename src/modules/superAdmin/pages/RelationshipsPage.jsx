import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LuUnlink, LuUserPlus } from 'react-icons/lu';
import {
  PageHeader,
  Card,
  Button,
  IconButton,
  SearchInput,
  DataTable,
  ConfirmationModal,
  Alert,
  SectionHeader,
  Badge,
  Tabs,
  Select,
  EmptyState,
  ErrorState,
  Loader,
  Toast,
} from '../../../components/common';
import { SearchableSelect } from '../../../components/ui/searchable-select';
import { Tooltip } from '../../../components/ui/tooltip';
import { useApi } from '../../../hooks/useApi';
import { usePagination } from '../../../hooks/usePagination';
import { useDebounce } from '../../../hooks/useDebounce';
import { useModal } from '../../../hooks/useModal';
import { toast } from '../../../hooks/useToast';
import { formatDateTime } from '../../../utils/date';
import { formatName } from '../../../utils/format';
import { getErrorMessage } from '../../../utils/errorHandler';
import adminUserService from '../services/adminUser.service';
import masterGenericService from '../../masterManagement/services/masterGeneric.service';
import academicService from '../../masterManagement/services/academic.service';
import AssignRelationshipsModal from '../components/AssignRelationshipsModal';

/**
 * Teacher <-> Student assignments - many-to-many, scoped to a subject and
 * grade. The same teacher and student can be linked more than once (Math
 * Grade 2 and English Grade 2 are different assignments), so every row on
 * this page always shows the subject and grade it was made under.
 *
 * The bulk assign form (`AssignRelationshipsModal`) lives in a modal rather
 * than permanently at the top of the page - the many-to-many logic there is
 * unchanged, just no longer dominating the screen when the admin only wants
 * to browse or filter existing assignments.
 */
const RELATIONSHIP_TYPE = 'teacher_student';
const MASTER_QUERY = { status: 'active', sortBy: 'display_order', sortOrder: 'asc', limit: 100 };

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];
const STATUS_FILTER_OPTIONS = [{ value: '', label: 'All statuses' }, ...STATUS_OPTIONS];

const VIEW_TABS = [
  { key: 'all', label: 'All Assignments' },
  { key: 'byTeacher', label: 'By Teacher' },
  { key: 'byStudent', label: 'By Student' },
];

/** Splits one person's flat assignment list into per subject/grade groups. */
function groupBySubjectGrade(items, otherKey) {
  const map = new Map();

  for (const item of items) {
    const other = item[otherKey];
    if (!other) continue;

    const key = `${item.subject ?? ''}|${item.grade ?? ''}`;
    if (!map.has(key)) map.set(key, { subject: item.subject, grade: item.grade, people: [] });

    map.get(key).people.push({
      ...other,
      relationshipId: item.id,
      status: item.status,
      academicYear: item.academicYear,
    });
  }

  return [...map.values()];
}

/** "By Teacher" / "By Student": one card per person, grouped by subject + grade. */
function GroupedAssignments({ groups, otherKey, savingId, onStatusChange, onUnassign, onOpenAssign }) {
  if (groups.length === 0) {
    return (
      <EmptyState
        icon="🔗"
        title="No assignments match these filters"
        description="Try adjusting the filters above, or assign a teacher and student."
        action={
          <Button startIcon={<LuUserPlus aria-hidden="true" />} onClick={onOpenAssign}>
            Assign Teachers & Students
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <Card key={group.person.id} className="ui-field">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <Link to={`/admin/users/${group.person.id}`} className="text-base font-semibold">
              {formatName(group.person)}
            </Link>
            <Badge variant="neutral">
              {group.items.length} assignment{group.items.length === 1 ? '' : 's'}
            </Badge>
          </div>

          <div className="flex flex-col gap-3">
            {groupBySubjectGrade(group.items, otherKey).map((sg) => (
              <div
                key={`${sg.subject}|${sg.grade}`}
                className="border-l-2 pl-3"
                style={{ borderColor: 'var(--color-border-default)' }}
              >
                <div className="mb-2 flex flex-wrap items-center gap-1.5 text-sm font-semibold">
                  <Badge variant="neutral">{sg.subject || 'No subject'}</Badge>
                  <Badge variant="info">{sg.grade || 'No grade'}</Badge>
                </div>

                <ul className="flex flex-col gap-2">
                  {sg.people.map((person) => (
                    <li key={person.relationshipId} className="flex flex-wrap items-center gap-2 text-sm">
                      <Link to={`/admin/users/${person.id}`}>{formatName(person)}</Link>
                      {person.academicYear && <Badge variant="neutral">{person.academicYear.name}</Badge>}

                      <Select
                        value={person.status}
                        onChange={(e) => onStatusChange(person.relationshipId, e.target.value)}
                        options={STATUS_OPTIONS}
                        disabled={savingId === person.relationshipId}
                        fieldClassName="mb-0"
                        className="!w-auto"
                      />

                      <Tooltip label="Unassign" side="top">
                        <IconButton
                          icon={<LuUnlink aria-hidden="true" />}
                          label="Unassign"
                          size="sm"
                          onClick={() =>
                            onUnassign(
                              otherKey === 'related'
                                ? { id: person.relationshipId, owner: group.person, related: person }
                                : { id: person.relationshipId, owner: person, related: group.person }
                            )
                          }
                        />
                      </Tooltip>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function RelationshipsPage() {
  const pagination = usePagination();
  const { page, limit, applyMeta, goToPage } = pagination;

  const [view, setView] = useState('all');

  // --- reference data: subjects, grades, academic years -------------------
  const subjects = useApi(masterGenericService.listItems);
  const grades = useApi(masterGenericService.listItems);
  const academicYears = useApi(academicService.listAcademicYears);

  const { run: runSubjects } = subjects;
  const { run: runGrades } = grades;
  const { run: runAcademicYears } = academicYears;

  useEffect(() => {
    runSubjects('subjects', MASTER_QUERY).catch(() => {});
  }, [runSubjects]);

  useEffect(() => {
    runGrades('grade_levels', MASTER_QUERY).catch(() => {});
  }, [runGrades]);

  useEffect(() => {
    runAcademicYears({ status: 'active', sortBy: 'display_order', sortOrder: 'asc', limit: 100 }).catch(() => {});
  }, [runAcademicYears]);

  const subjectOptions = useMemo(
    () => (subjects.data ?? []).map((s) => ({ value: s.name, label: s.name })),
    [subjects.data]
  );
  const gradeOptions = useMemo(
    () => (grades.data ?? []).map((g) => ({ value: g.name, label: g.name })),
    [grades.data]
  );
  const academicYearOptions = useMemo(
    () => (academicYears.data ?? []).map((y) => ({ value: y.id, label: y.name })),
    [academicYears.data]
  );

  const noSubjects = !subjects.isLoading && subjectOptions.length === 0;
  const noGrades = !grades.isLoading && gradeOptions.length === 0;

  // --- assign modal -----------------------------------------------------------
  const assignModal = useModal();

  // --- filters --------------------------------------------------------------
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState(null);
  const [filterGrade, setFilterGrade] = useState(null);
  const [filterAcademicYearId, setFilterAcademicYearId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTeacherId, setFilterTeacherId] = useState(null);
  const [filterStudentId, setFilterStudentId] = useState(null);
  const [filterTeacherSearch, setFilterTeacherSearch] = useState('');
  const [filterStudentSearch, setFilterStudentSearch] = useState('');

  const debouncedSearch = useDebounce(search, 350);
  const debouncedFilterTeacherSearch = useDebounce(filterTeacherSearch, 350);
  const debouncedFilterStudentSearch = useDebounce(filterStudentSearch, 350);

  const filterTeachers = useApi(adminUserService.listUsers);
  const filterStudents = useApi(adminUserService.listUsers);

  const { run: runFilterTeachers } = filterTeachers;
  const { run: runFilterStudents } = filterStudents;

  useEffect(() => {
    runFilterTeachers({ role: 'TEACHER', status: 'active', search: debouncedFilterTeacherSearch, limit: 50 }).catch(() => {});
  }, [runFilterTeachers, debouncedFilterTeacherSearch]);

  useEffect(() => {
    runFilterStudents({ role: 'STUDENT', status: 'active', search: debouncedFilterStudentSearch, limit: 50 }).catch(() => {});
  }, [runFilterStudents, debouncedFilterStudentSearch]);

  const filterTeacherOptions = useMemo(
    () => (filterTeachers.data ?? []).map((t) => ({ value: t.id, label: formatName(t), description: t.email })),
    [filterTeachers.data]
  );
  const filterStudentOptions = useMemo(
    () => (filterStudents.data ?? []).map((s) => ({ value: s.id, label: formatName(s), description: s.email })),
    [filterStudents.data]
  );

  const filters = useMemo(
    () => ({
      subject: filterSubject || undefined,
      grade: filterGrade || undefined,
      academicYearId: filterAcademicYearId || undefined,
      status: filterStatus || undefined,
      teacherId: filterTeacherId || undefined,
      studentId: filterStudentId || undefined,
      search: debouncedSearch || undefined,
    }),
    [filterSubject, filterGrade, filterAcademicYearId, filterStatus, filterTeacherId, filterStudentId, debouncedSearch]
  );

  const hasActiveFilters =
    Boolean(search) ||
    Boolean(filterSubject) ||
    Boolean(filterGrade) ||
    Boolean(filterAcademicYearId) ||
    Boolean(filterStatus) ||
    Boolean(filterTeacherId) ||
    Boolean(filterStudentId);

  const clearFilters = () => {
    setSearch('');
    setFilterSubject(null);
    setFilterGrade(null);
    setFilterAcademicYearId(null);
    setFilterStatus('');
    setFilterTeacherId(null);
    setFilterStudentId(null);
    goToPage(1);
  };

  const withFilterReset = (setter) => (next) => {
    setter(next);
    goToPage(1);
  };

  // --- list / grouped views --------------------------------------------------
  const list = useApi(adminUserService.listRelationships);
  const grouped = useApi(adminUserService.listRelationshipsGrouped);

  const { run: runList, meta: listMeta } = list;
  const { run: runGrouped } = grouped;

  const loadList = useCallback(
    () => runList({ page, limit, relationshipType: RELATIONSHIP_TYPE, ...filters }),
    [runList, page, limit, filters]
  );

  const loadGrouped = useCallback(
    () => runGrouped({ groupBy: view === 'byStudent' ? 'student' : 'teacher', ...filters }),
    [runGrouped, view, filters]
  );

  const refreshCurrentView = useCallback(
    () => (view === 'all' ? loadList() : loadGrouped()),
    [view, loadList, loadGrouped]
  );

  useEffect(() => {
    refreshCurrentView().catch(() => {});
  }, [refreshCurrentView]);

  useEffect(() => {
    if (view === 'all' && listMeta?.total !== undefined) applyMeta(listMeta);
  }, [view, listMeta, applyMeta]);

  // --- row actions: status edit + unassign -----------------------------------
  const [savingId, setSavingId] = useState(null);
  const removeModal = useModal();
  const [deleting, setDeleting] = useState(false);

  const handleStatusChange = async (id, status) => {
    setSavingId(id);
    try {
      await adminUserService.updateRelationship(id, { status });
      toast.success('Status updated');
      await refreshCurrentView();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingId(null);
    }
  };

  const handleUnassign = async () => {
    setDeleting(true);
    try {
      await adminUserService.deleteRelationship(removeModal.payload.id);
      toast.success('Assignment removed');
      removeModal.close();
      await refreshCurrentView();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  // --- table (All Assignments) ------------------------------------------------
  const columns = [
    {
      key: 'owner',
      header: 'Teacher',
      render: (row) => (
        <Link to={`/admin/users/${row.owner?.id}`} className="font-semibold">
          {formatName(row.owner)}
        </Link>
      ),
    },
    {
      key: 'related',
      header: 'Student',
      render: (row) => <Link to={`/admin/users/${row.related?.id}`}>{formatName(row.related)}</Link>,
    },
    {
      key: 'subject',
      header: 'Subject',
      render: (row) => (row.subject ? <Badge variant="neutral">{row.subject}</Badge> : '—'),
    },
    {
      key: 'grade',
      header: 'Grade',
      render: (row) => (row.grade ? <Badge variant="info">{row.grade}</Badge> : '—'),
    },
    {
      key: 'academicYear',
      header: 'Academic Year',
      className: 'hidden lg:table-cell',
      render: (row) => (row.academicYear?.name ? <Badge variant="neutral">{row.academicYear.name}</Badge> : '—'),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Select
          value={row.status}
          onChange={(e) => handleStatusChange(row.id, e.target.value)}
          options={STATUS_OPTIONS}
          disabled={savingId === row.id}
          fieldClassName="mb-0"
          className="!w-auto"
        />
      ),
    },
    {
      key: 'createdAt',
      header: 'Assigned Date',
      className: 'hidden lg:table-cell',
      render: (row) => formatDateTime(row.createdAt),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      width: 64,
      render: (row) => (
        <Tooltip label="Unassign" side="top">
          <IconButton
            icon={<LuUnlink aria-hidden="true" />}
            label="Unassign"
            size="sm"
            onClick={() => removeModal.open(row)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Teacher & Student Assignments"
        description="One teacher can be assigned to many students, and one student can have many teachers - each link is scoped to a subject and grade."
        actions={
          <Button startIcon={<LuUserPlus aria-hidden="true" />} onClick={() => assignModal.open()}>
            Assign Teachers & Students
          </Button>
        }
      />

      {(noSubjects || noGrades) && (
        <Alert variant="warning" title="Master data missing" className="ui-field">
          {noSubjects && <div>Add subjects in Master Management before assigning teachers.</div>}
          {noGrades && <div>Add grade levels in Master Management before assigning teachers.</div>}
        </Alert>
      )}

      <Tabs items={VIEW_TABS} activeKey={view} onChange={setView} className="ui-field" />

      <SectionHeader
        title="Filters"
        description="Narrow the list below by teacher, student, subject, grade, academic year or status."
        actions={
          hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          )
        }
      />

      <Card className="ui-field">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <SearchInput
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => withFilterReset(setSearch)(e.target.value)}
            onClear={() => withFilterReset(setSearch)('')}
          />

          <SearchableSelect
            label="Teacher"
            options={filterTeacherOptions}
            value={filterTeacherId}
            onChange={withFilterReset(setFilterTeacherId)}
            loading={filterTeachers.isLoading}
            placeholder="Any teacher"
            searchPlaceholder="Search teachers…"
            onSearchChange={setFilterTeacherSearch}
            filterLocally={false}
          />

          <SearchableSelect
            label="Student"
            options={filterStudentOptions}
            value={filterStudentId}
            onChange={withFilterReset(setFilterStudentId)}
            loading={filterStudents.isLoading}
            placeholder="Any student"
            searchPlaceholder="Search students…"
            onSearchChange={setFilterStudentSearch}
            filterLocally={false}
          />

          <SearchableSelect
            label="Subject"
            options={subjectOptions}
            value={filterSubject}
            onChange={withFilterReset(setFilterSubject)}
            loading={subjects.isLoading}
            placeholder="Any subject"
            searchPlaceholder="Search subjects…"
          />

          <SearchableSelect
            label="Grade"
            options={gradeOptions}
            value={filterGrade}
            onChange={withFilterReset(setFilterGrade)}
            loading={grades.isLoading}
            placeholder="Any grade"
            searchPlaceholder="Search grades…"
          />

          <SearchableSelect
            label="Academic Year"
            options={academicYearOptions}
            value={filterAcademicYearId}
            onChange={withFilterReset(setFilterAcademicYearId)}
            loading={academicYears.isLoading}
            placeholder="Any academic year"
            searchPlaceholder="Search academic years…"
          />

          <Select
            label="Status"
            value={filterStatus}
            onChange={(e) => withFilterReset(setFilterStatus)(e.target.value)}
            options={STATUS_FILTER_OPTIONS}
          />
        </div>
      </Card>

      {view === 'all' ? (
        <DataTable
          columns={columns}
          data={list.data ?? []}
          isLoading={list.isLoading}
          error={list.error}
          onRetry={loadList}
          pagination={pagination}
          onPageChange={goToPage}
          emptyTitle={hasActiveFilters ? 'No assignments match these filters' : 'No assignments yet'}
          emptyDescription={
            hasActiveFilters
              ? 'Try adjusting the filters above, or assign a teacher and student.'
              : 'Assign a teacher and student to get started.'
          }
          emptyAction={
            !hasActiveFilters && (
              <Button startIcon={<LuUserPlus aria-hidden="true" />} onClick={() => assignModal.open()}>
                Assign Teachers & Students
              </Button>
            )
          }
          caption="Teacher and student assignments"
        />
      ) : grouped.error ? (
        <ErrorState error={grouped.error} onRetry={loadGrouped} />
      ) : grouped.isLoading && !grouped.data ? (
        <Loader message="Loading assignments…" />
      ) : (
        <GroupedAssignments
          groups={grouped.data?.groups ?? []}
          otherKey={view === 'byStudent' ? 'owner' : 'related'}
          savingId={savingId}
          onStatusChange={handleStatusChange}
          onUnassign={removeModal.open}
          onOpenAssign={() => assignModal.open()}
        />
      )}

      <AssignRelationshipsModal
        isOpen={assignModal.isOpen}
        onClose={assignModal.close}
        onAssigned={refreshCurrentView}
        subjectOptions={subjectOptions}
        subjectsLoading={subjects.isLoading}
        gradeOptions={gradeOptions}
        gradesLoading={grades.isLoading}
        academicYearOptions={academicYearOptions}
        academicYearsLoading={academicYears.isLoading}
        noSubjects={noSubjects}
        noGrades={noGrades}
      />

      <ConfirmationModal
        isOpen={removeModal.isOpen}
        onClose={removeModal.close}
        onConfirm={handleUnassign}
        title="Unassign this student?"
        message={
          removeModal.payload
            ? `${formatName(removeModal.payload.related)} will no longer be assigned to ${formatName(removeModal.payload.owner)}${removeModal.payload.subject ? ` for ${removeModal.payload.subject}` : ''}${removeModal.payload.grade ? ` (${removeModal.payload.grade})` : ''}. Neither account is deleted.`
            : ''
        }
        confirmLabel="Unassign"
        variant="danger"
        loading={deleting}
      />

      <Toast />
    </>
  );
}
