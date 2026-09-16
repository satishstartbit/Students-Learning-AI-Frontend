import { LuArrowDown, LuArrowUp, LuPlus, LuTrash2, LuX } from 'react-icons/lu';
import { Button, Card, IconButton, Input, Radio } from '../../../components/common';
import PicturePicker from '../media/PicturePicker';
import { MAX_OPTIONS, MAX_QUESTIONS, MIN_OPTIONS, newOption, newQuestion } from './questionDrafts';

const ANSWER_TYPE_OPTIONS = [
  { value: 'mcq', label: 'Multiple choice', description: 'Marked automatically when the student submits.' },
  { value: 'free_text', label: 'Written answer', description: 'You mark it when you review the submission.' },
];

function OptionsEditor({ question, update, disabled, errors }) {
  const setOption = (id, text) => update({ options: question.options.map((o) => (o.id === id ? { ...o, text } : o)) });
  const removeOption = (id) =>
    update({
      options: question.options.filter((o) => o.id !== id),
      correctOptionId: question.correctOptionId === id ? '' : question.correctOptionId,
    });

  return (
    <fieldset className="ui-field" style={{ border: 0, padding: 0, margin: '0 0 var(--spacing-md)' }}>
      <legend className="ui-label">Answer options - select the correct one</legend>
      <div style={{ display: 'grid', gap: 'var(--spacing-xs)' }}>
        {question.options.map((option, index) => (
          <div key={option.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            {/* .ui-choice supplies the control's colours and the 48px hit area. */}
            <label className={`ui-choice ${disabled ? 'ui-choice--disabled' : ''}`.trim()} title="Mark as the correct answer" style={{ flexShrink: 0 }}>
              <input
                type="radio"
                className="ui-choice__control"
                name={`correct-${question.key}`}
                checked={question.correctOptionId === option.id}
                onChange={() => update({ correctOptionId: option.id })}
                disabled={disabled}
                aria-label={`Option ${index + 1} is the correct answer`}
              />
            </label>
            <Input
              aria-label={`Option ${index + 1}`}
              placeholder={index === 0 ? 'e.g. Apple' : `Option ${index + 1}`}
              value={option.text}
              maxLength={200}
              disabled={disabled}
              onChange={(e) => setOption(option.id, e.target.value)}
              reserveHelper={false}
              fieldClassName="flex-1"
            />
            {question.options.length > MIN_OPTIONS && (
              <IconButton label={`Remove option ${index + 1}`} size="sm" onClick={() => removeOption(option.id)} disabled={disabled}>
                <LuX aria-hidden="true" />
              </IconButton>
            )}
          </div>
        ))}
      </div>
      {question.options.length < MAX_OPTIONS && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          startIcon={<LuPlus />}
          disabled={disabled}
          onClick={() => update({ options: [...question.options, newOption()] })}
          style={{ marginTop: 'var(--spacing-xs)', alignSelf: 'flex-start' }}
        >
          Add option
        </Button>
      )}
      {(errors?.options || errors?.correct) && (
        <p className="ui-hint" role="alert" style={{ color: 'var(--color-danger-fg)', marginBottom: 0 }}>
          {errors.options || errors.correct}
        </p>
      )}
    </fieldset>
  );
}

/**
 * Builds a task's picture/quiz questions: each has an optional picture (upload,
 * emoji, GIF or sticker), a prompt, and either 2-4 multiple-choice options with
 * one marked correct or a written answer. Entirely optional - an empty list
 * means a plain task.
 *
 * `questions` are drafts (see questionDrafts.js); `errors` comes from
 * validateQuestions. `locked` = a student has started, so no edits.
 */
export default function QuestionBuilder({ questions, onChange, errors = {}, locked = false }) {
  const update = (key, patch) => onChange(questions.map((q) => (q.key === key ? { ...q, ...patch } : q)));
  const move = (index, delta) => {
    const next = [...questions];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    onChange(next);
  };

  return (
    <div>
      {questions.length === 0 && (
        <p className="ui-hint" style={{ marginTop: 0 }}>
          No questions yet. Add picture questions like &quot;What is this?&quot; - great for younger grades.
        </p>
      )}

      <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
        {questions.map((q, index) => (
          <Card key={q.key} flat aria-label={`Question ${index + 1}`}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
              <strong>Question {index + 1}</strong>
              <div style={{ display: 'flex', gap: 4 }}>
                <IconButton label="Move question up" size="sm" onClick={() => move(index, -1)} disabled={locked || index === 0}>
                  <LuArrowUp aria-hidden="true" />
                </IconButton>
                <IconButton label="Move question down" size="sm" onClick={() => move(index, 1)} disabled={locked || index === questions.length - 1}>
                  <LuArrowDown aria-hidden="true" />
                </IconButton>
                <IconButton
                  label={`Remove question ${index + 1}`}
                  size="sm"
                  variant="danger"
                  onClick={() => onChange(questions.filter((item) => item.key !== q.key))}
                  disabled={locked}
                >
                  <LuTrash2 aria-hidden="true" />
                </IconButton>
              </div>
            </div>

            <PicturePicker value={q.image} onChange={(image) => update(q.key, { image })} disabled={locked} />

            <Input
              label="Question"
              required
              placeholder="What is this?"
              value={q.prompt}
              maxLength={1000}
              disabled={locked}
              error={errors[q.key]?.prompt}
              onChange={(e) => update(q.key, { prompt: e.target.value })}
            />

            <Radio
              name={`answer-type-${q.key}`}
              label="How the student answers"
              direction="row"
              value={q.answerType}
              disabled={locked}
              onChange={(e) => update(q.key, { answerType: e.target.value })}
              options={ANSWER_TYPE_OPTIONS}
            />

            {q.answerType === 'mcq' ? (
              <OptionsEditor question={q} update={(patch) => update(q.key, patch)} disabled={locked} errors={errors[q.key]} />
            ) : (
              <Input
                label="Expected answer (optional)"
                hint="Only you see this, as a reminder when marking."
                value={q.expectedAnswer}
                maxLength={1000}
                disabled={locked}
                onChange={(e) => update(q.key, { expectedAnswer: e.target.value })}
              />
            )}
          </Card>
        ))}
      </div>

      <Button
        type="button"
        variant="secondary"
        startIcon={<LuPlus />}
        disabled={locked || questions.length >= MAX_QUESTIONS}
        onClick={() => onChange([...questions, newQuestion()])}
        style={{ marginTop: 'var(--spacing-md)' }}
      >
        Add question
      </Button>
    </div>
  );
}
