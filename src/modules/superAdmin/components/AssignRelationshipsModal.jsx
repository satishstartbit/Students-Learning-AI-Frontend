import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Modal, MultiSelect, Select } from '../../../components/common';
import { SearchableSelect } from '../../../components/ui/searchable-select';
import { useApi } from '../../../hooks/useApi';
import { useDebounce } from '../../../hooks/useDebounce';
import { toast } from '../../../hooks/useToast';
import { getErrorMessage } from '../../../utils/errorHandler';
import { formatName } from '../../../utils/format';
import adminUserService from '../services/adminUser.service';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

/**
 * "Assign teachers & students" as a modal - same bulk many-to-many logic
 * `RelationshipsPage.jsx` always ran inline (every teacher chosen is linked
 * to every student chosen, in one request; pairs that already exist for the
 * same subject/grade/year are skipped rather than rejected), just no longer
 * permanently occupying the top of the page.
 *
 * Subject/grade/academic-year options are passed down from the page, which
 * already loads them for its filter row - fetching them again here would be
 * a redundant request for data the page has moments before opening this.
 */
export default function AssignRelationshipsModal({
  isOpen,
  onClose,
  onAssigned,
  subjectOptions,
  subjectsLoading,
  gradeOptions,
  gradesLoading,
  academicYearOptions,
  academicYearsLoading,
  noSubjects,
  noGrades,
}) {
  const [subject, setSubject] = useState(null);
  const [grade, setGrade] = useState(null);
  const [teacherIds, setTeacherIds] = useState([]);
  const [studentIds, setStudentIds] = useState([]);
  const [academicYearId, setAcademicYearId] = useState(null);
  const [status, setStatus] = useState('active');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  const debouncedTeacherSearch = useDebounce(teacherSearch, 350);
  const debouncedStudentSearch = useDebounce(studentSearch, 350);

  const teachers = useApi(adminUserService.listUsers);
  const students = useApi(adminUserService.listUsers);
  const { run: runTeachers } = teachers;
  const { run: runStudents } = students;

  const readyForPeople = Boolean(subject && grade);

  // Teachers are only meaningful once both subject and grade are chosen -
  // both narrow the search server-side, so a large staff list stays paged.
  useEffect(() => {
    if (!isOpen || !subject || !grade) return;
    runTeachers({ role: 'TEACHER', status: 'active', subject, grade, search: debouncedTeacherSearch, limit: 100 }).catch(() => {});
  }, [isOpen, runTeachers, subject, grade, debouncedTeacherSearch]);

  useEffect(() => {
    if (!isOpen || !grade) return;
    runStudents({ role: 'STUDENT', status: 'active', grade, search: debouncedStudentSearch, limit: 100 }).catch(() => {});
  }, [isOpen, runStudents, grade, debouncedStudentSearch]);

  const teacherOptions = useMemo(
    () => (teachers.data ?? []).map((t) => ({ value: t.id, label: formatName(t), description: t.email })),
    [teachers.data]
  );
  const studentOptions = useMemo(
    () => (students.data ?? []).map((s) => ({ value: s.id, label: formatName(s), description: s.email })),
    [students.data]
  );

  const reset = () => {
    setSubject(null);
    setGrade(null);
    setTeacherIds([]);
    setStudentIds([]);
    setAcademicYearId(null);
    setStatus('active');
    setError(null);
    setTeacherSearch('');
    setStudentSearch('');
  };

  const handleClose = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const handleSubjectChange = (next) => {
    setSubject(next);
    // The teacher list is narrowed by subject; a previous pick may no longer apply.
    setTeacherIds([]);
    setError(null);
  };

  const handleGradeChange = (next) => {
    setGrade(next);
    // Both lists are narrowed by grade.
    setTeacherIds([]);
    setStudentIds([]);
    setError(null);
  };

  const cartesianCount = teacherIds.length * studentIds.length;
  const canAssign = Boolean(subject && grade && teacherIds.length && studentIds.length && academicYearId) && !busy;

  const handleAssign = async (event) => {
    event.preventDefault();
    setError(null);

    if (!subject) return setError('Select a subject');
    if (!grade) return setError('Select a grade');
    if (!teacherIds.length) return setError('Select at least one teacher');
    if (!studentIds.length) return setError('Select at least one student');
    if (!academicYearId) return setError('Select an academic year');

    setBusy(true);
    try {
      const result = await adminUserService.bulkAssignRelationships({
        subject,
        grade,
        teacherIds,
        studentIds,
        academicYearId,
        status,
      });

      const { createdCount, skippedCount } = result.data;
      toast.success(
        skippedCount > 0
          ? `${createdCount} assignment(s) created, ${skippedCount} already existed`
          : `${createdCount} assignment(s) created`
      );

      reset();
      onClose();
      await onAssigned?.();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Assign teachers & students"
      description="Select a subject and grade, then choose one or more teachers and students. Every teacher chosen is linked to every student chosen."
      size="lg"
      closeOnOverlayClick={!busy}
      closeOnEscape={!busy}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleAssign} loading={busy} disabled={!canAssign}>
            Assign
          </Button>
        </>
      }
    >
      <form onSubmit={handleAssign} className="flex flex-col gap-4">
        {error && (
          <Alert variant="error" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {(noSubjects || noGrades) && (
          <Alert variant="warning" title="Master data missing">
            {noSubjects && <div>Add subjects in Master Management before assigning teachers.</div>}
            {noGrades && <div>Add grade levels in Master Management before assigning teachers.</div>}
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <SearchableSelect
            label="1. Subject"
            required
            options={subjectOptions}
            value={subject}
            onChange={handleSubjectChange}
            loading={subjectsLoading}
            placeholder="Select subject"
            searchPlaceholder="Search subjects…"
            emptyMessage="No subjects available"
          />

          <SearchableSelect
            label="2. Grade"
            required
            options={gradeOptions}
            value={grade}
            onChange={handleGradeChange}
            loading={gradesLoading}
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
            options={teacherOptions}
            value={teacherIds}
            onChange={setTeacherIds}
            onSearchChange={setTeacherSearch}
            filterLocally={false}
            loading={teachers.isLoading}
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
            options={studentOptions}
            value={studentIds}
            onChange={setStudentIds}
            onSearchChange={setStudentSearch}
            filterLocally={false}
            loading={students.isLoading}
            disabled={!readyForPeople}
            placeholder={readyForPeople ? 'Search and select students' : 'Select subject and grade first'}
            searchPlaceholder="Search students…"
          />
        </div>

        {cartesianCount > 0 && (
          <Alert variant="info">
            {teacherIds.length} teacher{teacherIds.length === 1 ? '' : 's'} × {studentIds.length} student
            {studentIds.length === 1 ? '' : 's'} = <strong>{cartesianCount}</strong> assignment
            {cartesianCount === 1 ? '' : 's'} will be created for {subject} — {grade}. Assignments that already
            exist are skipped automatically.
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <SearchableSelect
            label="5. Academic Year"
            required
            options={academicYearOptions}
            value={academicYearId}
            onChange={setAcademicYearId}
            loading={academicYearsLoading}
            placeholder="Select academic year"
            searchPlaceholder="Search academic years…"
            emptyMessage="No academic years available"
          />

          <Select label="6. Status" value={status} onChange={(e) => setStatus(e.target.value)} options={STATUS_OPTIONS} />
        </div>
      </form>
    </Modal>
  );
}
