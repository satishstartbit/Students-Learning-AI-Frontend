import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  PageHeader,
  Card,
  Input,
  Textarea,
  Select,
  DatePicker,
  Button,
  Alert,
  Loader,
  ErrorState,
  Toast,
} from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { toast } from '../../../hooks/useToast';
import { getErrorMessage } from '../../../utils/errorHandler';
import { ASSIGNMENT_CRUD_STATUS } from '../../../utils/constants';
import assignmentService from '../../assignments/services/assignment.service';
import teacherStudentService from '../services/teacherStudent.service';
import StudentPicker from '../../assignments/components/StudentPicker';

const EMPTY_FORM = {
  title: '',
  description: '',
  subject: '',
  grade: '',
  academicYearId: '',
  startDate: '',
  dueDate: '',
  estimatedMinutes: '',
};

/**
 * Handles both create (`/teacher/assignments/new`) and edit
 * (`/teacher/assignments/:id/edit`) by checking the `id` route param.
 *
 * Resource attachments are managed from the assignment's details page
 * instead of here - they only make sense once the assignment exists, and
 * keeping upload/remove in one place (which already needs it for the
 * teacher-review flow) is simpler than duplicating file plumbing on both
 * this form and the details page.
 */
export default function AssignmentFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [studentIds, setStudentIds] = useState([]);
  const [errors, setErrors] = useState({});
  const [savingStatus, setSavingStatus] = useState(null);

  const subjects = useApi(teacherStudentService.listLookupSubjects);
  const grades = useApi(teacherStudentService.listLookupGrades);
  const academicYears = useApi(teacherStudentService.listLookupAcademicYears);
  const detail = useApi(assignmentService.getAssignment);

  const { run: runSubjects } = subjects;
  const { run: runGrades } = grades;
  const { run: runAcademicYears } = academicYears;
  const { run: runDetail } = detail;

  useEffect(() => {
    runSubjects().catch(() => {});
  }, [runSubjects]);

  useEffect(() => {
    runGrades().catch(() => {});
  }, [runGrades]);

  useEffect(() => {
    runAcademicYears().catch(() => {});
  }, [runAcademicYears]);

  const loadDetail = useCallback(() => {
    if (!isEdit) return Promise.resolve();
    return runDetail(id);
  }, [isEdit, runDetail, id]);

  useEffect(() => {
    loadDetail().catch(() => {});
  }, [loadDetail]);

  useEffect(() => {
    if (isEdit && detail.data) {
      const a = detail.data;
      setForm({
        title: a.title ?? '',
        description: a.description ?? '',
        subject: a.subject ?? '',
        grade: a.grade ?? '',
        academicYearId: a.academicYear?.id ?? '',
        startDate: a.startDate ?? '',
        dueDate: a.dueDate ?? '',
        estimatedMinutes: a.estimatedMinutes ?? '',
      });
      setStudentIds((a.recipients ?? []).map((r) => r.student?.id).filter(Boolean));
    }
  }, [isEdit, detail.data]);

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

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const isArchived = isEdit && detail.data?.status === ASSIGNMENT_CRUD_STATUS.ARCHIVED;

  const buildPayload = (status) => ({
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    subject: form.subject || undefined,
    grade: form.grade || undefined,
    academicYearId: form.academicYearId || undefined,
    startDate: form.startDate || undefined,
    dueDate: form.dueDate || undefined,
    estimatedMinutes: form.estimatedMinutes !== '' ? Number(form.estimatedMinutes) : undefined,
    status,
    studentIds,
  });

  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = 'Title is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async (status) => {
    if (!validate()) return;
    if (status === ASSIGNMENT_CRUD_STATUS.PUBLISHED && studentIds.length === 0) {
      toast.error('Add at least one student before publishing');
      return;
    }

    setSavingStatus(status);
    try {
      const payload = buildPayload(status);
      const result = isEdit
        ? await assignmentService.updateAssignment(id, payload)
        : await assignmentService.createAssignment(payload);

      toast.success(
        status === ASSIGNMENT_CRUD_STATUS.PUBLISHED ? 'Assignment published' : 'Assignment saved as draft'
      );

      const savedId = result?.data?.id ?? id;
      navigate(`/teacher/assignments/${savedId}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingStatus(null);
    }
  };

  if (isEdit && detail.isLoading && !detail.data) return <Loader message="Loading assignment…" />;
  if (isEdit && detail.error) return <ErrorState error={detail.error} onRetry={loadDetail} />;

  return (
    <>
      <PageHeader
        title={isEdit ? 'Edit Assignment' : 'New Assignment'}
        description={
          isEdit
            ? 'Update the details or the roster of students assigned.'
            : 'Create an assignment and assign it to your students.'
        }
      />

      {isArchived && (
        <Alert variant="warning" title="This assignment is archived" className="ui-field">
          Archived assignments cannot be edited.
        </Alert>
      )}

      <fieldset disabled={isArchived} style={{ border: 'none', padding: 0, margin: 0 }}>
        <Card title="Details" className="ui-field">
          <Input label="Title" required value={form.title} onChange={setField('title')} error={errors.title} />
          <Textarea label="Description" value={form.description} onChange={setField('description')} rows={4} />

          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="Subject"
              options={subjectOptions}
              value={form.subject}
              onChange={setField('subject')}
              loading={subjects.isLoading}
              placeholder="Select subject"
            />
            <Select
              label="Grade"
              options={gradeOptions}
              value={form.grade}
              onChange={setField('grade')}
              loading={grades.isLoading}
              placeholder="Select grade"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="Academic Year"
              options={academicYearOptions}
              value={form.academicYearId}
              onChange={setField('academicYearId')}
              loading={academicYears.isLoading}
              placeholder="Select academic year"
            />
            <Input
              label="Estimated completion time (minutes)"
              type="number"
              min="0"
              value={form.estimatedMinutes}
              onChange={setField('estimatedMinutes')}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <DatePicker label="Start date" value={form.startDate} onChange={setField('startDate')} />
            <DatePicker label="Due date" value={form.dueDate} onChange={setField('dueDate')} />
          </div>
        </Card>

        <Card
          title="Assign students"
          subtitle="Choose a subject and grade above, then select the students who should receive this assignment."
          className="ui-field"
        >
          <StudentPicker
            subject={form.subject}
            grade={form.grade}
            academicYearId={form.academicYearId}
            value={studentIds}
            onChange={setStudentIds}
          />
        </Card>
      </fieldset>

      <div className="flex flex-wrap items-center justify-end gap-2 ui-field">
        {studentIds.length === 0 && <span className="ui-hint">Add at least one student to publish.</span>}
        <Button variant="secondary" as={Link} to={isEdit ? `/teacher/assignments/${id}` : '/teacher/assignments'}>
          Cancel
        </Button>
        <Button
          variant="secondary"
          onClick={() => handleSave(ASSIGNMENT_CRUD_STATUS.DRAFT)}
          loading={savingStatus === ASSIGNMENT_CRUD_STATUS.DRAFT}
          disabled={isArchived || savingStatus !== null}
        >
          Save as Draft
        </Button>
        <Button
          onClick={() => handleSave(ASSIGNMENT_CRUD_STATUS.PUBLISHED)}
          loading={savingStatus === ASSIGNMENT_CRUD_STATUS.PUBLISHED}
          disabled={isArchived || savingStatus !== null || studentIds.length === 0}
        >
          Publish
        </Button>
      </div>

      <Toast />
    </>
  );
}
