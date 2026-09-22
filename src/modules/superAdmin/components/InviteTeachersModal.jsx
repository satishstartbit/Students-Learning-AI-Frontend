import { useEffect, useState } from 'react';
import { Alert, Button, Modal, MultiSelect } from '../../../components/common';
import { SearchableSelect } from '../../../components/ui/searchable-select';
import { useApi } from '../../../hooks/useApi';
import { useDebounce } from '../../../hooks/useDebounce';
import { toast } from '../../../hooks/useToast';
import { getErrorMessage } from '../../../utils/errorHandler';
import { formatName } from '../../../utils/format';
import invitationService from '../../invitations/services/teacherInvitation.service';

/**
 * "Invite teachers" - Super Admin's way to connect teachers with students.
 * Nothing is linked here: every teacher chosen gets an invitation for every
 * student chosen, and only the teacher's Accept creates the link.
 *
 *   1. Subject(s)   2. Grade   -> 3. Teachers who teach them (search by name/email)
 *                              -> 4. Students in that grade (search by name/email)
 *   5. Academic year
 *
 * Pairs that already have an open invitation, or are already connected for
 * those subjects, are skipped and reported. Subject/grade/year options come
 * from the page, which already loads them for its filters.
 */
export default function InviteTeachersModal({
  isOpen,
  onClose,
  onInvited,
  subjectOptions,
  subjectsLoading,
  gradeOptions,
  gradesLoading,
  academicYearOptions,
  academicYearsLoading,
  noSubjects,
  noGrades,
}) {
  const [subjects, setSubjects] = useState([]);
  const [grade, setGrade] = useState(null);
  const [teacherIds, setTeacherIds] = useState([]);
  const [studentIds, setStudentIds] = useState([]);
  const [academicYearId, setAcademicYearId] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  // Chosen people's options, kept so their chips keep a name when a later search hides them.
  const [chosen, setChosen] = useState({});

  const teachers = useApi(invitationService.adminTeachers);
  const students = useApi(invitationService.adminStudents);
  const { run: runTeachers } = teachers;
  const { run: runStudents } = students;

  const debouncedTeacherSearch = useDebounce(teacherSearch, 350);
  const debouncedStudentSearch = useDebounce(studentSearch, 350);
  const readyForPeople = subjects.length > 0 && Boolean(grade);

  // Teachers only once subject(s) and grade are chosen - both narrow the list server-side.
  useEffect(() => {
    if (!isOpen || !readyForPeople) return;
    runTeachers({ subjects, grade, search: debouncedTeacherSearch }).catch(() => {});
  }, [isOpen, readyForPeople, subjects, grade, debouncedTeacherSearch, runTeachers]);

  useEffect(() => {
    if (!isOpen || !grade) return;
    runStudents({ grade, search: debouncedStudentSearch }).catch(() => {});
  }, [isOpen, grade, debouncedStudentSearch, runStudents]);

  const toOption = (p) => ({ value: p.id, label: formatName(p), description: p.email });
  /** Current results, plus any already-chosen person the current search no longer shows. */
  const withChosen = (items, selectedIds) => {
    const options = (readyForPeople && Array.isArray(items) ? items : []).map(toOption);
    const shown = new Set(options.map((o) => o.value));
    return [...selectedIds.filter((id) => !shown.has(id) && chosen[id]).map((id) => chosen[id]), ...options];
  };
  const teacherOptions = withChosen(teachers.data, teacherIds);
  const studentOptions = withChosen(students.data, studentIds);

  /** A MultiSelect change: remember the chosen options, then store the ids. */
  const choose = (setIds, options) => (ids) => {
    setChosen((prev) => {
      const next = { ...prev };
      options.forEach((o) => {
        if (ids.includes(o.value)) next[o.value] = o;
      });
      return next;
    });
    setIds(ids);
  };

  const reset = () => {
    setSubjects([]);
    setGrade(null);
    setTeacherIds([]);
    setStudentIds([]);
    setAcademicYearId(null);
    setError(null);
    setTeacherSearch('');
    setStudentSearch('');
  };

  const handleClose = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const handleSubjectsChange = (next) => {
    setSubjects(next);
    setTeacherIds([]); // the teacher list is narrowed by subject - earlier picks may no longer apply
    setError(null);
  };

  const handleGradeChange = (next) => {
    setGrade(next);
    setTeacherIds([]);
    setStudentIds([]);
    setError(null);
  };

  const pairCount = teacherIds.length * studentIds.length;
  const canSend = Boolean(subjects.length && grade && teacherIds.length && studentIds.length) && !busy;

  const handleSend = async (event) => {
    event.preventDefault();
    setError(null);
    if (!subjects.length) return setError('Select at least one subject');
    if (!grade) return setError('Select a grade');
    if (!teacherIds.length) return setError('Select at least one teacher');
    if (!studentIds.length) return setError('Select at least one student');

    setBusy(true);
    try {
      const { data } = await invitationService.adminInvite({ subjects, grade, teacherIds, studentIds, academicYearId });
      const skippedText = data.skippedCount
        ? ` ${data.skippedCount} skipped (already invited or already connected).`
        : '';
      if (data.createdCount === 0) toast.warning(`No new invitations -${skippedText}`);
      else toast.success(`${data.createdCount} invitation${data.createdCount === 1 ? '' : 's'} sent.${skippedText}`);
      if (data.emailFailures) toast.warning(`${data.emailFailures} email(s) could not be sent - re-send them from Teacher invitations.`);
      reset();
      onClose();
      await onInvited?.();
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
      title="Invite teachers"
      description="Choose the subject(s) and grade, then the teachers and students. Each teacher gets an invitation for each student, and is connected only when they accept."
      size="lg"
      closeOnOverlayClick={!busy}
      closeOnEscape={!busy}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleSend} loading={busy} disabled={!canSend}>
            Send invitations
          </Button>
        </>
      }
    >
      <form id="invite-teachers-form" onSubmit={handleSend} className="flex flex-col gap-4">
        {error && (
          <Alert variant="error" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {(noSubjects || noGrades) && (
          <Alert variant="warning" title="Master data missing">
            {noSubjects && <div>Add subjects in Master Management before inviting teachers.</div>}
            {noGrades && <div>Add grade levels in Master Management before inviting teachers.</div>}
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <MultiSelect
            label="1. Subjects"
            required
            searchable
            options={subjectOptions}
            value={subjects}
            onChange={handleSubjectsChange}
            loading={subjectsLoading}
            maxSelected={10}
            placeholder="Select subject(s)"
            hint="Choose several when the teacher covers more than one."
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
            onChange={choose(setTeacherIds, teacherOptions)}
            onSearchChange={setTeacherSearch}
            filterLocally={false}
            loading={teachers.isLoading}
            disabled={!readyForPeople}
            placeholder={readyForPeople ? 'Search by name or email' : 'Select subject and grade first'}
            searchPlaceholder="Search teachers by name or email…"
            hint="Teachers who list these subjects and this grade on their profile."
          />

          <MultiSelect
            label="4. Students"
            required
            searchable
            showSelectAll
            options={studentOptions}
            value={studentIds}
            onChange={choose(setStudentIds, studentOptions)}
            onSearchChange={setStudentSearch}
            filterLocally={false}
            loading={students.isLoading}
            disabled={!readyForPeople}
            placeholder={readyForPeople ? 'Search by name or email' : 'Select subject and grade first'}
            searchPlaceholder="Search students by name or email…"
            hint="Students in the chosen grade."
          />
        </div>

        {pairCount > 0 && (
          <Alert variant="info">
            {teacherIds.length} teacher{teacherIds.length === 1 ? '' : 's'} × {studentIds.length} student
            {studentIds.length === 1 ? '' : 's'} = <strong>{pairCount}</strong> invitation{pairCount === 1 ? '' : 's'} for{' '}
            {subjects.join(', ')} — {grade}. Nothing is linked until each teacher accepts.
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <SearchableSelect
            label="5. Academic year"
            options={academicYearOptions}
            value={academicYearId}
            onChange={setAcademicYearId}
            loading={academicYearsLoading}
            placeholder="Current academic year"
            searchPlaceholder="Search academic years…"
            emptyMessage="No academic years available"
            hint="Leave empty for the current academic year."
          />
        </div>
      </form>
    </Modal>
  );
}
