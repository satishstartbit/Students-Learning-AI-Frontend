import { useEffect, useState } from 'react';
import { Modal, Button, Textarea, Input, Alert } from '../../../components/common';
import { toast } from '../../../hooks/useToast';
import { getErrorMessage } from '../../../utils/errorHandler';
import { formatFileSize } from '../../../utils/format';
import assignmentService from '../services/assignment.service';

/**
 * Teacher-side review dialog for one recipient's submission.
 *
 * Only ever opened for a `submitted` recipient (the caller gates the trigger
 * button), so there is no need to re-check the submission's status here.
 */
export function ReviewSubmissionModal({ isOpen, recipient, onClose, onReviewed }) {
  const [decision, setDecision] = useState('completed');
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setDecision('completed');
      setScore(recipient?.submission?.score != null ? String(recipient.submission.score) : '');
      setFeedback(recipient?.submission?.feedback ?? '');
      setError(null);
    }
  }, [isOpen, recipient]);

  const submission = recipient?.submission;

  const handleSubmit = async () => {
    if (!submission) return;

    setBusy(true);
    setError(null);
    try {
      await assignmentService.reviewSubmission(submission.id, {
        decision,
        score: score !== '' ? Number(score) : undefined,
        feedback: feedback.trim() || undefined,
      });
      toast.success(
        decision === 'completed' ? 'Submission marked complete' : 'Submission returned to the student'
      );
      onReviewed?.();
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
      title={recipient ? `Review submission - ${recipient.student?.firstName ?? 'Student'}` : 'Review submission'}
      size="lg"
      closeOnOverlayClick={!busy}
      closeOnEscape={!busy}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={busy}>
            {decision === 'completed' ? 'Mark Complete' : 'Return to Student'}
          </Button>
        </>
      }
    >
      {error && (
        <Alert variant="error" className="ui-field">
          {error}
        </Alert>
      )}

      {submission && (
        <>
          <div className="ui-field">
            <p className="ui-statcard__label">Student&apos;s answer</p>
            <p style={{ whiteSpace: 'pre-wrap' }}>{submission.content || 'No written answer submitted.'}</p>
          </div>

          {submission.attachments?.length > 0 && (
            <div className="ui-field">
              <p className="ui-statcard__label">Attachments</p>
              <ul style={{ margin: 0, paddingLeft: 'var(--spacing-lg)' }}>
                {submission.attachments.map((f) => (
                  <li key={f.id}>
                    <a href={f.url} target="_blank" rel="noopener noreferrer">
                      {f.originalFilename}
                    </a>{' '}
                    <span className="ui-hint">({formatFileSize(f.fileSize)})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 ui-field">
            <div>
              <p className="ui-statcard__label">Decision</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  type="button"
                  size="sm"
                  variant={decision === 'completed' ? 'primary' : 'secondary'}
                  onClick={() => setDecision('completed')}
                >
                  Complete
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={decision === 'returned' ? 'primary' : 'secondary'}
                  onClick={() => setDecision('returned')}
                >
                  Return for revision
                </Button>
              </div>
            </div>

            <Input
              label="Score (0-100)"
              type="number"
              min="0"
              max="100"
              value={score}
              onChange={(e) => setScore(e.target.value)}
            />
          </div>

          <Textarea
            label="Feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
            placeholder="Encouraging, specific feedback for the student…"
          />
        </>
      )}
    </Modal>
  );
}

export default ReviewSubmissionModal;
