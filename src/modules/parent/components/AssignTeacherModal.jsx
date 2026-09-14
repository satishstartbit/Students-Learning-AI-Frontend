import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Checkbox, Modal, MultiSelect } from '../../../components/common';
import { SearchableSelect } from '../../../components/ui/searchable-select';
import { useApi } from '../../../hooks/useApi';
import { useDebounce } from '../../../hooks/useDebounce';
import { toast } from '../../../hooks/useToast';
import { getErrorMessage } from '../../../utils/errorHandler';
import { formatName } from '../../../utils/format';
import parentService from '../services/parent.service';

/**
 * Assigns one or more teachers to one child, for a subject/grade/academic
 * year - mirrors the Super Admin bulk-assign form
 * (superAdmin/pages/RelationshipsPage.jsx), scoped to a single child.
 *
 * Grade is not asked from scratch: it defaults to - and displays - the
 * child's profile grade, and only becomes an editable dropdown when the
 * parent explicitly opts into an off-grade (advanced / remedial) placement,
 * which is then flagged wherever the assignment is shown.
 *
 * Passing `replacing` (one row from the child's Subjects & Teachers table)
 * turns this into the "Change teacher" flow: subject/grade/academic year are
 * pre-filled and locked, and the old assignment is removed once the new one
 * is created, so the row is swapped rather than duplicated.
 *
 * The caller must remount this component per use (e.g. `key={rowId-isOpen}`)
 * rather than toggling `isOpen` on a long-lived instance - the fields are
 * seeded once at mount, not synced from props afterwards.
 */
export default function AssignTeacherModal({ isOpen, child, replacing = null, onClose, onAssigned }) {
  const childGrade = child?.profile?.grade ?? null;

  const [subject, setSubject] = useState(replacing?.subject ?? null);
  const [grade, setGrade] = useState(replacing?.grade ?? childGrade ?? null);
  // On by default only when there's no profile grade to default to.
  const [gradeOverride, setGradeOverride] = useState(!replacing && !childGrade);
  const [academicYearId, setAcademicYearId] = useState(replacing?.academicYearId ?? null);
  const [teacherIds, setTeacherIds] = useState([]);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const subjects = useApi((p) => parentService.listMasterOptions('subjects', p));
  const grades = useApi((p) => parentService.listMasterOptions('grade_levels', p));
  const academicYears = useApi(parentService.listAcademicYears);
  const teachers = useApi(parentService.listTeachers);

  const debouncedSearch = useDebounce(teacherSearch, 350);
  const locked = Boolean(replacing);
  const offGrade = Boolean(grade && childGrade && grade !== childGrade);

  useEffect(() => {
    if (!isOpen) return;
    subjects.run().catch(() => {});
    grades.run().catch(() => {});
    academicYears.run().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !subject || !grade) return;
    teachers.run({ subject, grade, search: debouncedSearch, limit: 50 }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, subject, grade, debouncedSearch]);

  // Teachers this child already has for the exact subject+grade+year picked -
  // offering them again would just be a silent no-op on the server.
  const alreadyAssignedIds = useMemo(() => {
    if (!subject || !grade || !academicYearId) return new Set();
    return new Set(
      (child?.relationships ?? [])
        .filter(
          (r) =>
            r.relationshipType === 'teacher_student' &&
            r.subject === subject &&
            r.grade === grade &&
            r.academicYearId === academicYearId
        )
        .map((r) => r.owner?.id)
        .filter(Boolean)
    );
  }, [child, subject, grade, academicYearId]);

  const teacherOptions = (teachers.data ?? []).map((t) => ({
    value: t.id,
    label: formatName(t),
    description: alreadyAssignedIds.has(t.id) ? `${t.email} · already assigned` : t.email,
    disabled: alreadyAssignedIds.has(t.id),
  }));

  const reset = () => {
    setSubject(null);
    setGrade(null);
    setAcademicYearId(null);
    setTeacherIds([]);
    setTeacherSearch('');
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const toggleGradeOverride = (checked) => {
    setGradeOverride(checked);
    if (!checked) setGrade(childGrade ?? null);
  };

  const handleSubmit = async () => {
    if (!subject || !grade || !academicYearId || !teacherIds.length) {
      setError('Choose a subject, grade, academic year and at least one teacher');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const { data } = await parentService.assignTeachers(child.id, {
        teacherIds,
        subject,
        grade,
        academicYearId,
        status: 'active',
      });

      if (replacing) {
        await parentService.removeTeacherAssignment(child.id, replacing.id);
      }

      const skipped = data?.skippedCount ?? 0;
      toast.success(
        replacing
          ? 'Teacher changed'
          : skipped > 0
            ? `${data.createdCount} teacher(s) assigned - ${skipped} already existed`
            : 'Teacher(s) assigned'
      );
      handleClose();
      onAssigned?.();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        replacing
          ? `Change teacher - ${replacing.subject} (${replacing.grade})`
          : child
            ? `Assign a teacher to ${child.firstName}`
            : 'Assign a teacher'
      }
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={submitting}>
            {replacing ? 'Change teacher' : 'Assign'}
          </Button>
        </>
      }
    >
      {error && (
        <Alert variant="error" className="ui-field">
          {error}
        </Alert>
      )}

      {replacing && (
        <Alert variant="info" className="ui-field">
          Currently {formatName(replacing.owner)}. Pick a replacement below - the current
          assignment is removed once the new one is created.
        </Alert>
      )}

      <SearchableSelect
        label="Subject"
        required
        disabled={locked}
        placeholder="Select a subject"
        options={subjects.data ?? []}
        loading={subjects.isLoading}
        getOptionValue={(o) => o.name}
        getOptionLabel={(o) => o.name}
        value={subject}
        onChange={setSubject}
      />


      <SearchableSelect
        label="Academic year"
        required
        disabled={locked}
        placeholder="Select an academic year"
        options={academicYears.data ?? []}
        loading={academicYears.isLoading}
        value={academicYearId}
        onChange={setAcademicYearId}
      />

      <MultiSelect
        name="teacherIds"
        label="Teacher(s)"
        required
        searchable
        showSelectAll
        placeholder={subject && grade ? 'Select teacher(s)' : 'Choose a subject and grade first'}
        options={teacherOptions}
        value={teacherIds}
        onChange={setTeacherIds}
        loading={teachers.isLoading}
        disabled={!subject || !grade}
        onSearchChange={setTeacherSearch}
        filterLocally={false}
        hint={
          alreadyAssignedIds.size > 0
            ? 'Teachers already assigned for this subject, grade and year are greyed out.'
            : 'You can assign more than one teacher for this subject and grade.'
        }
      />
    </Modal>
  );
}
