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
 *   1. Subject(s)   2. Grade   3. Academic year (required, starts on the current one)
 *   -> 4. The teacher (one - one teacher per subject) who teaches them (search by name/email)
 *   -> 5. Students in that grade who don't already have a teacher - or a
 *         request/invitation open - for any of those subjects that year
 *         (one teacher per subject, 2026-10-19); the form says how many were left out
 *
 * Pairs that already have an open invitation, are already connected, or
 * whose subject got a teacher earlier in the same send, are skipped and
 * reported. Subject/grade/year options come from the page.
 */
const SKIP_WORDS = {
  already_invited: 'already invited',
  already_connected: 'already connected',
  subject_taken: 'subject already has a teacher',
};

/** "3 skipped: 2 subject already has a teacher, 1 already invited." */
function skippedSummary(skipped = []) {
  const counts = {};
  skipped.forEach((s) => {
    const words = SKIP_WORDS[s.reason] ?? 'not possible';
    counts[words] = (counts[words] ?? 0) + 1;
  });
  const parts = Object.entries(counts).map(([words, n]) => `${n} ${words}`);
  return `${skipped.length} skipped: ${parts.join(', ')}.`;
}

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
  // null = the current year (pre-selected); the field is required.
  const [academicYearId, setAcademicYearId] = useState(null);
  const currentYearId = academicYearOptions?.find((o) => o.isCurrent)?.value ?? null;
  const yearId = academicYearId ?? currentYearId;
  const yearOption = academicYearOptions?.find((o) => o.value === yearId);
  const yearLabel = yearOption?.name ?? yearOption?.label ?? null;
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
  const readyForPeople = subjects.length > 0 && Boolean(grade) && Boolean(yearId);

  // Teachers only once subject(s) and grade are chosen - both narrow the list server-side.
  useEffect(() => {
    if (!isOpen || !readyForPeople) return;
    runTeachers({ subjects, grade, search: debouncedTeacherSearch }).catch(() => {});
  }, [isOpen, readyForPeople, subjects, grade, debouncedTeacherSearch, runTeachers]);

  // Students only once subject(s), grade and year are chosen: those already covered for a subject that year are left out.
  useEffect(() => {
    if (!isOpen || !readyForPeople) return;
    runStudents({ grade, subjects, academicYearId: yearId, search: debouncedStudentSearch }).catch(() => {});
  }, [isOpen, readyForPeople, grade, subjects, yearId, debouncedStudentSearch, runStudents]);
  const hiddenStudents = readyForPeople ? Number(students.meta?.hidden ?? 0) : 0;

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
    // Both lists depend on the subjects - earlier picks may no longer apply.
    setTeacherIds([]);
    setStudentIds([]);
    setError(null);
  };

  const handleYearChange = (next) => {
    setAcademicYearId(next);
    setStudentIds([]); // who is still free depends on the year
    setError(null);
  };

  const handleGradeChange = (next) => {
    setGrade(next);
    setTeacherIds([]);
    setStudentIds([]);
    setError(null);
  };

  const pairCount = teacherIds.length * studentIds.length;
  const canSend = Boolean(subjects.length && grade && yearId && teacherIds.length && studentIds.length) && !busy;

  const handleSend = async (event) => {
    event.preventDefault();
    setError(null);
    if (!subjects.length) return setError('Select at least one subject');
    if (!grade) return setError('Select a grade');
    if (!yearId) return setError('Select the academic year');
    if (!teacherIds.length) return setError('Select at least one teacher');
    if (!studentIds.length) return setError('Select at least one student');

    setBusy(true);
    try {
      const { data } = await invitationService.adminInvite({ subjects, grade, teacherIds, studentIds, academicYearId: yearId });
      const skippedText = data.skippedCount ? ` ${skippedSummary(data.skipped)}` : '';
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
      description="Choose the subject(s), grade and academic year, then the teacher and the students. Students who already have a teacher for a subject that year are not listed. The teacher gets an invitation for each student and is connected only when they accept."
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
          <SearchableSelect
            label="3. Academic year"
            required
            options={academicYearOptions}
            value={yearId}
            onChange={handleYearChange}
            loading={academicYearsLoading}
            placeholder="Select academic year"
            searchPlaceholder="Search academic years…"
            emptyMessage="No academic years available"
            hint="The school year these classes are for. Starts on the current year."
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <MultiSelect
            label="4. Teacher"
            required
            searchable
            maxSelected={1}
            options={teacherOptions}
            value={teacherIds}
            onChange={choose(setTeacherIds, teacherOptions)}
            onSearchChange={setTeacherSearch}
            filterLocally={false}
            loading={teachers.isLoading}
            disabled={!readyForPeople}
            placeholder={readyForPeople ? 'Search by name or email' : 'Select subject, grade and year first'}
            searchPlaceholder="Search teachers by name or email…"
            hint="One teacher per subject: teachers who list these subjects and this grade on their profile."
          />

          <MultiSelect
            label="5. Students"
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
            placeholder={readyForPeople ? 'Search by name or email' : 'Select subject, grade and year first'}
            searchPlaceholder="Search students by name or email…"
            emptyMessage="No students left without a teacher for these subjects"
            hint={
              readyForPeople
                ? `Students in ${grade} without a teacher for ${subjects.join(', ')}${yearLabel ? ` in ${yearLabel}` : ''}.${
                    hiddenStudents ? ` ${hiddenStudents} already ${hiddenStudents === 1 ? 'has' : 'have'} one (or an invitation open) and ${hiddenStudents === 1 ? "isn't" : "aren't"} listed.` : ''
                  }`
                : 'Students in the chosen grade who still need a teacher for these subjects.'
            }
          />
        </div>

        {pairCount > 0 && (
          <Alert variant="info">
            <strong>{pairCount}</strong> invitation{pairCount === 1 ? '' : 's'} to {teacherOptions.find((o) => o.value === teacherIds[0])?.label ?? 'the teacher'}{' '}
            for {subjects.join(', ')} — {grade}{yearLabel ? `, ${yearLabel}` : ''}. Each student's parents can follow it on My Children. Nothing is
            linked until the teacher accepts.
          </Alert>
        )}
      </form>
    </Modal>
  );
}
