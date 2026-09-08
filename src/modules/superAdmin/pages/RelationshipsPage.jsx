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

/**
 * Teacher to Student assignment.
 *
 * The form is sequential: Subject narrows the teachers, then a teacher and a
 * student are chosen, then the pair is assigned.
 *
 * Subject is a *filter for finding the right teacher* - it is not stored on
 * the assignment. user_relationships has no subject column, and subjects live
 * only in teacher_profiles.profile_data->'subjects', so recording a
 * per-assignment subject would need a schema change.
 *
 * Parent to child links are managed on the parent's own record, not here.
 */
const RELATIONSHIP_TYPE = 'teacher_student';

export default function RelationshipsPage() {
  const pagination = usePagination();
  const { page, limit, applyMeta, goToPage } = pagination;

  // --- assignment form ----------------------------------------------------
  const [subject, setSubject] = useState(null);
  const [teacherId, setTeacherId] = useState(null);
  const [studentId, setStudentId] = useState(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);

  const debouncedStudentSearch = useDebounce(studentSearch, 350);

  const subjects = useApi(adminUserService.listSubjects);
  const teachers = useApi(adminUserService.listUsers);
  const students = useApi(adminUserService.listUsers);
  const list = useApi(adminUserService.listRelationships);

  const removeModal = useModal();

  const { run: runSubjects } = subjects;
  const { run: runTeachers } = teachers;
  const { run: runStudents } = students;
  const { run: runList, meta } = list;

  // --- reference data -----------------------------------------------------
  useEffect(() => {
    runSubjects().catch(() => {});
  }, [runSubjects]);

  /*
   * Teachers are fetched only once a subject is chosen, and filtered on the
   * server - the whole teacher table is never pulled down to filter locally.
   */
  useEffect(() => {
    if (!subject) return;
    runTeachers({ role: 'TEACHER', status: 'active', subject, limit: 100 }).catch(() => {});
  }, [runTeachers, subject]);

  // Students are searched server-side, so a large roster stays paged.
  useEffect(() => {
    runStudents({
      role: 'STUDENT',
      status: 'active',
      search: debouncedStudentSearch,
      limit: 50,
    }).catch(() => {});
  }, [runStudents, debouncedStudentSearch]);

  // --- assignment list ----------------------------------------------------
  const [listSearch, setListSearch] = useState('');
  const debouncedListSearch = useDebounce(listSearch, 350);

  const loadList = useCallback(
    () =>
      runList({
        page,
        limit,
        relationshipType: RELATIONSHIP_TYPE,
        search: debouncedListSearch || undefined,
      }),
    [runList, page, limit, debouncedListSearch]
  );

  useEffect(() => {
    loadList().catch(() => {});
  }, [loadList]);

  useEffect(() => {
    if (meta?.total !== undefined) applyMeta(meta);
  }, [meta, applyMeta]);

  // --- subject change clears the teacher ----------------------------------
  const handleSubjectChange = (next) => {
    setSubject(next);
    // A teacher chosen for the old subject may not teach the new one.
    setTeacherId(null);
    setFormError(null);
  };

  // --- options ------------------------------------------------------------
  const subjectOptions = useMemo(
    () => (subjects.data ?? []).map((s) => ({ value: s, label: s })),
    [subjects.data]
  );

  const teacherOptions = useMemo(
    () =>
      (teachers.data ?? []).map((t) => ({
        value: t.id,
        label: formatName(t),
        description: t.email,
      })),
    [teachers.data]
  );

  const studentOptions = useMemo(
    () =>
      (students.data ?? []).map((s) => ({
        value: s.id,
        label: formatName(s),
        description: s.email,
      })),
    [students.data]
  );

  const canAssign = Boolean(subject && teacherId && studentId) && !busy;

  const handleAssign = async (event) => {
    event.preventDefault();
    setFormError(null);

    // The server validates all of this again; this is only for fast feedback.
    if (!subject) return setFormError('Select a subject');
    if (!teacherId) return setFormError('Select a teacher');
    if (!studentId) return setFormError('Select a student');

    setBusy(true);
    try {
      await adminUserService.createRelationship({
        relationshipType: RELATIONSHIP_TYPE,
        userId: teacherId,
        relatedUserId: studentId,
      });

      toast.success('Student assigned to teacher');
      setStudentId(null);
      setStudentSearch('');
      await loadList();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleUnassign = async () => {
    setBusy(true);
    try {
      await adminUserService.deleteRelationship(removeModal.payload.id);
      toast.success('Student unassigned');
      removeModal.close();
      await loadList();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  // --- table --------------------------------------------------------------
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
      render: (row) => (
        <Link to={`/admin/users/${row.related?.id}`}>{formatName(row.related)}</Link>
      ),
    },
    { key: 'email', header: 'Student email', render: (row) => row.related?.email ?? '—' },
    {
      key: 'status',
      header: 'Status',
      render: () => (
        <Badge variant="success" dot>
          Assigned
        </Badge>
      ),
    },
    { key: 'createdAt', header: 'Assigned on', render: (row) => formatDateTime(row.createdAt) },
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

  const noSubjects = !subjects.isLoading && subjectOptions.length === 0;

  return (
    <>
      <PageHeader
        title="Teacher assignments"
        description="Pick a subject to find the right teacher, then assign a student. Parent and child links are managed on the parent's own record."
      />

      <Card title="Assign a student to a teacher" className="ui-field">
        {formError && (
          <Alert variant="error" className="ui-field">
            {formError}
          </Alert>
        )}

        {noSubjects && (
          <Alert variant="warning" title="No subjects found" className="ui-field">
            Subjects come from each teacher&apos;s profile. Add subjects to a teacher (Users →
            Teachers → Edit) and they will appear here.
          </Alert>
        )}

        <form onSubmit={handleAssign}>
          <div className="grid gap-4 md:grid-cols-3">
            <SearchableSelect
              label="Subject"
              required
              options={subjectOptions}
              value={subject}
              onChange={handleSubjectChange}
              loading={subjects.isLoading}
              placeholder="Select subject"
              searchPlaceholder="Search subjects…"
              emptyMessage="No subjects available"
            />

            <SearchableSelect
              label="Teacher"
              required
              options={teacherOptions}
              value={teacherId}
              onChange={setTeacherId}
              loading={teachers.isLoading}
              disabled={!subject}
              disabledMessage="Select a subject first"
              placeholder="Search and select teacher"
              searchPlaceholder="Search teacher…"
              emptyMessage={`No teachers teach ${subject ?? 'this subject'}`}
            />

            <SearchableSelect
              label="Student"
              required
              options={studentOptions}
              value={studentId}
              onChange={setStudentId}
              loading={students.isLoading}
              placeholder="Search and select student"
              searchPlaceholder="Search student…"
              emptyMessage="No students found"
              // Searching happens on the server, so do not filter again here.
              onSearchChange={setStudentSearch}
              filterLocally={false}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={busy} disabled={!canAssign}>
              Assign student
            </Button>
          </div>
        </form>
      </Card>

      <SectionHeader
        title="Current assignments"
        description="Every teacher-student link on the platform."
        actions={
          <SearchInput
            placeholder="Search teacher or student"
            value={listSearch}
            onChange={(e) => {
              setListSearch(e.target.value);
              goToPage(1);
            }}
            onClear={() => setListSearch('')}
          />
        }
      />

      <DataTable
        columns={columns}
        data={list.data ?? []}
        isLoading={list.isLoading}
        error={list.error}
        onRetry={loadList}
        pagination={pagination}
        onPageChange={goToPage}
        emptyTitle={listSearch ? 'No assignments match that search' : 'No students assigned yet'}
        emptyDescription={
          listSearch
            ? 'Try a different name.'
            : 'Use the form above to assign a student to a teacher.'
        }
        caption="Teacher and student assignments"
      />

      <ConfirmationModal
        isOpen={removeModal.isOpen}
        onClose={removeModal.close}
        onConfirm={handleUnassign}
        title="Unassign this student?"
        message={
          removeModal.payload
            ? `${formatName(removeModal.payload.related)} will no longer be assigned to ${formatName(removeModal.payload.owner)}. Neither account is deleted.`
            : ''
        }
        confirmLabel="Unassign"
        variant="danger"
        loading={busy}
      />

      <Toast />
    </>
  );
}
