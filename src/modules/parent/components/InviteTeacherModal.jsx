import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, EmailInput, Input, Modal, MultiSelect } from '../../../components/common';
import { SearchableSelect } from '../../../components/ui/searchable-select';
import { useApi } from '../../../hooks/useApi';
import { useDebounce } from '../../../hooks/useDebounce';
import { toast } from '../../../hooks/useToast';
import { getErrorMessage } from '../../../utils/errorHandler';
import { formatName } from '../../../utils/format';
import { emailError, normalizeEmail } from '../../../utils/email';
import { subjectChoices } from '../../invitations/invitationProgress';
import invitationService from '../../invitations/services/teacherInvitation.service';

const MAX_SUBJECTS = 10;

/** "Math", "Math or Science", "Math, English or Science" - for the teacher hint. */
const orList = (items) =>
  items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} or ${items[items.length - 1]}`;

/**
 * Ask for a teacher to be connected with one child. What the parent sends is
 * a REQUEST: Growing Focus reviews it, and only on approval is the
 * client-written invitation emailed to the teacher - who then accepts or
 * declines. Nothing is linked until the teacher accepts.
 *
 *   1. Subject(s)  a teacher may cover several - e.g. Math and Science. Only
 *                  the child's profile subjects that can still get a teacher
 *                  this year (one teacher per subject, 2026-10-19): one with a
 *                  teacher, or a request/invitation open, is listed as "Not
 *                  offered" with the reason instead
 *   2. Grade       defaults to the child's own grade
 *   3. Teacher     the teachers on the platform who teach those subjects at
 *                  that grade, searchable by name or email - or, for a
 *                  teacher who isn't on the platform yet, their name + email
 *
 * Remount per use (`key`), so the fields start empty each time.
 */
export default function InviteTeacherModal({ isOpen, child, onClose, onInvited }) {
  const [subjects, setSubjects] = useState([]);
  // The details modal passes a full child (grade under `profile`), the My
  // Children cards pass a list item (grade at the top level) - both default
  // the picker to the child's own grade.
  const childGrade = child?.profile?.grade ?? child?.grade ?? null;
  const [grade, setGrade] = useState(childGrade);
  const [teacherId, setTeacherId] = useState(null);
  // The picked teacher's option, kept so their name still shows if a later search hides them.
  const [picked, setPicked] = useState(null);
  const [byEmail, setByEmail] = useState(false);
  const [teacherName, setTeacherName] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');

  // The child's profile subjects, each with whether a teacher can still be asked for it this year.
  const availability = useApi(invitationService.teacherSubjects, { immediate: isOpen && Boolean(child?.id), args: [child?.id] });
  const profileOptions = { error: availability.error };
  const choice = useMemo(() => subjectChoices(availability.data), [availability.data]);
  const subjectOptions = choice.options;
  const profileSubjectCount = availability.data?.subjects?.length ?? 0;
  const yearName = availability.data?.academicYear?.name ?? null;
  const gradeOptions = childGrade ? [{ value: childGrade, label: childGrade }] : [];
  const lookupsLoading = availability.isLoading && !availability.data;
  const directory = useApi(invitationService.teacherDirectory);
  const { run: runDirectory } = directory;
  const [teacherSearch, setTeacherSearch] = useState('');
  const debouncedSearch = useDebounce(teacherSearch, 300);

  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // The teacher list follows the chosen subjects + grade, and the search box.
  const readyForTeachers = !lookupsLoading && !profileOptions.error && subjects.length > 0 && subjects.every((value) => subjectOptions.some((option) => option.value === value)) && Boolean(grade);
  useEffect(() => {
    if (!isOpen || !readyForTeachers || byEmail) return;
    runDirectory({ studentId: child.id, subjects, grade, search: debouncedSearch }).catch(() => {});
  }, [isOpen, readyForTeachers, byEmail, subjects, grade, debouncedSearch, runDirectory, child?.id]);

  const teachers = useMemo(
    () => (readyForTeachers && !directory.isLoading && !directory.error && Array.isArray(directory.data) ? directory.data : []),
    [readyForTeachers, directory.data, directory.isLoading, directory.error]
  );
  const teachersLoading = directory.isLoading;

  const teacherOptions = useMemo(
    () => teachers.map((t) => ({ value: t.id, label: formatName(t), description: t.email })),
    [teachers]
  );

  const errors = {
    subjects: readyForTeachers ? null : 'Choose subjects saved in the student profile',
    grade: grade ? null : 'Choose a grade',
    teacherId: byEmail || teacherId ? null : 'Choose a teacher',
    teacherName: !byEmail || teacherName.trim() ? null : "Enter the teacher's name",
    // The shared email rules (utils/email.js), the same ones the API applies.
    teacherEmail: byEmail ? emailError(teacherEmail) : null,
  };
  const invalid = Object.values(errors).some(Boolean);
  const pickOptions = picked && !teacherOptions.some((o) => o.value === picked.value) ? [picked, ...teacherOptions] : teacherOptions;
  const pickTeacher = (id) => {
    setTeacherId(id);
    setPicked(pickOptions.find((o) => o.value === id) ?? null);
  };

  const changeSubjects = (next) => {
    directory.reset();
    setSubjects(next);
    setTeacherId(null); // the list is narrowed by subject - an earlier pick may no longer apply
    setPicked(null);
  };
  const changeGrade = (next) => {
    directory.reset();
    setGrade(next);
    setTeacherId(null);
    setPicked(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setAttempted(true);
    if (invalid || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const payload = byEmail
        ? { teacherName: teacherName.trim(), teacherEmail: normalizeEmail(teacherEmail), subjects, grade }
        : { teacherId, subjects, grade };
      const { data } = await invitationService.invite(child.id, payload);
      const to = byEmail ? normalizeEmail(teacherEmail) : picked?.label ?? 'the teacher';
      if (data?.awaitingApproval) {
        toast.success(`Request sent - we'll review it and email the invitation to ${to}`);
      } else if (data?.emailSent === false) {
        toast.warning('Invitation saved, but the email could not be sent. Use "Re-send" to try again.');
      } else {
        toast.success(`Invitation sent to ${to}`);
      }
      onInvited?.();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const first = child?.firstName || formatName(child) || 'your child';
  const whose = child?.firstName ? `${child.firstName}'s` : "your child's";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Invite a teacher for ${first}`}
      description={`Pick the subjects they teach ${first}, then the teacher. We check the request, then they get an invitation to connect. Nothing is shared until they accept.`}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="invite-teacher-form" loading={submitting}>
            Send request
          </Button>
        </>
      }
    >
      <form id="invite-teacher-form" className="pc-inviteform" onSubmit={handleSubmit} noValidate>
        {error && (
          <Alert variant="error" className="ui-field">
            {error}
          </Alert>
        )}

        {profileOptions.error && <Alert variant="error">Could not load this student's profile selections. Close this dialog and try again.</Alert>}
        {!lookupsLoading && !profileOptions.error && !profileSubjectCount && <Alert variant="info">Select Subjects in this child's profile first: My Children → Edit → Subjects.</Alert>}
        {!lookupsLoading && !profileOptions.error && profileSubjectCount > 0 && !subjectOptions.length && (
          <Alert variant="info" title="Every subject is covered">
            Each subject in {whose} profile already has a teacher, or a request waiting{yearName ? ` for ${yearName}` : ''}. Add a subject to the
            profile to ask for another teacher.
          </Alert>
        )}
        <MultiSelect
          name="subjects"
          required
          searchable
          placeholder="Select subjects"
          maxSelected={MAX_SUBJECTS}
          disabled={lookupsLoading || Boolean(profileOptions.error) || !subjectOptions.length}
          hint={`Subjects in ${whose} profile that don't have a teacher yet${yearName ? ` (${yearName})` : ''}. One teacher per subject.`}
          label={`1. Subjects they teach ${first}`}
          options={subjectOptions}
          value={subjects}
          onChange={changeSubjects}
          loading={lookupsLoading}
          error={attempted ? errors.subjects : undefined}
        />
        {choice.taken.length > 0 && (
          <p className="ui-hint pc-taken" data-testid="subjects-not-offered">
            Not offered: {choice.taken.map((t) => `${t.name} (${t.why})`).join(', ')}.
          </p>
        )}

        <div className="ui-field">
          <SearchableSelect
            label="2. Grade"
            required
            disabled={true}
            options={gradeOptions}
            value={grade}
            onChange={changeGrade}
            loading={lookupsLoading}
            placeholder="Select grade"
            searchPlaceholder="Search grades…"
            hint={childGrade ? `Set from ${whose} profile.` : undefined}
            error={attempted ? errors.grade : undefined}
          />
        </div>

        {!byEmail ? (
          <div className="ui-field" data-testid="teacher-picker">
            {directory.error && <Alert variant="error">Could not load teachers. Change the search to try again.</Alert>}
            <SearchableSelect
              label="3. Teacher"
              required
              options={pickOptions}
              value={teacherId}
              onChange={pickTeacher}
              onSearchChange={setTeacherSearch}
              filterLocally={false}
              loading={teachersLoading}
              disabled={!readyForTeachers}
              disabledMessage="Choose the subject and grade first"
              placeholder={readyForTeachers ? 'Search by name or email' : 'Choose the subject and grade first'}
              searchPlaceholder="Search teachers by name or email…"
              emptyMessage="No matching teacher found. Try another search or subject."
              hint={readyForTeachers ? `Showing ${grade} teachers who teach ${orList(subjects)}.` : undefined}
              error={attempted ? errors.teacherId : undefined}
            />
            {/* <Button type="button" variant="ghost" size="sm" style={{ marginTop: 'var(--spacing-xs)' }} onClick={() => setByEmail(true)}>
              Teacher not listed? Invite them by email
            </Button> */}
          </div>
        ) : (
          <div data-testid="teacher-by-email">
            <Input
              label="3. Teacher's name"
              name="teacherName"
              required
              placeholder="e.g. Ms. Jane Rivera"
              value={teacherName}
              maxLength={150}
              onChange={(e) => setTeacherName(e.target.value)}
              error={attempted ? errors.teacherName : undefined}
            />
            <EmailInput
              label="Teacher's email"
              name="teacherEmail"
              autoComplete="off"
              required
              placeholder="name@school.ca"
              hint="They'll be asked to create an account when they accept. Double-check the address."
              value={teacherEmail}
              onChange={(e) => setTeacherEmail(e.target.value)}
              error={attempted ? errors.teacherEmail : undefined}
            />
            <Button type="button" variant="ghost" size="sm" onClick={() => setByEmail(false)}>
              Pick a teacher from the list instead
            </Button>
          </div>
        )}
      </form>
    </Modal>
  );
}
