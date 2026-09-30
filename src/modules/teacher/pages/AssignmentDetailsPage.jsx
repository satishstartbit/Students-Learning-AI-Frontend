import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  PageHeader,
  Card,
  SectionHeader,
  Button,
  Badge,
  AudioPlayer,
  StatusBadge,
  ProgressBar,
  Table,
  FileUpload,
  ConfirmationModal,
  Alert,
  Loader,
  ErrorState,
  Toast,
  EmptyState,
} from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { useModal } from '../../../hooks/useModal';
import { useFileUpload } from '../../../hooks/useFileUpload';
import { toast } from '../../../hooks/useToast';
import { getErrorMessage } from '../../../utils/errorHandler';
import { formatDate, formatDateTime, isOverdue } from '../../../utils/date';
import { formatName, formatFileSize } from '../../../utils/format';
import { ASSIGNMENT_CRUD_STATUS } from '../../../utils/constants';
import { DOCUMENT_MIME_TYPES, IMAGE_MIME_TYPES } from '../../../utils/file';
import assignmentService from '../../assignments/services/assignment.service';
import ReviewSubmissionModal from '../../assignments/components/ReviewSubmissionModal';
import QuestionPicture from '../../assignments/media/QuestionPicture';
import TeacherPlanCard from '../components/assignmentDetails/TeacherPlanCard';

/** The task's questions as the teacher set them, correct answers marked. */
function QuestionsPreview({ questions }) {
  return (
    <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 'var(--spacing-md)' }}>
      {questions.map((q, index) => (
        <li key={q.id} style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {q.image && <QuestionPicture image={q.image} size="sm" />}
          <div style={{ flex: '1 1 14rem', minWidth: 0 }}>
            <strong>
              {index + 1}. {q.prompt}
            </strong>
            {q.required === false && <span className="ui-hint"> (optional)</span>}
            {q.points > 1 && <span className="ui-hint"> · {q.points} pts</span>}

            {q.answerType === 'passage_mcq' && q.passage && (
              <p className="ui-hint" style={{ margin: '4px 0', whiteSpace: 'pre-wrap' }}>
                {q.passage}
              </p>
            )}

            {(q.answerType === 'mcq' || q.answerType === 'passage_mcq') && (
              <ul style={{ margin: '4px 0 0', paddingLeft: 'var(--spacing-lg)' }}>
                {q.options.map((o) => (
                  <li key={o.id} style={o.id === q.correctOptionId ? { fontWeight: 600, color: 'var(--color-success-fg)' } : undefined}>
                    {o.image ? <QuestionPicture image={o.image} size="xs" /> : o.text}
                    {o.id === q.correctOptionId && ' ✓ correct'}
                  </li>
                ))}
              </ul>
            )}

            {q.answerType === 'matching' && (
              <ul style={{ margin: '4px 0 0', paddingLeft: 'var(--spacing-lg)' }}>
                {q.pairs.map((pair) => (
                  <li key={pair.id}>
                    {pair.left.text ?? 'Picture'} → {pair.right.text ?? 'picture'}
                  </li>
                ))}
              </ul>
            )}

            {q.answerType === 'free_text' && (
              <div className="ui-hint">Written answer{q.expectedAnswer ? ` - expecting: ${q.expectedAnswer}` : ''}</div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function AssignmentDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const detail = useApi(assignmentService.getAssignment);
  const { run } = detail;

  const load = useCallback(() => run(id), [run, id]);
  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const assignment = detail.data;

  const [actionBusy, setActionBusy] = useState(false);
  const archiveModal = useModal();
  const deleteModal = useModal();
  const reviewModal = useModal();

  const upload = useFileUpload({
    multiple: true,
    maxFiles: 10,
    allowedMimeTypes: [...IMAGE_MIME_TYPES, ...DOCUMENT_MIME_TYPES],
    fieldName: 'files',
    uploadFn: (formData, opts) => assignmentService.addAssignmentFiles(id, formData, opts),
  });

  const handleUpload = async () => {
    try {
      await upload.upload();
      toast.success('Resource(s) uploaded');
      upload.clear();
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleRemoveFile = async (fileId) => {
    try {
      await assignmentService.removeAssignmentFile(id, fileId);
      toast.success('File removed');
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handlePublish = async () => {
    setActionBusy(true);
    try {
      await assignmentService.publishAssignment(id);
      toast.success('Assignment published');
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionBusy(false);
    }
  };

  const handleArchive = async () => {
    setActionBusy(true);
    try {
      await assignmentService.archiveAssignment(id);
      toast.success('Assignment archived');
      archiveModal.close();
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionBusy(false);
    }
  };

  const handleDelete = async () => {
    setActionBusy(true);
    try {
      await assignmentService.deleteAssignment(id);
      toast.success('Assignment deleted');
      navigate('/teacher/assignments', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
      setActionBusy(false);
    }
  };

  const handleReviewed = () => load();

  if (detail.isLoading && !assignment) return <Loader message="Loading assignment…" />;
  if (detail.error) return <ErrorState error={detail.error} onRetry={load} />;
  if (!assignment) return null;

  const overdue =
    assignment.status === ASSIGNMENT_CRUD_STATUS.PUBLISHED && assignment.dueDate && isOverdue(assignment.dueDate);
  const total = assignment.recipientCount ?? assignment.recipients?.length ?? 0;
  const completed = assignment.completedCount ?? 0;

  const recipientColumns = [
    { key: 'student', header: 'Student', render: (r) => formatName(r.student) },
    {
      key: 'status',
      header: 'Status',
      render: (r) => {
        const isOverdueRow =
          ['assigned', 'in_progress'].includes(r.status) && assignment.dueDate && isOverdue(assignment.dueDate);
        return isOverdueRow ? <StatusBadge status="overdue" label="Overdue" /> : <StatusBadge status={r.status} />;
      },
    },
    {
      key: 'submittedAt',
      header: 'Submitted',
      render: (r) => (r.submission?.submittedAt ? formatDateTime(r.submission.submittedAt) : '—'),
    },
    ...(assignment.questions?.length
      ? [
          {
            key: 'quiz',
            header: 'Quiz',
            render: (r) => {
              const quiz = r.submission?.quiz;
              if (!quiz || r.submission.status === 'draft') return quiz ? `${quiz.answered}/${quiz.totalQuestions} answered` : '—';
              return (
                <div>
                  <div>
                    {quiz.correct}/{quiz.totalQuestions} correct
                  </div>
                  {quiz.pendingReview > 0 && <Badge variant="warning">{quiz.pendingReview} to mark</Badge>}
                </div>
              );
            },
          },
        ]
      : []),
    {
      key: 'review',
      header: 'Score / Feedback',
      render: (r) => {
        if (!r.submission || r.submission.status !== 'reviewed') return '—';
        return (
          <div>
            {r.submission.score != null && <Badge variant="success">{r.submission.score}/100</Badge>}
            {r.submission.feedback && <div className="ui-hint">{r.submission.feedback}</div>}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (r) =>
        r.status === 'submitted' ? (
          <Button size="sm" onClick={() => reviewModal.open(r)}>
            Review
          </Button>
        ) : (
          '—'
        ),
    },
  ];

  return (
    <div className="td-page">
      <PageHeader
        title={assignment.title}
        description={`${assignment.subject || 'No subject'} · ${assignment.grade || 'No grade'}`}
        breadcrumbs={[{ label: 'Assignments', to: '/teacher/assignments' }, { label: assignment.title }]}
        actions={
          <>
            {assignment.status !== ASSIGNMENT_CRUD_STATUS.ARCHIVED && (
              <Button variant="secondary" as={Link} to={`/teacher/assignments/${id}/edit`}>
                Edit
              </Button>
            )}
            {assignment.status === ASSIGNMENT_CRUD_STATUS.DRAFT && (
              <Button onClick={handlePublish} loading={actionBusy}>
                Publish
              </Button>
            )}
            {assignment.status === ASSIGNMENT_CRUD_STATUS.PUBLISHED && (
              <Button variant="secondary" onClick={archiveModal.open}>
                Archive
              </Button>
            )}
            {assignment.status === ASSIGNMENT_CRUD_STATUS.DRAFT && (
              <Button variant="danger" onClick={deleteModal.open}>
                Delete
              </Button>
            )}
          </>
        }
      />

      {overdue && (
        <Alert variant="danger" title="This assignment is overdue" className="ui-field">
          The due date has passed and some students may not have finished.
        </Alert>
      )}

      <Card title="Assignment info" className="ui-field">
        {/* Two to a row even on a phone, so the facts read as a grid, not a long list. */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div>
            <span className="ui-hint">Status</span>
            <div>
              <StatusBadge status={assignment.status} />
            </div>
          </div>
          <div>
            <span className="ui-hint">Academic year</span>
            <div>{assignment.academicYear?.name || '—'}</div>
          </div>
          <div>
            <span className="ui-hint">Task type</span>
            <div>{assignment.taskType?.name || '—'}</div>
          </div>
          <div>
            <span className="ui-hint">Topic</span>
            <div>{assignment.topic?.name || '—'}</div>
          </div>
          <div>
            <span className="ui-hint">Start date</span>
            <div>{assignment.startDate ? formatDate(assignment.startDate) : '—'}</div>
          </div>
          <div>
            <span className="ui-hint">Due date</span>
            <div>{assignment.dueDate ? formatDate(assignment.dueDate) : '—'}</div>
          </div>
          <div>
            <span className="ui-hint">Estimated time</span>
            <div>{assignment.estimatedMinutes ? `${assignment.estimatedMinutes} min` : '—'}</div>
          </div>
          <div>
            <span className="ui-hint">Created by</span>
            <div>{formatName(assignment.createdBy)}</div>
          </div>
          <div>
            <span className="ui-hint">Created</span>
            <div>{formatDateTime(assignment.createdAt)}</div>
          </div>
        </div>

        {assignment.description && (
          <>
            <p className="ui-statcard__label" style={{ marginTop: 'var(--spacing-md)' }}>
              Description
            </p>
            <p style={{ whiteSpace: 'pre-wrap' }}>{assignment.description}</p>
          </>
        )}

        <p className="ui-statcard__label" style={{ marginTop: 'var(--spacing-md)' }}>
          Completion
        </p>
        <ProgressBar value={completed} max={total || 1} showValue label={`${completed}/${total} students completed`} />
      </Card>

      {assignment.questions?.length > 0 && (
        <Card
          title={`Questions (${assignment.questions.length})`}
          subtitle="Multiple choice is marked automatically when a student submits; you mark written answers when reviewing."
          className="ui-field"
        >
          <QuestionsPreview questions={assignment.questions} />
        </Card>
      )}

      <TeacherPlanCard assignmentId={assignment.id} archived={assignment.status === ASSIGNMENT_CRUD_STATUS.ARCHIVED} />

      {assignment.backgroundAudio && (
        <Card title="Background audio" subtitle="Plays automatically when a student opens this task." className="ui-field">
          <AudioPlayer src={assignment.backgroundAudio.url} title={assignment.backgroundAudio.name} />
        </Card>
      )}

      <Card title="Resources" subtitle="Files attached to this assignment for students to use." className="ui-field">
        {assignment.files?.length > 0 ? (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {assignment.files.map((f) => (
              <li key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>
                  📄{' '}
                  <a href={f.url} target="_blank" rel="noopener noreferrer">
                    {f.originalFilename}
                  </a>{' '}
                  <span className="ui-hint">({formatFileSize(f.fileSize)})</span>
                </span>
                {assignment.status !== ASSIGNMENT_CRUD_STATUS.ARCHIVED && (
                  <Button size="sm" variant="secondary" onClick={() => handleRemoveFile(f.id)}>
                    Remove
                  </Button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon="📎" title="No resources attached" description="Upload files below for students to reference." />
        )}

        {assignment.status !== ASSIGNMENT_CRUD_STATUS.ARCHIVED && (
          <div className="ui-field" style={{ marginTop: 'var(--spacing-md)' }}>
            <FileUpload
              label="Add resources"
              multiple
              files={upload.files}
              onSelect={upload.select}
              onRemove={upload.removeAt}
              maxSizeLabel="10 MB"
            />
            {upload.hasFiles && (
              <Button size="sm" onClick={handleUpload} loading={upload.isUploading}>
                Upload
              </Button>
            )}
          </div>
        )}
      </Card>

      <SectionHeader
        title="Recipients"
        description="Every student assigned this work and their progress."
        className="ui-field"
      />
      {assignment.recipients?.length > 0 ? (
        <Table columns={recipientColumns} data={assignment.recipients} rowKey="id" />
      ) : (
        <EmptyState icon="🧑‍🎓" title="No students assigned" description="Edit this assignment to add students." />
      )}

      <ReviewSubmissionModal
        isOpen={reviewModal.isOpen}
        recipient={reviewModal.payload}
        questions={assignment.questions ?? []}
        onClose={reviewModal.close}
        onReviewed={handleReviewed}
      />

      <ConfirmationModal
        isOpen={archiveModal.isOpen}
        onClose={archiveModal.close}
        onConfirm={handleArchive}
        title="Archive this assignment?"
        message="Archived assignments can no longer be edited or published, but stay visible for reference."
        confirmLabel="Archive"
        variant="danger"
        loading={actionBusy}
      />

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={handleDelete}
        title="Delete this draft?"
        message={`"${assignment.title}" will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={actionBusy}
      />

      <Toast />
    </div>
  );
}
