import { useState } from 'react';
import '../aiAssistant.css';
import { Alert, Button, Input } from '../../../components/common';
import { getErrorMessage } from '../../../utils/errorHandler';
import * as aiAssistantService from '../services/aiAssistant.service';

const CHOICE_TYPES = new Set(['mcq', 'true_false']);

/**
 * Renders one `practice_question` message: choice buttons or a text answer,
 * a submit step, then correct/incorrect feedback with an optional hint.
 *
 * Owns its own network calls (submit answer / hint) like other self-contained
 * form components in this app, and reports outcomes upward so the session
 * page can update the running progress counts without a full refetch.
 */
export function PracticeQuestionCard({ sessionId, message, disabled = false, onAnswered, onHint }) {
  const { metadata } = message;
  const questionType = metadata?.questionType ?? 'short_answer';
  const isChoiceType = CHOICE_TYPES.has(questionType);
  const choices = metadata?.choices?.length
    ? metadata.choices
    : questionType === 'true_false'
      ? ['True', 'False']
      : [];

  const [selectedChoice, setSelectedChoice] = useState('');
  const [textAnswer, setTextAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { correct, explanation }
  const [submitError, setSubmitError] = useState(null);

  const [hint, setHint] = useState(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [hintError, setHintError] = useState(null);

  const answer = isChoiceType ? selectedChoice : textAnswer;
  const canSubmit = Boolean(answer.trim()) && !disabled && !submitting && !result;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const { data } = await aiAssistantService.submitPracticeAnswer(sessionId, message.id, answer);
      setResult({ correct: data.correct, explanation: data.explanation ?? null });
      onAnswered?.(data);
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleTryAgain = () => {
    setResult(null);
    setSubmitError(null);
    setSelectedChoice('');
    setTextAnswer('');
  };

  const handleHint = async () => {
    setHintLoading(true);
    setHintError(null);
    try {
      const { data } = await aiAssistantService.getHint(sessionId, message.id);
      setHint(data.content);
      onHint?.(data);
    } catch (err) {
      setHintError(getErrorMessage(err));
    } finally {
      setHintLoading(false);
    }
  };

  return (
    <div className="ai-practice-card">
      <p style={{ fontWeight: 600, margin: 0 }}>{message.content}</p>

      {isChoiceType ? (
        <div className="ai-practice-choices">
          {choices.map((choice) => (
            <button
              key={choice}
              type="button"
              className={`ai-practice-choice ${selectedChoice === choice ? 'ai-practice-choice--selected' : ''}`.trim()}
              onClick={() => setSelectedChoice(choice)}
              disabled={disabled || submitting || Boolean(result)}
              aria-pressed={selectedChoice === choice}
            >
              {choice}
            </button>
          ))}
        </div>
      ) : (
        <div style={{ marginTop: 'var(--spacing-md)' }}>
          <Input
            label="Your answer"
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            disabled={disabled || submitting || Boolean(result)}
          />
        </div>
      )}

      {submitError && (
        <Alert variant="error" className="ui-field">
          {submitError}
        </Alert>
      )}

      {!result && (
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
          <Button onClick={handleSubmit} loading={submitting} disabled={!canSubmit}>
            Submit Answer
          </Button>
          <Button variant="secondary" onClick={handleHint} loading={hintLoading} disabled={disabled}>
            Get Hint
          </Button>
        </div>
      )}

      {hintError && (
        <Alert variant="error" className="ui-field">
          {hintError}
        </Alert>
      )}

      {hint && !result && (
        <Alert variant="info" title="Hint" className="ui-field">
          {hint}
        </Alert>
      )}

      {result && (
        <>
          <Alert
            variant={result.correct ? 'success' : 'warning'}
            title={result.correct ? "You got it! 🎉" : "Not quite - give it another go!"}
            className="ui-field"
          >
            {result.correct && result.explanation ? result.explanation : null}
          </Alert>

          {!disabled && (
            <Button variant="secondary" onClick={handleTryAgain}>
              Try Again
            </Button>
          )}
        </>
      )}
    </div>
  );
}

export default PracticeQuestionCard;
