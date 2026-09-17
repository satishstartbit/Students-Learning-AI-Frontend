import { LuArrowDown, LuArrowUp, LuPlus, LuTrash2, LuX } from 'react-icons/lu';
import { Button, Card, Checkbox, IconButton, Input, Radio } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import PicturePicker from '../media/PicturePicker';
import curriculumService from '../services/curriculum.service';
import PairsEditor from './PairsEditor';
import PassageEditor from './PassageEditor';
import { MAX_OPTIONS, MAX_QUESTIONS, MIN_OPTIONS, MIN_PAIRS, newOption, newPair, newQuestion } from './questionDrafts';

/** Switching a question's type needs that type's fields seeded, or e.g. a fresh Matching question starts with 0 pairs. */
function defaultsForType(answerType, current) {
  if (answerType === 'matching' && current.pairs.length === 0) {
    return { pairs: Array.from({ length: MIN_PAIRS }, newPair) };
  }
  if ((answerType === 'mcq' || answerType === 'passage_mcq') && current.options.length === 0) {
    return { options: [newOption(), newOption()] };
  }
  return {};
}

// Shown while the admin-managed Question Types master hasn't loaded yet (or has none active) -
// keyed by `code` so a live-fetched label/description always wins once it arrives.
const FALLBACK_TYPES = [
  { code: 'mcq', name: 'Quiz (Multiple Choice)', description: 'Marked automatically when the student submits.' },
  { code: 'free_text', name: 'Description (Written Answer)', description: 'You mark it when you review the submission.' },
  { code: 'matching', name: 'Matching', description: 'Match left items to right items. Marked automatically, with partial credit.' },
  { code: 'passage_mcq', name: 'Passage', description: 'A reading passage, then multiple choice. Marked automatically.' },
];

function useAnswerTypeOptions() {
  const { data } = useApi(curriculumService.listQuestionTypes, { immediate: true });
  const byCode = new Map((data ?? []).map((t) => [t.code, t]));
  return FALLBACK_TYPES.map((fallback) => {
    const live = byCode.get(fallback.code);
    return { value: fallback.code, label: live?.name ?? fallback.name, description: live?.description ?? fallback.description };
  });
}

function OptionsEditor({ question, update, disabled, errors }) {
  const setOption = (id, patch) => update({ options: question.options.map((o) => (o.id === id ? { ...o, ...patch } : o)) });
  const removeOption = (id) =>
    update({
      options: question.options.filter((o) => o.id !== id),
      correctOptionId: question.correctOptionId === id ? '' : question.correctOptionId,
    });

  return (
    <fieldset className="ui-field" style={{ border: 0, padding: 0, margin: '0 0 var(--spacing-md)' }}>
      <legend className="ui-label">Answer options - select the correct one</legend>
      <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
        {question.options.map((option, index) => (
          <div key={option.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-sm)' }}>
            {/* .ui-choice supplies the control's colours and the 48px hit area. */}
            <label className={`ui-choice ${disabled ? 'ui-choice--disabled' : ''}`.trim()} title="Mark as the correct answer" style={{ flexShrink: 0, paddingTop: 6 }}>
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
            <div style={{ flex: '1 1 14rem', minWidth: 0 }}>
              <Input
                aria-label={`Option ${index + 1}`}
                placeholder={index === 0 ? 'e.g. Apple' : `Option ${index + 1}`}
                value={option.text}
                maxLength={200}
                disabled={disabled}
                onChange={(e) => setOption(option.id, { text: e.target.value })}
                reserveHelper={false}
                fieldClassName="ui-field--compact"
              />
              <PicturePicker compact value={option.image} onChange={(image) => setOption(option.id, { image })} disabled={disabled} />
            </div>
            {question.options.length > MIN_OPTIONS && (
              <IconButton label={`Remove option ${index + 1}`} variant="danger" size="sm" onClick={() => removeOption(option.id)} disabled={disabled}>
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
 * Builds a task's questions: each has an optional picture, a prompt, a
 * points value and whether it's required, plus one of 4 answer shapes -
 * multiple choice, written answer, matching, or a reading passage with
 * multiple choice. Entirely optional - an empty list means a plain task.
 *
 * `questions` are drafts (see questionDrafts.js); `errors` comes from
 * validateQuestions. `locked` = a student has started, so no edits.
 */
export default function QuestionBuilder({ questions, onChange, errors = {}, locked = false }) {
  const answerTypeOptions = useAnswerTypeOptions();
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
          No questions yet. Mix quiz, written-answer, matching and passage questions in one task.
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
              label="Question type"
              direction="row"
              value={q.answerType}
              disabled={locked}
              onChange={(e) => update(q.key, { answerType: e.target.value, ...defaultsForType(e.target.value, q) })}
              options={answerTypeOptions}
            />

            <div className="grid gap-4 sm:grid-cols-2 ui-field">
              <Input
                label="Points"
                type="number"
                min="1"
                max="1000"
                value={q.points}
                disabled={locked}
                onChange={(e) => update(q.key, { points: e.target.value })}
                reserveHelper={false}
              />
              <Checkbox
                label="Optional - the student may skip this question"
                checked={q.required === false}
                disabled={locked}
                onChange={(e) => update(q.key, { required: !e.target.checked })}
              />
            </div>

            {q.answerType === 'passage_mcq' && (
              <PassageEditor
                value={q.passage}
                onChange={(passage) => update(q.key, { passage })}
                disabled={locked}
                error={errors[q.key]?.passage}
              />
            )}

            {(q.answerType === 'mcq' || q.answerType === 'passage_mcq') && (
              <OptionsEditor question={q} update={(patch) => update(q.key, patch)} disabled={locked} errors={errors[q.key]} />
            )}

            {q.answerType === 'matching' && (
              <PairsEditor pairs={q.pairs} onChange={(pairs) => update(q.key, { pairs })} disabled={locked} error={errors[q.key]?.pairs} />
            )}

            {q.answerType === 'free_text' && (
              <Input
                label="Teacher notes (optional)"
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
