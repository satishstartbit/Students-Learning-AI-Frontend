import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Modal, MultiSelect, Select, Textarea } from '../../../components/common';
import { SearchableSelect } from '../../../components/ui/searchable-select';
import { useApi } from '../../../hooks/useApi';
import { useDebounce } from '../../../hooks/useDebounce';
import { toast } from '../../../hooks/useToast';
import { getErrorMessage } from '../../../utils/errorHandler';
import { formatName } from '../../../utils/format';
import api from '../../../utils/apiClient';
import lookupService from '../../../services/lookup.service';
import invitationService from '../../invitations/services/teacherInvitation.service';
import connectionService from '../services/teacherConnection.service';

/**
 * Create, edit or move a teacher-student connection on a family's behalf.
 *
 *   create  a new connection: teacher, student, subjects, grade, year
 *   edit    everything about an existing connection - including WHICH
 *           teacher. Picking a different teacher hands the connection over
 *           (the old one ends and the new one starts in one step), the same
 *           as "move"; keeping the teacher just changes subjects/grade/year.
 *   move    the year-end shortcut: straight to choosing the new teacher
 *
 * Every option list is live master data (Subjects, Grade Levels, Academic
 * Years) and the people come from the admin user search. Every mode ends in
 * the same required field: why this needed Super Admin, recorded with the
 * change. The child's parents are told about every change - in plain words,
 * without that reason.
 */

const MIN_REASON = 5;

const listAcademicYears = () =>
  api.get('/admin/master/academic-years', { params: { status: 'active', limit: 100, sortBy: 'start_date', sortOrder: 'desc' } });

const TITLES = {
  create: 'Create a connection',
  edit: 'Edit connection',
  move: 'Move to a new teacher or class',
};

const LEADS = {
  create:
    'For when a family needs help connecting - the parent’s invitation is the normal way. The teacher gets access as soon as you save.',
  edit: 'Change the teacher, the subjects they cover for this student, or the grade or year it is for. The family is told about the change.',
  move: 'The year-end case: this connection ends and the new one starts together, so the student is never left without a teacher or with both.',
};

function usePeople(kind, isOpen) {
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 300);
  const api = useApi(kind === 'teacher' ? invitationService.adminTeachers : invitationService.adminStudents);
  const { run } = api;

  useEffect(() => {
    if (!isOpen) return;
    run({ search: debounced }).catch(() => {});
  }, [isOpen, debounced, run]);

  const options = useMemo(
    () => (Array.isArray(api.data) ? api.data : []).map((p) => ({ value: p.id, label: formatName(p), description: p.email })),
    [api.data]
  );
  return { options, isLoading: api.isLoading, setSearch };
}

export function ConnectionModal({ mode, connection = null, isOpen, onClose, onSaved }) {
  const subjectsApi = useApi(lookupService.listLookup, { immediate: isOpen, args: ['subjects'] });
  const gradesApi = useApi(lookupService.listLookup, { immediate: isOpen, args: ['grade_levels'] });
  const yearsApi = useApi(listAcademicYears, { immediate: isOpen });
  // Edit can switch teachers too, so it searches the same list as move.
  const teachers = usePeople('teacher', isOpen);
  const students = usePeople('student', isOpen && mode === 'create');

  // Edit starts on the current teacher; create and move start empty.
  const [teacherId, setTeacherId] = useState(mode === 'edit' ? connection?.teacher?.id ?? null : null);
  const [studentId, setStudentId] = useState(null);
  const [subjects, setSubjects] = useState(connection?.subjects ?? []);
  const [grade, setGrade] = useState(connection?.grade ?? '');
  const [academicYearId, setAcademicYearId] = useState(connection?.academicYear?.id ?? '');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const current = connection?.teacher
    ? { value: connection.teacher.id, label: connection.teacher.name, description: connection.teacher.email }
    : null;
  const teacherOptions =
    mode === 'move'
      ? teachers.options.filter((o) => o.value !== current?.value)
      : mode === 'edit' && current && !teachers.options.some((o) => o.value === current.value)
        ? [current, ...teachers.options]
        : teachers.options;

  const subjectOptions = (subjectsApi.data ?? []).map((s) => ({ value: s.name, label: s.name }));
  const gradeOptions = (gradesApi.data ?? []).map((g) => ({ value: g.name, label: g.name }));
  const yearOptions = (yearsApi.data ?? []).map((y) => ({
    value: y.id,
    label: y.isCurrent || y.is_current ? `${y.name} (current)` : y.name,
  }));

  const missing = [
    mode === 'create' && !teacherId && 'a teacher',
    mode === 'create' && !studentId && 'a student',
    mode === 'move' && !teacherId && 'the new teacher',
    mode === 'edit' && !teacherId && 'a teacher',
    subjects.length === 0 && 'at least one subject',
    reason.trim().length < MIN_REASON && 'why this needs Super Admin',
  ].filter(Boolean);

  const submit = async () => {
    if (missing.length || busy) return;
    setBusy(true);
    setError(null);
    try {
      const why = reason.trim();
      if (mode === 'create') {
        await connectionService.createConnection({
          teacherId,
          studentId,
          subjects,
          grade: grade || null,
          academicYearId: academicYearId || null,
          reason: why,
        });
        toast.success('Connection created - the family has been told');
      } else if (mode === 'edit' && teacherId !== connection.teacher.id) {
        // A different teacher is a hand-over, not an edit of the same row:
        // the backend ends the old connection and starts the new one in one
        // transaction, merged with anything the new teacher already covers.
        await connectionService.moveConnection({
          studentId: connection.student.id,
          fromTeacherId: connection.teacher.id,
          toTeacherId: teacherId,
          academicYearId: connection.academicYear?.id ?? null,
          subjects,
          grade: grade || null,
          newAcademicYearId: academicYearId || null,
          reason: why,
        });
        toast.success('Connection handed to the new teacher - the family has been told');
      } else if (mode === 'edit') {
        await connectionService.updateConnection({
          teacherId: connection.teacher.id,
          studentId: connection.student.id,
          academicYearId: connection.academicYear?.id ?? null,
          subjects,
          grade: grade || null,
          newAcademicYearId: academicYearId || null,
          reason: why,
        });
        toast.success('Connection updated - the family has been told');
      } else {
        await connectionService.moveConnection({
          studentId: connection.student.id,
          fromTeacherId: connection.teacher.id,
          toTeacherId: teacherId,
          academicYearId: connection.academicYear?.id ?? null,
          subjects,
          grade: grade || null,
          newAcademicYearId: academicYearId || null,
          reason: why,
        });
        toast.success('Connection moved - the family has been told');
      }
      onSaved?.();
      onClose?.();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={TITLES[mode]}
      description={LEADS[mode]}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} loading={busy} disabled={missing.length > 0}>
            {mode === 'create'
              ? 'Create connection'
              : mode === 'edit'
                ? teacherId && teacherId !== connection?.teacher?.id
                  ? 'Save & change teacher'
                  : 'Save changes'
                : 'Move connection'}
          </Button>
        </>
      }
    >
      {error && (
        <Alert variant="error" className="ui-field">
          {error}
        </Alert>
      )}

      {connection && (
        <Alert variant="info" className="ui-field">
          {connection.teacher?.name} &rarr; {connection.student?.name}
          {connection.academicYear ? ` · ${connection.academicYear.name}` : ''} · {connection.subjects.join(', ')}
        </Alert>
      )}

      {mode === 'create' && (
        <SearchableSelect
          label="Student"
          required
          options={students.options}
          loading={students.isLoading}
          value={studentId}
          onChange={setStudentId}
          onSearchChange={students.setSearch}
          placeholder="Search students by name or email"
        />
      )}

      <SearchableSelect
        label={mode === 'move' ? 'New teacher' : 'Teacher'}
        required
        options={teacherOptions}
        loading={teachers.isLoading}
        value={teacherId}
        onChange={setTeacherId}
        onSearchChange={teachers.setSearch}
        placeholder="Search teachers by name or email"
        hint={
          mode === 'edit'
            ? teacherId && teacherId !== connection?.teacher?.id
              ? `${connection?.teacher?.name} will no longer teach ${connection?.student?.name} these subjects - the new teacher takes over.`
              : 'Pick a different teacher to hand this connection over.'
            : undefined
        }
      />

      <MultiSelect
        label="Subjects"
        required
        options={subjectOptions}
        value={subjects}
        onChange={setSubjects}
        loading={subjectsApi.isLoading}
        placeholder="Choose one or more subjects"
        hint="One teacher can cover several subjects for the same student."
      />

      <div className="ui-grid-2" style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <Select
          label="Grade"
          options={gradeOptions}
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          placeholder="Student's own grade"
        />
        <Select
          label={mode === 'create' ? 'Academic year' : 'Academic year after this change'}
          options={yearOptions}
          value={academicYearId}
          onChange={(e) => setAcademicYearId(e.target.value)}
          placeholder="Current year"
        />
      </div>

      <Textarea
        label="Why does this need Super Admin?"
        required
        rows={3}
        maxLength={500}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="e.g. Moving to Grade 5 with Mr Patel for the new school year"
        hint="Kept in the change log for Super Admin only. The family is told what changed, not this reason."
      />

      {missing.length > 0 && (
        <p className="ui-hint" role="status">
          Still needed: {missing.join(', ')}.
        </p>
      )}
    </Modal>
  );
}

export default ConnectionModal;
