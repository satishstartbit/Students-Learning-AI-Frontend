import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  PageHeader,
  Card,
  Textarea,
  Button,
  Alert,
  Badge,
  StatusBadge,
  ConfirmationModal,
  FileUpload,
  Loader,
  ErrorState,
  Toast,
} from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { useModal } from '../../../hooks/useModal';
import { useFileUpload } from '../../../hooks/useFileUpload';
import { toast } from '../../../hooks/useToast';
import { getErrorMessage } from '../../../utils/errorHandler';
import { formatDateTime, formatDuration, formatDueDate, isOverdue } from '../../../utils/date';
import { formatFileSize } from '../../../utils/format';
import { ASSIGNMENT_RECIPIENT_STATUS } from '../../../utils/constants';
import { DOCUMENT_MIME_TYPES, IMAGE_MIME_TYPES } from '../../../utils/file';
import assignmentService from '../../assignments/services/assignment.service';

/**
 * Student-facing assignment page. Kept simple and encouraging - this is used
 * by young students, so language stays plain and buttons stay big and clear.
 */
export default function AssignmentDetailPage() {
  const { assignmentId } = useParams();

  const detail = useApi(assignmentService.getAssignment);
  const { run } = detail;
  const load = useCallback(() => run(assignmentId), [run, assignmentId]);
  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const item = detail.data;

  const [content, setContent] = useState('');
  const [starting, setStarting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submitModal = useModal();

  useEffect(() => {
    if (item?.submission?.content !== undefined) setContent(item.submission.content ?? '');
  }, [item?.submission?.content]);

  const upload = useFileUpload({
    multiple: true,
    maxFiles: 10,
    allowedMimeTypes: [...IMAGE_MIME_TYPES, ...DOCUMENT_MIME_TYPES],
    fieldName: 'files',
    uploadFn: (formData, opts) => assignmentService.addAssignmentFiles(assignmentId, formData, opts),
  });

  const handleUploadAttachment = async () => {
    try {
      await upload.upload();
      toast.success('File attached');
      upload.clear();
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleStart = async () => {
    setStarting(true);
    try {
      await assignmentService.startAssignment(assignmentId);
      toast.success("You've started this assignment. Good luck!");
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setStarting(false);
    }
  };

  const handleSaveProgress = async () => {
    setSaving(true);
    try {
      await assignmentService.saveAssignmentProgress(assignmentId, { content });
      toast.success('Progress saved');
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await assignmentService.submitAssignment(assignmentId, { content });
      toast.success('Great work! Your assignment has been submitted.');
      submitModal.close();
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (detail.isLoading && !item) return <Loader message="Loading your assignment…" />;
  if (detail.error) return <ErrorState error={detail.error} onRetry={load} />;
  if (!item) return null;

  const a = item.assignment;
  const overdue = ['assigned', 'in_progress'].includes(item.status) && a.dueDate && isOverdue(a.dueDate);
  const canEdit =
    item.status === ASSIGNMENT_RECIPIENT_STATUS.IN_PROGRESS || item.status === ASSIGNMENT_RECIPIENT_STATUS.RETURNED;

  return (
    <>
      <PageHeader
        title={a.title}
        description={`${a.subject || 'No subject'} · ${a.grade || 'No grade'}`}
        breadcrumbs={[{ label: 'Assignments', to: '/student/assignments' }, { label: a.title }]}
      />

      {overdue && (
        <Alert variant="danger" title="This one is overdue" className="ui-field">
          Try to finish it as soon as you can, or ask your teacher for help.
        </Alert>
      )}

      <Card className="ui-field">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <span className="ui-hint">Due</span>
            <div style={{ fontWeight: 600 }}>{formatDueDate(a.dueDate)}</div>
          </div>
          <div>
            <span className="ui-hint">Estimated time</span>
            <div>{a.estimatedMinutes ? formatDuration(a.estimatedMinutes) : '—'}</div>
          </div>
          <div>
            <span className="ui-hint">Status</span>
            <div>
              <StatusBadge status={overdue ? 'overdue' : item.status} label={overdue ? 'Overdue' : undefined} />
            </div>
          </div>
        </div>

        {a.description && (
          <>
            <p className="ui-statcard__label" style={{ marginTop: 'var(--spacing-md)' }}>
              Instructions
            </p>
            <p style={{ whiteSpace: 'pre-wrap' }}>{a.description}</p>
          </>
        )}

        {a.files?.length > 0 && (
          <>
            <p className="ui-statcard__label" style={{ marginTop: 'var(--spacing-md)' }}>
              Resources
            </p>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {a.files.map((f) => (
                <li key={f.id}>
                  <a href={f.url} target="_blank" rel="noopener noreferrer">
                    📎 {f.originalFilename}
                  </a>{' '}
                  <span className="ui-hint">({formatFileSize(f.fileSize)})</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      {item.status === ASSIGNMENT_RECIPIENT_STATUS.ASSIGNED && (
        <Card className="ui-field">
          <p>Ready to give this a try?</p>
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
          <Textarea
            label="Write your answer here"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
          />

          <FileUpload
            label="Attach a file (optional)"
            multiple
            files={upload.files}
            onSelect={upload.select}
            onRemove={upload.removeAt}
            maxSizeLabel="10 MB"
          />
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
            <Button onClick={submitModal.open}>Submit</Button>
          </div>
        </Card>
      )}

      {item.status === ASSIGNMENT_RECIPIENT_STATUS.SUBMITTED && (
        <Card className="ui-field">
          <Badge variant="warning" dot>
            Submitted, waiting for your teacher to review
          </Badge>
          <p className="ui-hint" style={{ marginTop: 8 }}>
            Submitted {item.submission?.submittedAt ? formatDateTime(item.submission.submittedAt) : ''}
          </p>
          {item.submission?.content && (
            <p style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{item.submission.content}</p>
          )}
        </Card>
      )}

      {(item.status === ASSIGNMENT_RECIPIENT_STATUS.REVIEWED ||
        item.status === ASSIGNMENT_RECIPIENT_STATUS.COMPLETED) && (
        <Card className="ui-field">
          <Alert variant="success" title="Great job! Your teacher reviewed your work. 🎉">
            {item.submission?.score != null && (
              <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: '8px 0' }}>
                Score: {item.submission.score}/100
              </p>
            )}
            {item.submission?.feedback && <p style={{ margin: 0 }}>{item.submission.feedback}</p>}
          </Alert>
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

      <Toast />
    </>
  );
}
