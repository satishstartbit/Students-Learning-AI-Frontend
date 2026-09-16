import { useId } from 'react';
import { Textarea } from '../../../components/common';
import { useStudentExperience } from '../../student/hooks/useStudentExperience';
import QuestionPicture from '../media/QuestionPicture';
import MatchingQuestionKid from './MatchingQuestionKid';
import MatchingQuestionStandard from './MatchingQuestionStandard';

/** The mcq answer grid, shared by plain multiple choice and passage questions. */
function McqChoices({ question, promptId, answer, onChoose, readOnly }) {
  const onChoiceKeyDown = (event, index) => {
    const delta = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
    if (!delta || readOnly) return;
    event.preventDefault();
    const options = question.options;
    const next = options[(index + delta + options.length) % options.length];
    onChoose(next.id);
    event.currentTarget.parentElement?.querySelectorAll('[role="radio"]')[(index + delta + options.length) % options.length]?.focus();
  };

  return (
    <div role="radiogroup" aria-labelledby={promptId} style={{ display: 'grid', gap: 'var(--spacing-sm)', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
      {question.options.map((option, index) => {
        const selected = answer.selectedOptionId === option.id;
        const focusable = selected || (!answer.selectedOptionId && index === 0);
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-disabled={readOnly || undefined}
            tabIndex={focusable ? 0 : -1}
            onClick={() => onChoose(option.id)}
            onKeyDown={(e) => onChoiceKeyDown(e, index)}
            style={{
              minHeight: 56,
              padding: 'var(--spacing-sm) var(--spacing-md)',
              borderRadius: 'var(--radius-lg)',
              border: `2px solid ${selected ? 'var(--accent-base)' : 'var(--color-border-control, var(--color-border-default))'}`,
              background: selected ? 'var(--accent-soft)' : 'var(--color-bg-surface)',
              color: 'var(--color-text-primary)',
              fontSize: '1.1rem',
              fontWeight: selected ? 700 : 500,
              textAlign: 'left',
              cursor: readOnly ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
            }}
          >
            {option.image ? <QuestionPicture image={option.image} size="sm" /> : null}
            {option.text && (
              <span>
                {selected ? '● ' : '○ '}
                {option.text}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * One question as a student sees it: the picture, the question, and the
 * right answer control for its type. After submitting, `result` shows how
 * it went - never which option/pairing was correct.
 *
 * answer: { selectedOptionId, textAnswer, matchedPairs }
 * result: { isCorrect: true|false|null, partialScore?: number|null } once
 * handed in, otherwise undefined.
 */
export default function QuestionAnswer({ question, number, answer = {}, onChange, readOnly = false, result, error }) {
  const promptId = useId();
  const { isJunior } = useStudentExperience();

  const choose = (optionId) => {
    if (!readOnly) onChange({ ...answer, selectedOptionId: optionId });
  };

  return (
    <section
      aria-labelledby={promptId}
      style={{
        padding: 'var(--spacing-md)',
        borderRadius: 'var(--radius-lg)',
        border: `2px solid ${error ? 'var(--color-danger-border, var(--color-danger-fg))' : 'var(--color-border-default)'}`,
        background: 'var(--color-bg-surface)',
      }}
    >
      <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {question.image && <QuestionPicture image={question.image} size="lg" />}

        <div style={{ flex: '1 1 16rem', minWidth: 0 }}>
          <h3 id={promptId} style={{ margin: '0 0 var(--spacing-sm)', fontSize: 'var(--font-size-xl)', lineHeight: 1.3 }}>
            <span className="ui-hint" style={{ fontSize: '0.9rem', display: 'block' }}>
              Question {number}
              {question.required === false ? ' (optional)' : ''}
            </span>
            {question.prompt}
          </h3>

          {question.answerType === 'passage_mcq' && question.passage && (
            <p
              style={{
                margin: '0 0 var(--spacing-md)',
                padding: 'var(--spacing-sm) var(--spacing-md)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-bg-surface-sunken)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {question.passage}
            </p>
          )}

          {(question.answerType === 'mcq' || question.answerType === 'passage_mcq') && (
            <McqChoices question={question} promptId={promptId} answer={answer} onChoose={choose} readOnly={readOnly} />
          )}

          {question.answerType === 'matching' &&
            (isJunior ? (
              <MatchingQuestionKid question={question} answer={answer} onChange={onChange} readOnly={readOnly} />
            ) : (
              <MatchingQuestionStandard question={question} answer={answer} onChange={onChange} readOnly={readOnly} />
            ))}

          {question.answerType === 'free_text' && (
            <Textarea
              label="Your answer"
              rows={isJunior ? 3 : 6}
              value={answer.textAnswer ?? ''}
              readOnly={readOnly}
              onChange={(e) => onChange({ ...answer, textAnswer: e.target.value })}
              reserveHelper={false}
            />
          )}

          {error && (
            <p className="ui-hint" role="alert" style={{ color: 'var(--color-danger-fg)', marginBottom: 0 }}>
              {error}
            </p>
          )}

          {result && (
            <p role="status" style={{ margin: 'var(--spacing-sm) 0 0', fontWeight: 700, fontSize: '1.05rem' }}>
              {question.answerType === 'matching' ? (
                result.partialScore === null || result.partialScore === undefined ? (
                  <span className="ui-hint">Your teacher will check this one</span>
                ) : (
                  <span style={{ color: result.partialScore === 1 ? 'var(--color-success-fg)' : result.partialScore === 0 ? 'var(--color-danger-fg)' : 'var(--color-text-primary)' }}>
                    {Math.round(result.partialScore * (question.pairs?.length ?? question.leftItems?.length ?? 1))} of{' '}
                    {question.pairs?.length ?? question.leftItems?.length ?? 0} matched correctly
                  </span>
                )
              ) : (
                <>
                  {result.isCorrect === true && <span style={{ color: 'var(--color-success-fg)' }}>✓ Correct - well done!</span>}
                  {result.isCorrect === false && <span style={{ color: 'var(--color-danger-fg)' }}>✗ Not quite this time</span>}
                  {result.isCorrect === null && <span className="ui-hint">Your teacher will check this one</span>}
                </>
              )}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
