import { useMemo, useState } from 'react';
import { Modal, Button, Textarea, Input, Alert, Badge } from '../../../components/common';
import { toast } from '../../../hooks/useToast';
import { getErrorMessage } from '../../../utils/errorHandler';
import { formatFileSize } from '../../../utils/format';
import assignmentService from '../services/assignment.service';
import QuestionPicture from '../media/QuestionPicture';

const MCQ_LIKE = ['mcq', 'passage_mcq'];

/** Whether an answer counts as "answered" for a question's type - mirrors the backend's isEntryAnswered(). */
const isAnsweredEntry = (question, answer) => {
  if (MCQ_LIKE.includes(question.answerType)) return Boolean(answer?.selectedOptionId);
  if (question.answerType === 'matching') return Boolean(answer?.matchedPairs?.length);
  return Boolean(answer?.textAnswer?.trim());
};

/** Per-question answer review: mcq/passage/matching already marked, written answers marked here. */
function AnswersReview({ questions, answersByQuestion, grades, setGrade, disabled }) {
  return (
    <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 'var(--spacing-md)' }}>
      {questions.map((q, index) => {
        const answer = answersByQuestion.get(q.id);
        const grade = grades[q.id];
        const isMcqLike = MCQ_LIKE.includes(q.answerType);
        const chosen = isMcqLike ? q.options.find((o) => o.id === answer?.selectedOptionId) : null;
        const correctOption = isMcqLike ? q.options.find((o) => o.id === q.correctOptionId) : null;

        return (
          <li
            key={q.id}
            style={{
              display: 'flex',
              gap: 'var(--spacing-md)',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              paddingBottom: 'var(--spacing-md)',
              borderBottom: '1px solid var(--color-border-default)',
            }}
          >
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

              {isMcqLike && (
                <div style={{ marginTop: 4 }}>
                  <span>{chosen ? chosen.text ?? 'Picture answer' : <em>Not answered</em>}</span>{' '}
                  {answer?.isCorrect === true && <Badge variant="success">Correct</Badge>}
                  {answer?.isCorrect === false && <Badge variant="danger">Incorrect</Badge>}
                  {answer?.isCorrect === false && correctOption && <div className="ui-hint">Correct answer: {correctOption.text ?? 'picture answer'}</div>}
                </div>
              )}

              {q.answerType === 'matching' && (
                <div style={{ marginTop: 4 }}>
                  {!answer?.matchedPairs?.length ? (
                    <em>Not answered</em>
                  ) : (
                    <ul style={{ margin: 0, paddingLeft: 'var(--spacing-lg)' }}>
                      {q.pairs.map((pair) => {
                        const submitted = answer.matchedPairs.find((m) => m.leftId === pair.left.id);
                        const submittedRight = submitted ? q.pairs.find((p) => p.right.id === submitted.rightId)?.right : null;
                        const isRight = submitted?.rightId === pair.right.id;
                        return (
                          <li key={pair.id}>
                            {pair.left.text ?? 'Picture'} → {submittedRight ? submittedRight.text ?? 'picture' : <em>not matched</em>}{' '}
                            {submitted && (isRight ? <Badge variant="success">Correct</Badge> : <Badge variant="danger">Incorrect</Badge>)}
                            {!isRight && <span className="ui-hint"> (correct: {pair.right.text ?? 'picture'})</span>}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {answer?.partialScore !== null && answer?.partialScore !== undefined && (
                    <div className="ui-hint">
                      {Math.round(answer.partialScore * q.pairs.length)} of {q.pairs.length} pairs matched correctly
                    </div>
                  )}
                </div>
              )}

              {q.answerType === 'free_text' && (
                <div style={{ marginTop: 4 }}>
                  <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{answer?.textAnswer || <em>Not answered</em>}</p>
                  {q.expectedAnswer && <div className="ui-hint">You expected: {q.expectedAnswer}</div>}
                  {answer?.textAnswer && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }} role="group" aria-label={`Mark question ${index + 1}`}>
                      <Button type="button" size="sm" variant={grade === true ? 'primary' : 'secondary'} aria-pressed={grade === true} disabled={disabled} onClick={() => setGrade(q.id, true)}>
                        Correct
                      </Button>
                      <Button type="button" size="sm" variant={grade === false ? 'primary' : 'secondary'} aria-pressed={grade === false} disabled={disabled} onClick={() => setGrade(q.id, false)}>
                        Incorrect
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function ReviewDialog({ recipient, questions, onClose, onReviewed }) {
  const submission = recipient.submission;
  const answersByQuestion = useMemo(() => new Map((submission?.answers ?? []).map((a) => [a.questionId, a])), [submission]);

  // Written answers the teacher has marked (or marked earlier, before a return).
  const [grades, setGrades] = useState(() =>
    Object.fromEntries(
      questions
        .filter((q) => q.answerType === 'free_text' && typeof answersByQuestion.get(q.id)?.isCorrect === 'boolean')
        .map((q) => [q.id, answersByQuestion.get(q.id).isCorrect])
    )
  );

  /**
   * Points-weighted percent, previewing the teacher's in-progress written-answer
   * toggles before they're saved (so this can't just reuse the backend's stored
   * `summarize()` result - free_text grades live only in local `grades` state
   * here until Save). A skippable question left unanswered is excluded, same
   * as the backend's own scoring rule.
   */
  const quizPercent = useMemo(() => {
    if (!questions.length) return null;
    let earned = 0;
    let possible = 0;
    for (const q of questions) {
      const answer = answersByQuestion.get(q.id);
      const answeredThis = isAnsweredEntry(q, answer);
      if (!answeredThis && q.required === false) continue;

      const points = q.points ?? 1;
      possible += points;
      if (MCQ_LIKE.includes(q.answerType)) {
        if (answer?.isCorrect === true) earned += points;
      } else if (q.answerType === 'matching') {
        earned += (answer?.partialScore ?? 0) * points;
      } else if (grades[q.id] === true) {
        earned += points;
      }
    }
    return possible > 0 ? Math.round((earned / possible) * 100) : null;
  }, [questions, answersByQuestion, grades]);

  const [decision, setDecision] = useState('completed');
  const [score, setScore] = useState(() => {
    if (submission?.score != null) return String(submission.score);
    return quizPercent !== null ? String(quizPercent) : '';
  });
  const [feedback, setFeedback] = useState(submission?.feedback ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const unmarked = questions.filter((q) => q.answerType === 'free_text' && answersByQuestion.get(q.id)?.textAnswer && grades[q.id] === undefined).length;

  const handleSubmit = async () => {
    if (!submission) return;
    setBusy(true);
    setError(null);
    try {
      await assignmentService.reviewSubmission(submission.id, {
        decision,
        score: score !== '' ? Number(score) : undefined,
        feedback: feedback.trim() || undefined,
        answerGrades: Object.entries(grades).map(([questionId, isCorrect]) => ({ questionId, isCorrect })),
      });
      toast.success(decision === 'completed' ? 'Submission marked complete' : 'Submission returned to the student');
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
      isOpen
      onClose={onClose}
      title={`Review submission - ${recipient.student?.firstName ?? 'Student'}`}
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
          {questions.length > 0 && (
            <div className="ui-field">
              <p className="ui-statcard__label">
                Quiz answers
                {submission.quiz && ` - ${submission.quiz.correct}/${submission.quiz.totalQuestions} marked correct automatically`}
              </p>
              <AnswersReview
                questions={questions}
                answersByQuestion={answersByQuestion}
                grades={grades}
                setGrade={(questionId, value) => setGrades((g) => ({ ...g, [questionId]: value }))}
                disabled={busy}
              />
              {unmarked > 0 && (
                <p className="ui-hint" style={{ marginBottom: 0 }}>
                  {unmarked} written {unmarked === 1 ? 'answer is' : 'answers are'} not marked yet.
                </p>
              )}
            </div>
          )}

          {(submission.content || questions.length === 0) && (
            <div className="ui-field">
              <p className="ui-statcard__label">Student&apos;s answer</p>
              <p style={{ whiteSpace: 'pre-wrap' }}>{submission.content || 'No written answer submitted.'}</p>
            </div>
          )}

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
                <Button type="button" size="sm" variant={decision === 'completed' ? 'primary' : 'secondary'} onClick={() => setDecision('completed')}>
                  Complete
                </Button>
                <Button type="button" size="sm" variant={decision === 'returned' ? 'primary' : 'secondary'} onClick={() => setDecision('returned')}>
                  Return for revision
                </Button>
              </div>
            </div>

            <div>
              <Input label="Score (0-100)" type="number" min="0" max="100" value={score} onChange={(e) => setScore(e.target.value)} reserveHelper={false} />
              {quizPercent !== null && String(quizPercent) !== score && (
                <Button type="button" size="sm" variant="ghost" onClick={() => setScore(String(quizPercent))}>
                  Use quiz score ({quizPercent})
                </Button>
              )}
            </div>
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

/**
 * Teacher-side review dialog for one recipient's submission. Only opened for
 * a `submitted` recipient (the caller gates the trigger button). The dialog
 * body mounts fresh for each opening, so its fields always start from that
 * submission.
 */
export function ReviewSubmissionModal({ isOpen, recipient, questions = [], onClose, onReviewed }) {
  if (!isOpen || !recipient) return null;
  return <ReviewDialog key={recipient.id} recipient={recipient} questions={questions} onClose={onClose} onReviewed={onReviewed} />;
}

export default ReviewSubmissionModal;
