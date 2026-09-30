import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Textarea, Button, Alert, AudioPlayer, ConfirmationModal, FileUpload, Loader, ErrorState } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { useModal } from '../../../hooks/useModal';
import { useFileUpload } from '../../../hooks/useFileUpload';
import { toast } from '../../../hooks/useToast';
import { getErrorMessage } from '../../../utils/errorHandler';
import { isOverdue } from '../../../utils/date';
import { formatFileSize } from '../../../utils/format';
import { ASSIGNMENT_RECIPIENT_STATUS } from '../../../utils/constants';
import { DOCUMENT_MIME_TYPES, IMAGE_MIME_TYPES } from '../../../utils/file';
import assignmentService from '../../assignments/services/assignment.service';
import AnswerReviewCard from '../components/assignment/AnswerReviewCard';
import ReviewBanner from '../components/assignment/ReviewBanner';
import StandardAssignmentView from '../components/assignment/StandardAssignmentView';
import { reviewAnswers } from '../components/assignment/answerReview';
import { HANDED_IN_STATUSES } from '../components/assignment/assignmentLabels';
import { TaskFocusCard } from '../components/focus/TaskFocusCard';
import { KidAssignmentView } from '../components/kid/KidAssignmentView';
import { useStudentExperience } from '../hooks/useStudentExperience';
import QuestionAnswer from '../../assignments/components/QuestionAnswer';

const ACTIVE_STATUSES = [ASSIGNMENT_RECIPIENT_STATUS.ASSIGNED, ASSIGNMENT_RECIPIENT_STATUS.IN_PROGRESS, ASSIGNMENT_RECIPIENT_STATUS.RETURNED];

const MCQ_LIKE = ['mcq', 'passage_mcq'];

const isAnswered = (question, answer) => {
  if (MCQ_LIKE.includes(question.answerType)) return Boolean(answer?.selectedOptionId);
  if (question.answerType === 'matching') return Boolean(answer?.matchedPairs?.length);
  return Boolean(answer?.textAnswer?.trim());
};

/**
 * The task's background sound. Both the link and the autoplay decision are
 * fixed when the task is opened: an uploaded file gets a freshly signed link
 * on every reload (e.g. after Save Progress) and swapping the src would
 * restart the sound, and submitting shouldn't cut it off mid-page - the
 * student pauses it when they want.
 */
function TaskAudio({ audio, autoPlay }) {
  const [src] = useState(audio.url);
  const [startOnOpen] = useState(autoPlay);
  return <AudioPlayer src={src} title={audio.name} autoPlay={startOnOpen} className="ui-field" />;
}

/**
 * The student's own work while the task is still theirs to do (assigned,
 * started, or sent back): Start, the answers, Save Progress and Submit.
 * Mounted fresh when the status changes, so it starts from the saved
 * answers. Once handed in, each band shows the review instead
 * (ReviewBanner + AnswerReviewCard, or KidAssignmentView's review).
 */
function StudentWork({ item, assignmentId, reload }) {
  const a = item.assignment;
  const questions = a.questions ?? [];
  const canEdit = item.status === ASSIGNMENT_RECIPIENT_STATUS.IN_PROGRESS || item.status === ASSIGNMENT_RECIPIENT_STATUS.RETURNED;

  const [content, setContent] = useState(item.submission?.content ?? '');
  const [answers, setAnswers] = useState(() =>
    Object.fromEntries(
      (item.submission?.answers ?? []).map((ans) => [
        ans.questionId,
        { selectedOptionId: ans.selectedOptionId, textAnswer: ans.textAnswer ?? '', matchedPairs: ans.matchedPairs ?? [] },
      ])
    )
  );
  const [missing, setMissing] = useState([]);
  const [starting, setStarting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submitModal = useModal();

  const upload = useFileUpload({
    multiple: true,
    maxFiles: 10,
    allowedMimeTypes: [...IMAGE_MIME_TYPES, ...DOCUMENT_MIME_TYPES],
    fieldName: 'files',
    uploadFn: (formData, opts) => assignmentService.addAssignmentFiles(assignmentId, formData, opts),
  });

  const answersPayload = () =>
    questions.map((q) => {
      if (MCQ_LIKE.includes(q.answerType)) return { questionId: q.id, selectedOptionId: answers[q.id]?.selectedOptionId ?? null };
      if (q.answerType === 'matching') return { questionId: q.id, matchedPairs: answers[q.id]?.matchedPairs ?? [] };
      return { questionId: q.id, textAnswer: answers[q.id]?.textAnswer ?? '' };
    });

  const workPayload = () => ({ content, ...(questions.length ? { answers: answersPayload() } : {}) });

  const handleUploadAttachment = async () => {
    try {
      await upload.upload();
      toast.success('File attached');
      upload.clear();
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleStart = async () => {
    setStarting(true);
    try {
      await assignmentService.startAssignment(assignmentId);
      toast.success("You've started this assignment - start the focus clock when you're ready.");
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setStarting(false);
    }
  };

  const handleSaveProgress = async () => {
    setSaving(true);
    try {
      await assignmentService.saveAssignmentProgress(assignmentId, workPayload());
      toast.success('Progress saved');
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const openSubmit = () => {
    const notAnswered = questions.filter((q) => q.required !== false && !isAnswered(q, answers[q.id])).map((q) => q.id);
    setMissing(notAnswered);
    if (notAnswered.length) {
      toast.error(notAnswered.length === 1 ? 'Answer the last question before submitting' : `Answer all the questions first (${notAnswered.length} left)`);
      return;
    }
    submitModal.open();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await assignmentService.submitAssignment(assignmentId, workPayload());
      toast.success('Great work! Your assignment has been submitted.');
      submitModal.close();
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const setAnswer = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setMissing((prev) => (prev.includes(questionId) ? prev.filter((id) => id !== questionId) : prev));
  };

  if (!ACTIVE_STATUSES.includes(item.status)) return null;

  return (
    <>
      {item.status === ASSIGNMENT_RECIPIENT_STATUS.ASSIGNED && (
        <Card className="ui-field">
          <p>{questions.length ? `Ready? There ${questions.length === 1 ? 'is 1 question' : `are ${questions.length} questions`} for you.` : 'Ready to give this a try?'}</p>
          <Button onClick={handleStart} loading={starting}>
            Start Assignment
          </Button>
        </Card>
      )}

      {item.status === ASSIGNMENT_RECIPIENT_STATUS.RETURNED && item.submission?.feedback && (
        <Alert variant="warning" title="Your teacher sent this back with feedback" className="ui-field">
          {item.submission.feedback}
        </Alert>
      )}

      {canEdit && (
        <Card title="Your work" className="ui-field">
          {questions.length > 0 && (
            <div className="ui-field" style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
              {questions.map((q, index) => (
                <QuestionAnswer
                  key={q.id}
                  question={q}
                  number={index + 1}
                  answer={answers[q.id]}
                  onChange={(value) => setAnswer(q.id, value)}
                  error={missing.includes(q.id) ? 'Pick an answer for this one' : undefined}
                />
              ))}
            </div>
          )}

          {(questions.length === 0 || content) && (
            <Textarea
              label={questions.length ? 'Anything else for your teacher? (optional)' : 'Write your answer here'}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={questions.length ? 3 : 8}
            />
          )}

          <FileUpload label="Attach a file (optional)" multiple files={upload.files} onSelect={upload.select} onRemove={upload.removeAt} maxSizeLabel="10 MB" />
          {upload.hasFiles && (
            <Button size="sm" variant="secondary" onClick={handleUploadAttachment} loading={upload.isUploading}>
              Attach file
            </Button>
          )}

          {item.submission?.attachments?.length > 0 && (
            <ul style={{ margin: 'var(--spacing-sm) 0 0', padding: 0, listStyle: 'none' }}>
              {item.submission.attachments.map((f) => (
                <li key={f.id}>
                  📎{' '}
                  <a href={f.url} target="_blank" rel="noopener noreferrer">
                    {f.originalFilename}
                  </a>{' '}
                  <span className="ui-hint">({formatFileSize(f.fileSize)})</span>
                </li>
              ))}
            </ul>
          )}

          <div className="flex justify-end gap-2 ui-field">
            <Button variant="secondary" onClick={handleSaveProgress} loading={saving}>
              Save Progress
            </Button>
            <Button onClick={openSubmit}>Submit</Button>
          </div>
        </Card>
      )}

      <ConfirmationModal
        isOpen={submitModal.isOpen}
        onClose={submitModal.close}
        onConfirm={handleSubmit}
        title="Submit this assignment?"
        message="Once you submit, you won't be able to make more changes unless your teacher sends it back. Are you sure you're ready?"
        confirmLabel="Yes, submit it"
        loading={submitting}
      />
    </>
  );
}

/**
 * Student-facing assignment page, one per band, both built to the mockups:
 *
 *   Grade 6+  StandardAssignmentView - header with overall progress, the
 *             student's own task breakdown, their work, and a rail with
 *             overview / next step / resources / notes / details. Handed in:
 *             ReviewBanner ("You got 4 of 6 right", score, what the teacher
 *             said) and AnswerReviewCard (All / Look again), "Status" in the rail.
 *   K-5       KidAssignmentView - the "Busy Bee quiz" page: paper header,
 *             what to do and the work while it's open; once handed in,
 *             "How did you do?", stars, "Your answers" with "This one!", and
 *             the reading scene.
 *
 * A task's background sound starts on its own while the task is still to do,
 * with pause and mute always visible. Once the task is started (Start
 * Assignment), a Focus time clock appears above the work, already tied to
 * this task - KidTaskFocus for K-5 (the same card as the Focus time page) and
 * TaskFocusCard for Grade 6+.
 */
export default function AssignmentDetailPage() {
  const { assignmentId } = useParams();
  const { isJunior } = useStudentExperience();

  const detail = useApi(assignmentService.getAssignment);
  const { run } = detail;
  const load = useCallback(() => run(assignmentId), [run, assignmentId]);
  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const item = detail.data;

  if (detail.isLoading && !item) return <Loader message="Loading your assignment…" />;
  if (detail.error) return <ErrorState error={detail.error} onRetry={load} />;
  if (!item) return null;

  const a = item.assignment;
  const overdue = ['assigned', 'in_progress'].includes(item.status) && a.dueDate && isOverdue(a.dueDate);
  const audio = a.backgroundAudio;
  const handedIn = HANDED_IN_STATUSES.includes(item.status);

  const work = <StudentWork key={`${item.recipientId}:${item.status}`} item={item} assignmentId={assignmentId} reload={load} />;
  // Started and not yet handed in - the same statuses that let the student edit their work.
  const working = item.status === ASSIGNMENT_RECIPIENT_STATUS.IN_PROGRESS || item.status === ASSIGNMENT_RECIPIENT_STATUS.RETURNED;
  // The sound belongs to doing the task; a handed-in task has no player.
  const sound = !handedIn && audio?.url && (
    <TaskAudio key={`${a.id}:${audio.type}:${audio.name}`} audio={audio} autoPlay={ACTIVE_STATUSES.includes(item.status)} />
  );
  const overdueNote = overdue && (
    <Alert variant="danger" title="This one is overdue" className={isJunior ? undefined : 'ui-field'}>
      Try to finish it as soon as you can, or ask your teacher for help.
    </Alert>
  );

  if (!isJunior) {
    const review = handedIn ? reviewAnswers(a.questions ?? [], item.submission) : null;
    return (
      <>
        {sound}
        <StandardAssignmentView item={item} assignmentId={assignmentId} reload={load}>
          {overdueNote}
          <TaskFocusCard assignmentId={assignmentId} available={working} />
          {handedIn ? (
            <>
              <ReviewBanner item={item} review={review} />
              <AnswerReviewCard review={review} content={item.submission?.content} />
            </>
          ) : (
            work
          )}
        </StandardAssignmentView>
      </>
    );
  }

  return (
    <KidAssignmentView
      item={item}
      assignmentId={assignmentId}
      working={working}
      notices={
        (sound || overdueNote) && (
          <>
            {sound}
            {overdueNote}
          </>
        )
      }
    >
      {work}
    </KidAssignmentView>
  );
}
