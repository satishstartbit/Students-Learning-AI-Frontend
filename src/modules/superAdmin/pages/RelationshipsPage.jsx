import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PageHeader,
  Card,
  Button,
  SearchInput,
  DataTable,
  ConfirmationModal,
  Alert,
  SectionHeader,
  Badge,
  Tabs,
  Select,
  MultiSelect,
  EmptyState,
  ErrorState,
  Loader,
  Toast,
} from '../../../components/common';
import { SearchableSelect } from '../../../components/ui/searchable-select';
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

/**
 * Teacher <-> Student assignments - many-to-many, scoped to a subject and
 * grade. The same teacher and student can be linked more than once (Math
 * Grade 2 and English Grade 2 are different assignments), so every row on
 * this page always shows the subject and grade it was made under.
 *
 * The assignment form is a bulk operation: every teacher chosen is linked to
 * every student chosen (the cartesian product), in one request. Pairs that
 * already exist for the same subject/grade/year are skipped rather than
 * rejected, so resubmitting an overlapping selection is always safe.
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
function GroupedAssignments({ groups, otherKey, savingId, onStatusChange, onUnassign }) {
  if (groups.length === 0) {
    return (
      <EmptyState
        title="No assignments match these filters"
        description="Try adjusting the filters above, or assign a teacher and student using the form."
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
                <div className="mb-1 text-sm font-semibold">
                  → {sg.subject || 'No subject'} — {sg.grade || 'No grade'}
                </div>

                <ul className="flex flex-col gap-2">
                  {sg.people.map((person) => (
                    <li key={person.relationshipId} className="flex flex-wrap items-center gap-2 text-sm">
                      <span aria-hidden="true">→</span>
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

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          onUnassign(
                            otherKey === 'related'
                              ? { id: person.relationshipId, owner: group.person, related: person }
                              : { id: person.relationshipId, owner: person, related: group.person }
                          )
                        }
                      >
                        Unassign
                      </Button>
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

  // --- assignment form ------------------------------------------------------
  const [formSubject, setFormSubject] = useState(null);
  const [formGrade, setFormGrade] = useState(null);
  const [formTeacherIds, setFormTeacherIds] = useState([]);
  const [formStudentIds, setFormStudentIds] = useState([]);
  const [formAcademicYearId, setFormAcademicYearId] = useState(null);
  const [formStatus, setFormStatus] = useState('active');
  const [formError, setFormError] = useState(null);
  const [assignResult, setAssignResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  const debouncedTeacherSearch = useDebounce(teacherSearch, 350);
  const debouncedStudentSearch = useDebounce(studentSearch, 350);

  const formTeachers = useApi(adminUserService.listUsers);
  const formStudents = useApi(adminUserService.listUsers);

  const { run: runFormTeachers } = formTeachers;
  const { run: runFormStudents } = formStudents;

  // Teachers are only meaningful once both subject and grade are chosen -
  // both narrow the search server-side, so a large staff list stays paged.
  useEffect(() => {
    if (!formSubject || !formGrade) return;
    runFormTeachers({
      role: 'TEACHER',
      status: 'active',
      subject: formSubject,
      grade: formGrade,
      search: debouncedTeacherSearch,
      limit: 100,
    }).catch(() => {});
  }, [runFormTeachers, formSubject, formGrade, debouncedTeacherSearch]);

  useEffect(() => {
    if (!formGrade) return;
    runFormStudents({
      role: 'STUDENT',
      status: 'active',
      grade: formGrade,
      search: debouncedStudentSearch,
      limit: 100,
    }).catch(() => {});
  }, [runFormStudents, formGrade, debouncedStudentSearch]);

  const formTeacherOptions = useMemo(
    () => (formTeachers.data ?? []).map((t) => ({ value: t.id, label: formatName(t), description: t.email })),
    [formTeachers.data]
  );
  const formStudentOptions = useMemo(
    () => (formStudents.data ?? []).map((s) => ({ value: s.id, label: formatName(s), description: s.email })),
    [formStudents.data]
  );

  const readyForPeople = Boolean(formSubject && formGrade);

  const handleSubjectChange = (next) => {
    setFormSubject(next);
    // The teacher list is narrowed by subject; a previous pick may no longer apply.
    setFormTeacherIds([]);
    setFormError(null);
  };

  const handleGradeChange = (next) => {
    setFormGrade(next);
    // Both lists are narrowed by grade.
    setFormTeacherIds([]);
    setFormStudentIds([]);
    setFormError(null);
  };

  const canAssign =
    Boolean(formSubject && formGrade && formTeacherIds.length && formStudentIds.length && formAcademicYearId) &&
    !busy;

  const handleAssign = async (event) => {
    event.preventDefault();
    setFormError(null);
    setAssignResult(null);

    if (!formSubject) return setFormError('Select a subject');
    if (!formGrade) return setFormError('Select a grade');
    if (!formTeacherIds.length) return setFormError('Select at least one teacher');
    if (!formStudentIds.length) return setFormError('Select at least one student');
    if (!formAcademicYearId) return setFormError('Select an academic year');

    setBusy(true);
    try {
      const result = await adminUserService.bulkAssignRelationships({
        subject: formSubject,
        grade: formGrade,
        teacherIds: formTeacherIds,
        studentIds: formStudentIds,
        academicYearId: formAcademicYearId,
        status: formStatus,
      });

      const { createdCount, skippedCount } = result.data;
      setAssignResult({ createdCount, skippedCount });
      toast.success(
        skippedCount > 0
          ? `${createdCount} assignment(s) created, ${skippedCount} already existed`
          : `${createdCount} assignment(s) created`
      );

      setFormTeacherIds([]);
      setFormStudentIds([]);
      await refreshCurrentView();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

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
    { key: 'subject', header: 'Subject', render: (row) => row.subject || '—' },
    { key: 'grade', header: 'Grade', render: (row) => row.grade || '—' },
    { key: 'academicYear', header: 'Academic Year', render: (row) => row.academicYear?.name ?? '—' },
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
    { key: 'createdAt', header: 'Assigned Date', render: (row) => formatDateTime(row.createdAt) },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <Button size="sm" variant="secondary" onClick={() => removeModal.open(row)}>
          Unassign
        </Button>
      ),
    },
  ];

  const cartesianCount = formTeacherIds.length * formStudentIds.length;

  return (
    <>
      <PageHeader
        title="Teacher & Student Assignments"
        description="One teacher can be assigned to many students, and one student can have many teachers - each link is scoped to a subject and grade."
      />

      <Card
        title="Assign teachers & students"
        subtitle="Select a subject and grade, then choose one or more teachers and students. Every teacher chosen is linked to every student chosen."
        className="ui-field"
      >
        {formError && (
          <Alert variant="error" className="ui-field" onDismiss={() => setFormError(null)}>
            {formError}
          </Alert>
        )}

        {assignResult && (
          <Alert variant="success" className="ui-field" onDismiss={() => setAssignResult(null)}>
            {assignResult.createdCount} assignment{assignResult.createdCount === 1 ? '' : 's'} created
            {assignResult.skippedCount > 0 && `, ${assignResult.skippedCount} already existed`}.
          </Alert>
        )}

        {(noSubjects || noGrades) && (
          <Alert variant="warning" title="Master data missing" className="ui-field">
            {noSubjects && <div>Add subjects in Master Management before assigning teachers.</div>}
            {noGrades && <div>Add grade levels in Master Management before assigning teachers.</div>}
          </Alert>
        )}

        <form onSubmit={handleAssign}>
          <div className="grid gap-4 md:grid-cols-2">
            <SearchableSelect
              label="1. Subject"
              required
              options={subjectOptions}
              value={formSubject}
              onChange={handleSubjectChange}
              loading={subjects.isLoading}
              placeholder="Select subject"
              searchPlaceholder="Search subjects…"
              emptyMessage="No subjects available"
            />

            <SearchableSelect
              label="2. Grade"
              required
              options={gradeOptions}
              value={formGrade}
              onChange={handleGradeChange}
              loading={grades.isLoading}
              placeholder="Select grade"
              searchPlaceholder="Search grades…"
              emptyMessage="No grade levels available"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <MultiSelect
              label="3. Teachers"
              required
              searchable
              showSelectAll
              options={formTeacherOptions}
              value={formTeacherIds}
              onChange={setFormTeacherIds}
              onSearchChange={setTeacherSearch}
              filterLocally={false}
              loading={formTeachers.isLoading}
              disabled={!readyForPeople}
              placeholder={readyForPeople ? 'Search and select teachers' : 'Select subject and grade first'}
              searchPlaceholder="Search teachers…"
              hint="Every teacher selected is linked to every student selected below."
            />

            <MultiSelect
              label="4. Students"
              required
              searchable
              showSelectAll
              options={formStudentOptions}
              value={formStudentIds}
              onChange={setFormStudentIds}
              onSearchChange={setStudentSearch}
              filterLocally={false}
              loading={formStudents.isLoading}
              disabled={!readyForPeople}
              placeholder={readyForPeople ? 'Search and select students' : 'Select subject and grade first'}
              searchPlaceholder="Search students…"
            />
          </div>

          {cartesianCount > 0 && (
            <Alert variant="info" className="ui-field">
              {formTeacherIds.length} teacher{formTeacherIds.length === 1 ? '' : 's'} × {formStudentIds.length}{' '}
              student{formStudentIds.length === 1 ? '' : 's'} = <strong>{cartesianCount}</strong> assignment
              {cartesianCount === 1 ? '' : 's'} will be created for {formSubject} — {formGrade}. Assignments that
              already exist are skipped automatically.
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <SearchableSelect
              label="5. Academic Year"
              required
              options={academicYearOptions}
              value={formAcademicYearId}
              onChange={setFormAcademicYearId}
              loading={academicYears.isLoading}
              placeholder="Select academic year"
              searchPlaceholder="Search academic years…"
              emptyMessage="No academic years available"
            />

            <Select
              label="6. Status"
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value)}
              options={STATUS_OPTIONS}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={busy} disabled={!canAssign}>
              Assign teachers to students
            </Button>
          </div>
        </form>
      </Card>

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
              ? 'Try adjusting the filters above.'
              : 'Use the form above to assign teachers and students.'
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
        />
      )}

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
