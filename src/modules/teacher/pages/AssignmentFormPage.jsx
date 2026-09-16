import { useEffect, useMemo, useState } from 'react';
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
import { ASSIGNMENT_CRUD_STATUS, ASSIGNMENT_RECIPIENT_STATUS } from '../../../utils/constants';
import assignmentService from '../../assignments/services/assignment.service';
import curriculumService from '../../assignments/services/curriculum.service';
import teacherStudentService from '../services/teacherStudent.service';
import StudentPicker from '../../assignments/components/StudentPicker';
import QuestionBuilder from '../../assignments/components/QuestionBuilder';
import BackgroundAudioField from '../../assignments/components/BackgroundAudioField';
import { questionFromApi, questionToPayload, validateQuestions } from '../../assignments/components/questionDrafts';

/** Form state from a saved assignment (edit) or blank (create). */
function initialForm(a) {
  return {
    title: a?.title ?? '',
    description: a?.description ?? '',
    grade: a?.grade ?? '',
    subjectId: a?.curriculumSubject?.id ?? '',
    // A task saved before curriculum subjects existed has only the subject name.
    legacySubject: a && !a.curriculumSubject ? (a.subject ?? '') : '',
    topicId: a?.topic?.id ?? '',
    taskTypeId: a?.taskType?.id ?? '',
    academicYearId: a?.academicYear?.id ?? '',
    startDate: a?.startDate ?? '',
    dueDate: a?.dueDate ?? '',
    estimatedMinutes: a?.estimatedMinutes ?? '',
  };
}

function initialAudio(a) {
  const audio = a?.backgroundAudio;
  if (audio?.type === 'library') return { type: 'library', trackId: audio.trackId };
  if (audio?.type === 'upload') return { type: 'upload', fileId: audio.fileId, name: audio.name, url: audio.url };
  return { type: 'none' };
}

/** Options for a curriculum select, keeping the task's saved pick visible even if it's no longer offered. */
function withSaved(options, saved) {
  const list = options.map((o) => ({ value: o.id, label: o.name, title: o.description ?? undefined }));
  if (saved && !list.some((o) => o.value === saved.id)) list.push({ value: saved.id, label: `${saved.name} (no longer offered)` });
  return list;
}

function AssignmentEditor({ initial }) {
  const isEdit = Boolean(initial);
  const id = initial?.id;
  const navigate = useNavigate();

  const [form, setForm] = useState(() => initialForm(initial));
  const [studentIds, setStudentIds] = useState(() => (initial?.recipients ?? []).map((r) => r.student?.id).filter(Boolean));
  const [questions, setQuestions] = useState(() => (initial?.questions ?? []).map(questionFromApi));
  const [audio, setAudio] = useState(() => initialAudio(initial));
  const [errors, setErrors] = useState({});
  const [questionErrors, setQuestionErrors] = useState({});
  const [savingStatus, setSavingStatus] = useState(null);

  const grades = useApi(teacherStudentService.listLookupGrades, { immediate: true });
  const academicYears = useApi(teacherStudentService.listLookupAcademicYears, { immediate: true });
  const audioTracks = useApi(curriculumService.listAudioTracks, { immediate: true });
  const taskTypes = useApi(curriculumService.listTaskTypes);
  const subjects = useApi(curriculumService.listSubjects);
  const topics = useApi(curriculumService.listTopics);

  const { run: runTaskTypes } = taskTypes;
  const { run: runSubjects } = subjects;
  const { run: runTopics } = topics;

  // Task types and subjects are narrowed to the chosen grade; topics to subject + grade.
  useEffect(() => {
    runTaskTypes(form.grade).catch(() => {});
    runSubjects(form.grade).catch(() => {});
  }, [form.grade, runTaskTypes, runSubjects]);

  useEffect(() => {
    if (form.subjectId) runTopics(form.subjectId, form.grade).catch(() => {});
  }, [form.subjectId, form.grade, runTopics]);

  const gradeOptions = useMemo(() => (grades.data ?? []).map((g) => ({ value: g.name, label: g.name })), [grades.data]);
  const academicYearOptions = useMemo(() => (academicYears.data ?? []).map((y) => ({ value: y.id, label: y.name })), [academicYears.data]);
  const subjectOptions = withSaved(subjects.data ?? [], initial?.curriculumSubject);
  const topicOptions = form.subjectId
    ? withSaved(topics.data ?? [], initial?.curriculumSubject?.id === form.subjectId ? initial?.topic : null)
    : [];
  const taskTypeOptions = withSaved(taskTypes.data ?? [], initial?.taskType);

  const selectedTaskType = (taskTypes.data ?? []).find((t) => t.id === form.taskTypeId) ?? (initial?.taskType?.id === form.taskTypeId ? initial.taskType : null);
  const subjectName = subjectOptions.find((o) => o.value === form.subjectId)?.label.replace(/ \(no longer offered\)$/, '') || form.legacySubject;

  const isArchived = isEdit && initial.status === ASSIGNMENT_CRUD_STATUS.ARCHIVED;
  // Questions are fixed once any student has started - their answers point at them.
  const questionsLocked = isEdit && (initial.recipients ?? []).some((r) => r.status !== ASSIGNMENT_RECIPIENT_STATUS.ASSIGNED);

  const setField = (key) => (e) => {
    const value = e.target.value;
    setForm((f) => {
      const next = { ...f, [key]: value };
      // A new grade can change which subjects/topics/types apply; a new subject changes its topics.
      if (key === 'grade') Object.assign(next, { subjectId: '', topicId: '', taskTypeId: '', legacySubject: '' });
      if (key === 'subjectId') Object.assign(next, { topicId: '', legacySubject: '' });
      return next;
    });
    if (key === 'subjectId' || key === 'grade') setStudentIds((ids) => (ids.length ? [] : ids));
  };

  const backgroundAudioPayload = () => {
    if (audio.type === 'library') return { type: 'library', trackId: audio.trackId };
    if (audio.type === 'upload') return { type: 'upload', fileId: audio.fileId };
    return { type: 'none' };
  };

  const buildPayload = (status) => ({
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    grade: form.grade || undefined,
    subjectId: form.subjectId || null,
    subject: subjectName || undefined,
    topicId: form.topicId || null,
    taskTypeId: form.taskTypeId || null,
    academicYearId: form.academicYearId || undefined,
    startDate: form.startDate || undefined,
    dueDate: form.dueDate || undefined,
    estimatedMinutes: form.estimatedMinutes !== '' ? Number(form.estimatedMinutes) : undefined,
    questions: questions.map(questionToPayload),
    backgroundAudio: backgroundAudioPayload(),
    ...(isEdit ? {} : { status }),
    studentIds,
  });

  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = 'Title is required';
    if (audio.type === 'library' && !audio.trackId) next.audio = 'Choose a sound, or pick "No sound"';
    if (audio.type === 'upload' && !audio.fileId) next.audio = 'Upload an audio file, or pick "No sound"';
    const qErrors = questionsLocked ? {} : validateQuestions(questions);
    setErrors(next);
    setQuestionErrors(qErrors);
    if (Object.keys(qErrors).length) toast.error('Some questions need finishing - see the highlighted fields');
    return Object.keys(next).length === 0 && Object.keys(qErrors).length === 0;
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
      let savedId = id;
      if (isEdit) {
        await assignmentService.updateAssignment(id, payload);
        if (status === ASSIGNMENT_CRUD_STATUS.PUBLISHED && initial.status === ASSIGNMENT_CRUD_STATUS.DRAFT) {
          await assignmentService.publishAssignment(id);
        }
      } else {
        const result = await assignmentService.createAssignment(payload);
        savedId = result?.data?.id;
      }

      toast.success(status === ASSIGNMENT_CRUD_STATUS.PUBLISHED ? 'Assignment published' : 'Assignment saved');
      navigate(`/teacher/assignments/${savedId}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingStatus(null);
    }
  };

  return (
    <>
      <PageHeader
        title={isEdit ? 'Edit Assignment' : 'New Assignment'}
        description={isEdit ? 'Update the details or the roster of students assigned.' : 'Create an assignment and assign it to your students.'}
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
        </Card>

        <Card title="Grade & curriculum" subtitle="Task types, subjects and topics are narrowed to the grade you choose." className="ui-field">
          <div className="grid gap-4 md:grid-cols-2">
            <Select label="Grade" options={gradeOptions} value={form.grade} onChange={setField('grade')} loading={grades.isLoading} placeholder="Select grade" />
            <Select
              label="Academic Year"
              options={academicYearOptions}
              value={form.academicYearId}
              onChange={setField('academicYearId')}
              loading={academicYears.isLoading}
              placeholder="Select academic year"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="Subject"
              options={subjectOptions}
              value={form.subjectId}
              onChange={setField('subjectId')}
              loading={subjects.isLoading}
              placeholder={form.legacySubject ? `${form.legacySubject} (choose to update)` : 'Select subject'}
            />
            <Select
              label="Topic"
              optional
              options={topicOptions}
              value={form.topicId}
              onChange={setField('topicId')}
              loading={Boolean(form.subjectId) && topics.isLoading}
              disabled={!form.subjectId}
              placeholder={form.subjectId ? (topicOptions.length ? 'Select topic' : 'No topics for this grade') : 'Choose a subject first'}
            />
          </div>

          <Select
            label="Task type"
            optional
            options={taskTypeOptions}
            value={form.taskTypeId}
            onChange={setField('taskTypeId')}
            loading={taskTypes.isLoading}
            placeholder="Select task type"
            hint={selectedTaskType?.description ?? (form.grade ? `Showing the task types for ${form.grade}.` : 'Choose a grade to see the task types that suit it.')}
          />

          <Input label="Estimated completion time (minutes)" type="number" min="0" value={form.estimatedMinutes} onChange={setField('estimatedMinutes')} />

          <div className="grid gap-4 md:grid-cols-2">
            <DatePicker label="Start date" value={form.startDate} onChange={setField('startDate')} />
            <DatePicker label="Due date" value={form.dueDate} onChange={setField('dueDate')} />
          </div>
        </Card>

        <Card title="Assign students" subtitle="Choose a grade and subject above, then select the students who should receive this assignment." className="ui-field">
          <StudentPicker subject={subjectName} grade={form.grade} academicYearId={form.academicYearId} value={studentIds} onChange={setStudentIds} />
        </Card>

        <Card
          title="Questions"
          subtitle="Optional. Build a quiz with pictures - upload a photo or pick an emoji, GIF or sticker, then ask a question."
          className="ui-field"
        >
          {questionsLocked && (
            <Alert variant="info" className="ui-field">
              A student has already started this task, so its questions can no longer be changed.
            </Alert>
          )}
          <QuestionBuilder
            questions={questions}
            onChange={(next) => {
              setQuestions(next);
              // Once problems are showing, keep them current as the teacher fixes each one.
              setQuestionErrors((prev) => (Object.keys(prev).length ? validateQuestions(next) : prev));
            }}
            errors={questionErrors}
            locked={questionsLocked}
          />
        </Card>

        <Card title="Background audio" subtitle="Optional." className="ui-field">
          <BackgroundAudioField
            value={audio}
            onChange={(next) => {
              setAudio(next);
              setErrors((e) => (e.audio ? { ...e, audio: undefined } : e));
            }}
            tracks={audioTracks.data ?? []}
            tracksLoading={audioTracks.isLoading}
            savedTrack={initial?.backgroundAudio?.type === 'library' ? { id: initial.backgroundAudio.trackId, name: initial.backgroundAudio.name, url: initial.backgroundAudio.url } : null}
            error={errors.audio}
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
          {isEdit && initial.status !== ASSIGNMENT_CRUD_STATUS.DRAFT ? 'Save changes' : 'Save as Draft'}
        </Button>
        {(!isEdit || initial.status === ASSIGNMENT_CRUD_STATUS.DRAFT) && (
          <Button
            onClick={() => handleSave(ASSIGNMENT_CRUD_STATUS.PUBLISHED)}
            loading={savingStatus === ASSIGNMENT_CRUD_STATUS.PUBLISHED}
            disabled={isArchived || savingStatus !== null || studentIds.length === 0}
          >
            Publish
          </Button>
        )}
      </div>

      <Toast />
    </>
  );
}

/**
 * Handles both create (`/teacher/assignments/new`) and edit
 * (`/teacher/assignments/:id/edit`). Edit waits for the saved assignment and
 * then mounts the editor with it, so the form starts from the saved values
 * instead of being overwritten after the first render.
 *
 * Resource attachments are managed from the assignment's details page - they
 * only make sense once the assignment exists.
 */
export default function AssignmentFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const detail = useApi(assignmentService.getAssignment);
  const { run } = detail;

  useEffect(() => {
    if (isEdit) run(id).catch(() => {});
  }, [isEdit, id, run]);

  if (!isEdit) return <AssignmentEditor key="new" initial={null} />;
  if (detail.error) return <ErrorState error={detail.error} onRetry={() => run(id).catch(() => {})} />;
  if (!detail.data || detail.data.id !== id) return <Loader message="Loading assignment…" />;
  return <AssignmentEditor key={id} initial={detail.data} />;
}
