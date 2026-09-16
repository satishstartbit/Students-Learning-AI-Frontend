import { useId } from 'react';
import { Textarea } from '../../../components/common';
import QuestionPicture from '../media/QuestionPicture';

/**
 * One question as a student sees it: the picture, the question, and big
 * tappable answer choices (or a box to write in). After submitting, `result`
 * shows whether it was right - never which option was correct.
 *
 * answer: { selectedOptionId, textAnswer }
 * result: { isCorrect: true|false|null } once handed in, otherwise undefined
 */
export default function QuestionAnswer({ question, number, answer = {}, onChange, readOnly = false, result, error }) {
  const promptId = useId();

  const choose = (optionId) => {
    if (!readOnly) onChange({ ...answer, selectedOptionId: optionId });
  };

  // Arrow keys move between choices, like a native radio group.
  const onChoiceKeyDown = (event, index) => {
    const delta = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
    if (!delta || readOnly) return;
    event.preventDefault();
    const options = question.options;
    const next = options[(index + delta + options.length) % options.length];
    choose(next.id);
    event.currentTarget.parentElement?.querySelectorAll('[role="radio"]')[(index + delta + options.length) % options.length]?.focus();
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
            </span>
            {question.prompt}
          </h3>

          {question.answerType === 'mcq' ? (
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
                    onClick={() => choose(option.id)}
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
                    }}
                  >
                    {selected ? '● ' : '○ '}
                    {option.text}
                  </button>
                );
              })}
            </div>
          ) : (
            <Textarea
              label="Your answer"
              rows={3}
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
              {result.isCorrect === true && <span style={{ color: 'var(--color-success-fg)' }}>✓ Correct - well done!</span>}
              {result.isCorrect === false && <span style={{ color: 'var(--color-danger-fg)' }}>✗ Not quite this time</span>}
              {result.isCorrect === null && <span className="ui-hint">Your teacher will check this one</span>}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
