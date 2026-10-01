import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LuFilterX, LuUnlink, LuUserPlus } from 'react-icons/lu';
import {
  PageHeader,
  Button,
  IconButton,
  SearchInput,
  DataTable,
  ConfirmationModal,
  Alert,
  FilterBar,
  Badge,
  Select,
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
import InviteTeachersModal from '../components/InviteTeachersModal';

/**
 * Teacher <-> Student assignments - many-to-many, scoped to a subject and
 * grade. The same teacher and student can be linked more than once (Math
 * Grade 2 and English Grade 2 are different assignments), so every row on
 * this page always shows the subject and grade it was made under.
 *
 * Nobody creates these links directly: "Invite Teachers" (InviteTeachersModal)
 * sends invitations, and a link appears here once the teacher accepts. This
 * page lists the accepted links and can pause, resume or remove them.
 */
const RELATIONSHIP_TYPE = 'teacher_student';
const MASTER_QUERY = { status: 'active', sortBy: 'display_order', sortOrder: 'asc', limit: 100 };

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];
const STATUS_FILTER_OPTIONS = [{ value: '', label: 'All statuses' }, ...STATUS_OPTIONS];

export default function RelationshipsPage() {
  const pagination = usePagination();
  const { page, limit, applyMeta, goToPage } = pagination;

  // --- reference data: subjects, grades, academic years -------------------
  const subjects = useApi(masterGenericService.listItems);
  const grades = useApi(masterGenericService.listItems);
  const academicYears = useApi(academicService.listAcademicYears);

  const { run: runSubjects } = subjects;
  const { run: runGrades } = grades;
  const { run: runAcademicYears } = academicYears;

  useEffect(() => {
    runSubjects('subjects', MASTER_QUERY).catch(() => { });
  }, [runSubjects]);

  useEffect(() => {
    runGrades('grade_levels', MASTER_QUERY).catch(() => { });
  }, [runGrades]);

  useEffect(() => {
    runAcademicYears({ status: 'active', sortBy: 'display_order', sortOrder: 'asc', limit: 100 }).catch(() => { });
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
    runFilterTeachers({ role: 'TEACHER', status: 'active', search: debouncedFilterTeacherSearch, limit: 50 }).catch(() => { });
  }, [runFilterTeachers, debouncedFilterTeacherSearch]);

  useEffect(() => {
    runFilterStudents({ role: 'STUDENT', status: 'active', search: debouncedFilterStudentSearch, limit: 50 }).catch(() => { });
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

  // --- list ----------------------------------------------------------------
  const list = useApi(adminUserService.listRelationships);
  const { run: runList, meta: listMeta } = list;

  const refreshCurrentView = useCallback(
    () => runList({ page, limit, relationshipType: RELATIONSHIP_TYPE, ...filters }),
    [runList, page, limit, filters]
  );
  const loadList = refreshCurrentView;

  useEffect(() => {
    refreshCurrentView().catch(() => { });
  }, [refreshCurrentView]);

  useEffect(() => {
    if (listMeta?.total !== undefined) applyMeta(listMeta);
  }, [listMeta, applyMeta]);

  // --- row action: unassign ---------------------------------------------------
  const removeModal = useModal();
  const [deleting, setDeleting] = useState(false);

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
            variant="danger"
            size="sm"
            onClick={() => removeModal.open(row)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="td-page">
      <PageHeader
        title="Teacher & Student Assignments"
        description="Teachers connect with students only by accepting an invitation - from a parent, or sent here with Invite Teachers. Each accepted link is scoped to a subject and grade. Track open invitations under Teacher invitations."
        actions={
          <Button startIcon={<LuUserPlus aria-hidden="true" />} onClick={() => assignModal.open()}>
            Invite Teachers
          </Button>
        }
      />

      {(noSubjects || noGrades) && (
        <Alert variant="warning" title="Master data missing" className="ui-field">
          {noSubjects && <div>Add subjects in Master Management before assigning teachers.</div>}
          {noGrades && <div>Add grade levels in Master Management before assigning teachers.</div>}
        </Alert>
      )}


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
          className="ui-field--compact"
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
          className="ui-field--compact"
          label="Subject"
          options={subjectOptions}
          value={filterSubject}
          onChange={withFilterReset(setFilterSubject)}
          loading={subjects.isLoading}
          placeholder="Any subject"
          searchPlaceholder="Search subjects…"
        />

        <SearchableSelect
          className="ui-field--compact"
          label="Grade"
          options={gradeOptions}
          value={filterGrade}
          onChange={withFilterReset(setFilterGrade)}
          loading={grades.isLoading}
          placeholder="Any grade"
          searchPlaceholder="Search grades…"
        />

        <SearchableSelect
          className="ui-field--compact"
          label="Academic Year"
          options={academicYearOptions}
          value={filterAcademicYearId}
          onChange={withFilterReset(setFilterAcademicYearId)}
          loading={academicYears.isLoading}
          placeholder="Any academic year"
          searchPlaceholder="Search academic years…"
        />

        <Select
          fieldClassName="ui-field--compact"
          label="Status"
          value={filterStatus}
          onChange={(e) => withFilterReset(setFilterStatus)(e.target.value)}
          options={STATUS_FILTER_OPTIONS}
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
        onRetry={loadList}
        pagination={pagination}
        onPageChange={goToPage}
        emptyTitle={hasActiveFilters ? 'No assignments match these filters' : 'No assignments yet'}
        emptyDescription={
          hasActiveFilters
            ? 'Try adjusting the filters above, or invite a teacher.'
            : 'Teachers appear here once they accept an invitation.'
        }
        emptyAction={
          !hasActiveFilters && (
            <Button startIcon={<LuUserPlus aria-hidden="true" />} onClick={() => assignModal.open()}>
              Invite Teachers
            </Button>
          )
        }
        caption="Teacher and student assignments"
      />

      <InviteTeachersModal
        isOpen={assignModal.isOpen}
        onClose={assignModal.close}
        onInvited={refreshCurrentView}
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

    </div>
  );
}
