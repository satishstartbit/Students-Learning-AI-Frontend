import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { LuArrowLeft, LuClock } from 'react-icons/lu';
import {
  Input,
  Textarea,
  Select,
  DatePicker,
  Alert,
  Loader,
  ErrorState,
  Toast,
  ConfirmationModal,
} from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { toast } from '../../../hooks/useToast';
import { getErrorMessage } from '../../../utils/errorHandler';
import { formatDate, formatTime } from '../../../utils/date';
import { ASSIGNMENT_CRUD_STATUS, ASSIGNMENT_RECIPIENT_STATUS } from '../../../utils/constants';
import assignmentService from '../../assignments/services/assignment.service';
import curriculumService from '../../assignments/services/curriculum.service';
import teacherStudentService from '../services/teacherStudent.service';
import QuestionBuilder from '../../assignments/components/QuestionBuilder';
import BackgroundAudioField from '../../assignments/components/BackgroundAudioField';
import { questionFromApi, questionToPayload, validateQuestions } from '../../assignments/components/questionDrafts';
import FormSection from '../components/assignmentForm/FormSection';
import PublishPanel from '../components/assignmentForm/PublishPanel';
import RosterPicker from '../components/assignmentForm/RosterPicker';
import '../../assignments/components/assignmentForm.css';

const AUTOSAVE_DELAY_MS = 1500;

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

const audioIsComplete = (audio) =>
  audio.type === 'none' || (audio.type === 'library' && Boolean(audio.trackId)) || (audio.type === 'upload' && Boolean(audio.fileId));

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** Stable fingerprint of one group of fields, to tell what changed since the last save. */
const fingerprint = (value) => JSON.stringify(value);

function groupsOf(form, studentIds, questions, audio) {
  return {
    details: fingerprint([form.title.trim(), form.description.trim()]),
    curriculum: fingerprint([form.grade, form.subjectId, form.legacySubject, form.topicId, form.taskTypeId, form.academicYearId, String(form.estimatedMinutes)]),
    dates: fingerprint([form.startDate, form.dueDate]),
    students: fingerprint([...studentIds].sort()),
    questions: fingerprint(questions.map(questionToPayload)),
    audio: fingerprint(audio),
  };
}

function AssignmentEditor({ initial }) {
  const navigate = useNavigate();

  const [form, setForm] = useState(() => initialForm(initial));
  const [studentIds, setStudentIds] = useState(() => (initial?.recipients ?? []).map((r) => r.student?.id).filter(Boolean));
  const [questions, setQuestions] = useState(() => (initial?.questions ?? []).map(questionFromApi));
  const [audio, setAudio] = useState(() => initialAudio(initial));
  const [errors, setErrors] = useState({});
  const [questionErrors, setQuestionErrors] = useState({});
  const [busy, setBusy] = useState(null);
  const [confirmUnpublish, setConfirmUnpublish] = useState(false);

  // The saved record: status and what was last written, updated by every save.
  const [saved, setSaved] = useState(() => ({
    id: initial?.id ?? null,
    status: initial?.status ?? ASSIGNMENT_CRUD_STATUS.DRAFT,
    groups: groupsOf(initialForm(initial), (initial?.recipients ?? []).map((r) => r.student?.id).filter(Boolean), (initial?.questions ?? []).map(questionFromApi), initialAudio(initial)),
  }));
  const [autosave, setAutosave] = useState({ state: 'idle' });

  const isEdit = Boolean(initial);
  const published = saved.status === ASSIGNMENT_CRUD_STATUS.PUBLISHED || saved.status === 'completed';
  const isArchived = saved.status === ASSIGNMENT_CRUD_STATUS.ARCHIVED;
  const recipients = useMemo(() => initial?.recipients ?? [], [initial]);
  const startedIds = useMemo(
    () => recipients.filter((r) => r.status !== ASSIGNMENT_RECIPIENT_STATUS.ASSIGNED).map((r) => r.student?.id).filter(Boolean),
    [recipients]
  );
  // Questions are fixed once any student has started - their answers point at them.
  const questionsLocked = startedIds.length > 0;

  // ---- sections: all open to start a new one; editing opens only Questions (the mockup) ----
  const [open, setOpen] = useState(() =>
    isEdit
      ? { details: false, curriculum: false, students: false, questions: true, audio: false }
      : { details: true, curriculum: true, students: true, questions: true, audio: false }
  );
  const toggle = (key) => setOpen((o) => ({ ...o, [key]: !o[key] }));

  // ---- curriculum lookups ----
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

  const setField = (key) => (e) => {
    const value = e.target.value;
    setForm((f) => {
      const next = { ...f, [key]: value };
      // A new grade can change which subjects/topics/types apply; a new subject changes its topics.
      if (key === 'grade') Object.assign(next, { subjectId: '', topicId: '', taskTypeId: '', legacySubject: '' });
      if (key === 'subjectId') Object.assign(next, { topicId: '', legacySubject: '' });
      return next;
    });
    // The roster is scoped to grade + subject, so a new pick starts it over (students who started stay).
    if (key === 'subjectId' || key === 'grade') setStudentIds((ids) => (ids.length > startedIds.length ? [...startedIds] : ids));
    if (key === 'title') setErrors((er) => (er.title ? { ...er, title: undefined } : er));
  };

  // ---- derived status ----
  const liveQuestionErrors = useMemo(() => validateQuestions(questions), [questions]);
  const questionsValid = Object.keys(liveQuestionErrors).length === 0;
  const hasTitle = Boolean(form.title.trim());
  const hasDescription = Boolean(form.description.trim());
  const hasCurriculum = Boolean(form.grade && subjectName);
  const hasDates = Boolean(form.startDate && form.dueDate);
  const hasStudents = studentIds.length > 0;
  const canPublish = hasTitle && hasStudents && questionsValid && audioIsComplete(audio);

  const current = groupsOf(form, studentIds, questions, audio);
  const changed = Object.fromEntries(Object.keys(current).map((k) => [k, current[k] !== saved.groups[k]]));
  const hasChanges = Object.values(changed).some(Boolean);

  const chips = {
    details: hasTitle && hasDescription ? { label: 'Complete', tone: 'success' } : hasTitle ? { label: 'Add a description' } : { label: 'Needs a title', tone: 'warning' },
    curriculum: hasCurriculum ? { label: 'Complete', tone: 'success' } : { label: 'Needs grade & subject', tone: 'warning' },
    students: hasStudents ? { label: plural(studentIds.length, 'student'), tone: 'accent' } : { label: 'Needs students', tone: 'warning' },
    questions: questions.length === 0 ? { label: 'Optional' } : questionsValid ? { label: plural(questions.length, 'question') } : { label: 'Needs finishing', tone: 'danger' },
    audio: audio.type === 'none' ? { label: 'Optional' } : audioIsComplete(audio) ? { label: 'On', tone: 'accent' } : { label: 'Pick a sound', tone: 'warning' },
  };

  const checklist = [
    { key: 'details', label: 'Title and description', state: hasTitle && hasDescription ? 'done' : hasTitle ? 'todo' : 'warn', edited: changed.details },
    { key: 'curriculum', label: 'Grade and subject', state: hasCurriculum ? 'done' : 'todo', edited: changed.curriculum },
    { key: 'dates', label: 'Start and due dates', state: hasDates ? 'done' : 'todo', edited: changed.dates },
    published
      ? { key: 'students', label: `${plural(studentIds.length, 'student')} assigned`, state: hasStudents ? 'done' : 'warn', edited: changed.students }
      : { key: 'students', label: 'At least one student', state: hasStudents ? 'done' : 'warn', edited: changed.students },
    published
      ? { key: 'questions', label: questions.length ? plural(questions.length, 'question') : 'No questions', state: questionsValid ? 'done' : 'warn', edited: changed.questions }
      : { key: 'questions', label: 'Questions (optional)', state: questionsValid ? 'done' : 'warn', edited: changed.questions },
  ];

  // ---- saving ----
  const backgroundAudioPayload = () => {
    if (audio.type === 'library') return { type: 'library', trackId: audio.trackId };
    if (audio.type === 'upload') return { type: 'upload', fileId: audio.fileId };
    return { type: 'none' };
  };

  /**
   * The request body. A draft autosave leaves out anything that isn't
   * finished yet (a half-written question, a sound not picked) rather than
   * failing - those save as soon as they're complete.
   */
  const buildPayload = ({ partial = false } = {}) => {
    const body = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      grade: form.grade || null,
      subjectId: form.subjectId || null,
      subject: subjectName || null,
      topicId: form.topicId || null,
      taskTypeId: form.taskTypeId || null,
      academicYearId: form.academicYearId || null,
      startDate: form.startDate || null,
      dueDate: form.dueDate || null,
      estimatedMinutes: form.estimatedMinutes !== '' && Number(form.estimatedMinutes) > 0 ? Math.round(Number(form.estimatedMinutes)) : null,
      studentIds,
    };
    if (!partial || questionsValid) body.questions = questions.map(questionToPayload);
    if (!partial || audioIsComplete(audio)) body.backgroundAudio = backgroundAudioPayload();
    return body;
  };

  // Saves run one at a time, in order, so an autosave can never race a click.
  const queue = useRef(Promise.resolve());
  const savedRef = useRef(saved);
  useEffect(() => {
    savedRef.current = saved;
  }, [saved]);

  const enqueue = useCallback((task) => {
    const next = queue.current.then(task, task);
    queue.current = next.catch(() => {});
    return next;
  }, []);

  /** Creates the draft the first time, updates it after. Returns the saved detail. */
  const writeDraft = useCallback(
    async (body, groups) => {
      const { id } = savedRef.current;
      const result = id ? await assignmentService.updateAssignment(id, body) : await assignmentService.createAssignment({ ...body, status: ASSIGNMENT_CRUD_STATUS.DRAFT });
      const detail = result?.data;
      const next = { id: detail?.id ?? id, status: detail?.status ?? ASSIGNMENT_CRUD_STATUS.DRAFT, groups };
      savedRef.current = next;
      setSaved(next);
      // The first save of a new draft gives it an address - a refresh now reopens it for editing.
      if (!id && detail?.id) window.history.replaceState(window.history.state, '', `/teacher/assignments/${detail.id}/edit`);
      return detail;
    },
    []
  );

  // Autosave: drafts only (a published assignment is live - it waits for Save changes).
  const autosaveBody = !published && !isArchived && hasTitle && hasChanges ? buildPayload({ partial: true }) : null;
  const autosaveKey = autosaveBody ? fingerprint(autosaveBody) : null;
  const pendingAutosave = useRef(null);

  useEffect(() => {
    if (!autosaveKey || busy) return undefined;
    const body = JSON.parse(autosaveKey);
    const groups = current;
    const timer = setTimeout(() => {
      pendingAutosave.current = null;
      setAutosave({ state: 'saving' });
      enqueue(() => writeDraft(body, groups))
        .then(() => setAutosave({ state: 'saved', at: new Date().toISOString(), partial: !questionsValid || !audioIsComplete(audio) }))
        .catch((err) => setAutosave({ state: 'error', message: getErrorMessage(err) }));
    }, AUTOSAVE_DELAY_MS);
    pendingAutosave.current = timer;
    return () => clearTimeout(timer);
    // `current`/`questionsValid`/`audio` are all captured in autosaveKey.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autosaveKey, busy, enqueue, writeDraft]);

  const openSectionsWithErrors = (next, qErrors) => {
    setOpen((o) => ({
      ...o,
      details: o.details || Boolean(next.title),
      questions: o.questions || Object.keys(qErrors).length > 0,
      audio: o.audio || Boolean(next.audio),
    }));
  };

  const validate = () => {
    const next = {};
    if (!hasTitle) next.title = 'Give the assignment a title';
    if (audio.type === 'library' && !audio.trackId) next.audio = 'Choose a sound, or pick "No sound"';
    if (audio.type === 'upload' && !audio.fileId) next.audio = 'Upload an audio file, or pick "No sound"';
    const qErrors = questionsLocked ? {} : liveQuestionErrors;
    setErrors(next);
    setQuestionErrors(qErrors);
    openSectionsWithErrors(next, qErrors);
    if (Object.keys(qErrors).length) toast.error('Some questions need finishing - see the highlighted fields');
    return Object.keys(next).length === 0 && Object.keys(qErrors).length === 0;
  };

  const cancelPendingAutosave = () => {
    if (pendingAutosave.current) clearTimeout(pendingAutosave.current);
    pendingAutosave.current = null;
  };

  const handleSaveDraft = async () => {
    if (!validate()) return;
    cancelPendingAutosave();
    setBusy('draft');
    try {
      const detail = await enqueue(() => writeDraft(buildPayload(), current));
      toast.success('Draft saved');
      navigate(`/teacher/assignments/${detail.id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const handlePublish = async () => {
    if (!validate()) return;
    if (!hasStudents) {
      setOpen((o) => ({ ...o, students: true }));
      toast.error('Pick at least one student before publishing');
      return;
    }
    cancelPendingAutosave();
    setBusy('publish');
    try {
      const detail = await enqueue(async () => {
        const draft = await writeDraft(buildPayload(), current);
        return (await assignmentService.publishAssignment(draft.id))?.data ?? draft;
      });
      toast.success('Assignment published');
      navigate(`/teacher/assignments/${detail.id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const handleSaveChanges = async () => {
    if (!validate()) return;
    if (!hasStudents) {
      setOpen((o) => ({ ...o, students: true }));
      toast.error('A published assignment needs at least one student');
      return;
    }
    setBusy('save');
    try {
      await enqueue(() => assignmentService.updateAssignment(saved.id, buildPayload()));
      toast.success('Changes saved');
      navigate(`/teacher/assignments/${saved.id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const handleUnpublish = async () => {
    setConfirmUnpublish(false);
    setBusy('unpublish');
    try {
      const result = await enqueue(() => assignmentService.unpublishAssignment(saved.id));
      setSaved((s) => ({ ...s, status: result?.data?.status ?? ASSIGNMENT_CRUD_STATUS.DRAFT }));
      toast.success('Moved back to drafts - students no longer see it');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  // ---- header text ----
  let subtitle = 'Create an assignment and send it to your students. Open a section to fill it in.';
  if (isEdit) {
    const bits = [initial.title];
    if (published && initial.publishedAt) bits.push(`Published ${formatDate(initial.publishedAt)}`);
    else if (isArchived) bits.push('Archived');
    else bits.push('Draft');
    if (published) bits.push(`${initial.submittedCount ?? 0} of ${initial.recipientCount ?? recipients.length} submitted`);
    subtitle = bits.join(' · ');
  }

  let saveState = null;
  if (!published) {
    if (autosave.state === 'saving') saveState = { text: 'Saving draft…' };
    // A failed save that has since been undone leaves nothing unsaved.
    else if (autosave.state === 'error' && !hasChanges) saveState = { text: 'All changes saved.' };
    else if (autosave.state === 'error') saveState = { text: `Couldn't save the draft: ${autosave.message}. We'll try again when you type.`, tone: 'error' };
    else if (autosave.state === 'saved')
      saveState = {
        text: autosave.partial
          ? `Draft saved at ${formatTime(autosave.at)}. Unfinished questions or sounds save once they're complete.`
          : `Draft saved at ${formatTime(autosave.at)}.`,
      };
    else if (!hasTitle) saveState = { text: 'Drafts save automatically as you type - start with a title.' };
  }

  const cancelTo = saved.id && isEdit ? `/teacher/assignments/${saved.id}` : '/teacher/assignments';

  return (
    <div className="af-page td-page">
      <Link to="/teacher/assignments" className="af-back">
        <LuArrowLeft size={15} aria-hidden="true" /> Back to assignments
      </Link>
      <h1 className="af-title">{isEdit ? 'Edit assignment' : 'New assignment'}</h1>
      <p className="af-subtitle">{subtitle}</p>

      {isArchived && (
        <Alert variant="warning" title="This assignment is archived" className="ui-field">
          Archived assignments can&apos;t be edited.
        </Alert>
      )}

      <div className="af-layout">
        <fieldset disabled={isArchived} className="af-sections" style={{ border: 'none', padding: 0, margin: 0 }}>
          <FormSection title="Details" description="Name the assignment and tell students what it is about." chip={chips.details} open={open.details} onToggle={() => toggle('details')}>
            <Input label="Title" required value={form.title} onChange={setField('title')} error={errors.title} maxLength={255} placeholder="e.g. Halves and quarters" />
            <Textarea label="Description" value={form.description} onChange={setField('description')} rows={4} placeholder="What should students do?" />
          </FormSection>

          <FormSection
            title="Grade & curriculum"
            description="Task types, subjects and topics narrow to the grade you pick."
            chip={chips.curriculum}
            open={open.curriculum}
            onToggle={() => toggle('curriculum')}
          >
            <div className="af-grid af-grid--2">
              <Select label="Grade" options={gradeOptions} value={form.grade} onChange={setField('grade')} loading={grades.isLoading} placeholder="Select grade" />
              <Select
                label="Academic year"
                options={academicYearOptions}
                value={form.academicYearId}
                onChange={setField('academicYearId')}
                loading={academicYears.isLoading}
                placeholder="Select academic year"
              />
              <Select
                label="Subject"
                options={subjectOptions}
                value={form.subjectId}
                onChange={setField('subjectId')}
                loading={subjects.isLoading}
                disabled={!form.grade && !form.subjectId}
                placeholder={form.legacySubject ? `${form.legacySubject} (choose to update)` : form.grade ? 'Select subject' : 'Choose a grade first'}
              />
              <Select
                label="Topic (optional)"
                options={topicOptions}
                value={form.topicId}
                onChange={setField('topicId')}
                loading={Boolean(form.subjectId) && topics.isLoading}
                disabled={!form.subjectId}
                placeholder={form.subjectId ? (topicOptions.length ? 'Select topic' : 'No topics for this grade') : 'Choose a subject first'}
              />
            </div>

            <Select
              label="Task type (optional)"
              options={taskTypeOptions}
              value={form.taskTypeId}
              onChange={setField('taskTypeId')}
              loading={taskTypes.isLoading}
              placeholder="Select task type"
              hint={selectedTaskType?.description ?? (form.grade ? `Showing the task types for ${form.grade}.` : 'Choose a grade to see the task types that suit it.')}
            />

            <div className="af-grid af-grid--3">
              <Input
                label="Estimated time"
                type="number"
                min="1"
                max="10000"
                inputMode="numeric"
                value={form.estimatedMinutes}
                onChange={setField('estimatedMinutes')}
                startAdornment={<LuClock size={16} />}
                endAdornment={<span className="ui-hint">minutes</span>}
                placeholder="20"
              />
              <DatePicker label="Start date" value={form.startDate} onChange={setField('startDate')} />
              <DatePicker label="Due date" value={form.dueDate} onChange={setField('dueDate')} min={form.startDate || undefined} />
            </div>
          </FormSection>

          <FormSection
            title="Assign students"
            description="Only students in the grade and subject above are listed."
            chip={chips.students}
            open={open.students}
            onToggle={() => toggle('students')}
          >
            <RosterPicker
              subject={subjectName}
              grade={form.grade}
              academicYearId={form.academicYearId}
              value={studentIds}
              onChange={setStudentIds}
              lockedIds={startedIds}
              disabled={isArchived}
            />
          </FormSection>

          <FormSection title="Questions" description="Optional. Add pictures, then ask a question." chip={chips.questions} open={open.questions} onToggle={() => toggle('questions')}>
            {questionsLocked && (
              <Alert variant="info" className="ui-field">
                A student has already started this assignment, so its questions can no longer be changed.
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
          </FormSection>

          <FormSection
            title="Background audio"
            description="Optional. Plays on a loop while the student works. They can pause or mute it."
            chip={chips.audio}
            open={open.audio}
            onToggle={() => toggle('audio')}
          >
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
          </FormSection>
        </fieldset>

        <PublishPanel
          mode={published ? 'published' : 'draft'}
          items={checklist}
          canPublish={canPublish}
          busy={busy}
          disabled={isArchived}
          cancelTo={cancelTo}
          onPublish={handlePublish}
          onSaveDraft={handleSaveDraft}
          onSaveChanges={handleSaveChanges}
          onUnpublish={() => setConfirmUnpublish(true)}
          canUnpublish={published && startedIds.length === 0}
          hasChanges={hasChanges}
          saveState={saveState}
        />
      </div>

      <ConfirmationModal
        isOpen={confirmUnpublish}
        onClose={() => setConfirmUnpublish(false)}
        onConfirm={handleUnpublish}
        title="Unpublish this assignment?"
        message={`It goes back to your drafts and ${plural(studentIds.length, 'student')} stop seeing it. You can publish it again any time.`}
        confirmLabel="Unpublish"
        loading={busy === 'unpublish'}
      />

      <Toast />
    </div>
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
