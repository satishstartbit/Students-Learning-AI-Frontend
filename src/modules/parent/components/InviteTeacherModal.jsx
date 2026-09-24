import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Input, Modal, MultiSelect } from '../../../components/common';
import { SearchableSelect } from '../../../components/ui/searchable-select';
import { useApi } from '../../../hooks/useApi';
import { useDebounce } from '../../../hooks/useDebounce';
import { toast } from '../../../hooks/useToast';
import { getErrorMessage } from '../../../utils/errorHandler';
import { formatName } from '../../../utils/format';
import invitationService from '../../invitations/services/teacherInvitation.service';
import parentService from '../services/parent.service';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Ask for a teacher to be connected with one child. What the parent sends is
 * a REQUEST: Growing Focus reviews it, and only on approval is the
 * client-written invitation emailed to the teacher - who then accepts or
 * declines. Nothing is linked until the teacher accepts.
 *
 *   1. Subject(s)  a teacher may cover several - e.g. Math and Science
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

  const [subjectOptions, setSubjectOptions] = useState([]);
  const [gradeOptions, setGradeOptions] = useState([]);
  const [lookupsLoading, setLookupsLoading] = useState(true);
  const directory = useApi(invitationService.teacherDirectory);
  const { run: runDirectory } = directory;
  const [teacherSearch, setTeacherSearch] = useState('');
  const debouncedSearch = useDebounce(teacherSearch, 300);

  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    let live = true;
    Promise.all([parentService.masterOptionsFetcher('subjects'), parentService.masterOptionsFetcher('grade_levels')])
      .then(([subjectList, gradeList]) => {
        if (!live) return;
        setSubjectOptions(subjectList);
        setGradeOptions(gradeList);
      })
      .catch(() => live && setError('Could not load the subject and grade lists. Close this and try again.'))
      .finally(() => live && setLookupsLoading(false));
    return () => {
      live = false;
    };
  }, [isOpen]);

  // The teacher list follows the chosen subjects + grade, and the search box.
  const readyForTeachers = subjects.length > 0 && Boolean(grade);
  useEffect(() => {
    if (!isOpen || !readyForTeachers || byEmail) return;
    runDirectory({ subjects, grade, search: debouncedSearch }).catch(() => {});
  }, [isOpen, readyForTeachers, byEmail, subjects, grade, debouncedSearch, runDirectory]);

  const teachers = useMemo(
    () => (readyForTeachers && Array.isArray(directory.data) ? directory.data : []),
    [readyForTeachers, directory.data]
  );
  const teachersLoading = directory.isLoading;

  const teacherOptions = useMemo(
    () => teachers.map((t) => ({ value: t.id, label: formatName(t), description: t.email })),
    [teachers]
  );

  const errors = {
    subjects: subjects.length ? null : 'Choose at least one subject',
    grade: grade ? null : 'Choose a grade',
    teacherId: byEmail || teacherId ? null : 'Choose a teacher',
    teacherName: !byEmail || teacherName.trim() ? null : "Enter the teacher's name",
    teacherEmail: !byEmail
      ? null
      : !teacherEmail.trim()
        ? "Enter the teacher's email address"
        : EMAIL_PATTERN.test(teacherEmail.trim())
          ? null
          : 'Enter a valid email address',
  };
  const invalid = Object.values(errors).some(Boolean);
  const pickOptions = picked && !teacherOptions.some((o) => o.value === picked.value) ? [picked, ...teacherOptions] : teacherOptions;
  const pickTeacher = (id) => {
    setTeacherId(id);
    setPicked(pickOptions.find((o) => o.value === id) ?? null);
  };

  const changeSubjects = (next) => {
    setSubjects(next);
    setTeacherId(null); // the list is narrowed by subject - an earlier pick may no longer apply
    setPicked(null);
  };
  const changeGrade = (next) => {
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
        ? { teacherName: teacherName.trim(), teacherEmail: teacherEmail.trim(), subjects, grade }
        : { teacherId, subjects, grade };
      const { data } = await invitationService.invite(child.id, payload);
      const to = byEmail ? teacherEmail.trim() : picked?.label ?? 'the teacher';
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invite a teacher"
      description={`Choose the subject and grade, then the teacher. We review every request, then email the teacher an invitation to connect with ${
        child ? formatName(child) : 'your child'
      } - nothing is shared until they accept.`}
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
      <form id="invite-teacher-form" onSubmit={handleSubmit} noValidate>
        {error && (
          <Alert variant="error" className="ui-field">
            {error}
          </Alert>
        )}

        <MultiSelect
          name="subjects"
          label="1. Subjects they teach your child"
          hint={lookupsLoading ? 'Loading…' : 'Choose every subject this teacher covers.'}
          options={subjectOptions}
          value={subjects}
          onChange={changeSubjects}
          searchable
          loading={lookupsLoading}
          disabled={lookupsLoading}
          maxSelected={10}
          required
          error={attempted ? errors.subjects : undefined}
        />

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
            hint={childGrade ? `${formatName(child)} is in ${childGrade}` : undefined}
            error={attempted ? errors.grade : undefined}
          />
        </div>

        {!byEmail ? (
          <div className="ui-field" data-testid="teacher-picker">
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
              emptyMessage="No teacher on the platform teaches that - try another search, or invite by email below"
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
            <Input
              label="Teacher's email"
              name="teacherEmail"
              type="email"
              required
              placeholder="name@school.ca"
              hint="They'll be asked to create an account when they accept. Double-check the address."
              value={teacherEmail}
              maxLength={255}
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
