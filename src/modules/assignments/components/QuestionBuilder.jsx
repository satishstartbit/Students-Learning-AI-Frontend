import { DragDropProvider } from '@dnd-kit/react';
import { isSortable, useSortable } from '@dnd-kit/react/sortable';
import { LuArrowDown, LuArrowUp, LuGripVertical, LuPlus, LuTrash2, LuX } from 'react-icons/lu';
import { Button, Checkbox, Input, Textarea } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import PicturePicker from '../media/PicturePicker';
import curriculumService from '../services/curriculum.service';
import PairsEditor from './PairsEditor';
import PassageEditor from './PassageEditor';
import { MAX_OPTIONS, MAX_QUESTIONS, MIN_OPTIONS, MIN_PAIRS, newOption, newPair, newQuestion } from './questionDrafts';
import './assignmentForm.css';

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

// Short pill labels (the mockup's), and the line under the pills. The line
// comes from the admin-managed Question Types master when it has one.
const TYPES = [
  { code: 'mcq', label: 'Multiple choice', hint: 'Pick the correct answer. Marked automatically.' },
  { code: 'free_text', label: 'Written answer', hint: 'Students type an answer. You mark it when reviewing.' },
  { code: 'matching', label: 'Matching', hint: 'Students match each left item to its right item. Marked automatically.' },
  { code: 'passage_mcq', label: 'Passage', hint: 'Students read a passage, then pick an answer. Marked automatically.' },
];

function useAnswerTypes() {
  const { data } = useApi(curriculumService.listQuestionTypes, { immediate: true });
  const byCode = new Map((data ?? []).map((t) => [t.code, t]));
  return TYPES.map((t) => ({ ...t, hint: byCode.get(t.code)?.description || t.hint, title: byCode.get(t.code)?.name }));
}

function TypePills({ question, types, disabled, onPick }) {
  const current = types.find((t) => t.code === question.answerType);
  return (
    <fieldset className="af-types">
      <legend className="af-types__label">Question type</legend>
      <div className="af-types__row">
        {types.map((t) => (
          <label key={t.code} className="af-type" title={t.title}>
            <input
              type="radio"
              name={`answer-type-${question.key}`}
              value={t.code}
              checked={question.answerType === t.code}
              disabled={disabled}
              onChange={() => onPick(t.code)}
            />
            <span>{t.label}</span>
          </label>
        ))}
      </div>
      {current && <p className="af-types__hint">{current.hint}</p>}
    </fieldset>
  );
}

function OptionsEditor({ question, update, disabled, errors }) {
  const setOption = (id, patch) => update({ options: question.options.map((o) => (o.id === id ? { ...o, ...patch } : o)) });
  const removeOption = (id) =>
    update({
      options: question.options.filter((o) => o.id !== id),
      correctOptionId: question.correctOptionId === id ? '' : question.correctOptionId,
    });

  return (
    <fieldset className="af-options">
      <legend>Answer options · select the correct one</legend>
      <div className="af-options__list">
        {question.options.map((option, index) => (
          <div key={option.id} className="af-option">
            <input
              type="radio"
              className="af-option__radio"
              name={`correct-${question.key}`}
              checked={question.correctOptionId === option.id}
              onChange={() => update({ correctOptionId: option.id })}
              disabled={disabled}
              aria-label={`Option ${index + 1} is the correct answer`}
              title="Mark as the correct answer"
            />
            <div className="af-option__text">
              <Input
                aria-label={`Option ${index + 1}`}
                placeholder={`Option ${index + 1}`}
                value={option.text}
                maxLength={200}
                disabled={disabled}
                onChange={(e) => setOption(option.id, { text: e.target.value })}
                reserveHelper={false}
                fieldClassName="ui-field--compact"
              />
            </div>
            <PicturePicker compact value={option.image} onChange={(image) => setOption(option.id, { image })} disabled={disabled} />
            <button
              type="button"
              className="af-icon-btn af-icon-btn--danger"
              aria-label={`Remove option ${index + 1}`}
              title="Remove option"
              onClick={() => removeOption(option.id)}
              disabled={disabled || question.options.length <= MIN_OPTIONS}
            >
              <LuX size={16} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
      {question.options.length < MAX_OPTIONS && (
        <button type="button" className="af-add-link" disabled={disabled} onClick={() => update({ options: [...question.options, newOption()] })}>
          <LuPlus size={14} aria-hidden="true" /> Add option
        </button>
      )}
      {(errors?.options || errors?.correct) && (
        <p className="af-error" role="alert">
          {errors.options || errors.correct}
        </p>
      )}
    </fieldset>
  );
}

function QuestionCard({ q, index, count, types, errors, locked, update, move, remove }) {
  const { ref, handleRef, isDragging } = useSortable({ id: q.key, index, disabled: locked });
  const qErrors = errors[q.key];

  return (
    <article
      ref={ref}
      className={['af-question', isDragging && 'af-question--dragging', qErrors && 'af-question--error'].filter(Boolean).join(' ')}
      aria-label={`Question ${index + 1}`}
    >
      <div className="af-question__head">
        <button ref={handleRef} type="button" className="af-question__handle" aria-label={`Drag to reorder question ${index + 1}`} disabled={locked}>
          <LuGripVertical size={16} aria-hidden="true" />
        </button>
        <h3 className="af-question__title">Question {index + 1}</h3>
        <button type="button" className="af-icon-btn" aria-label="Move question up" onClick={() => move(index, -1)} disabled={locked || index === 0}>
          <LuArrowUp size={16} aria-hidden="true" />
        </button>
        <button type="button" className="af-icon-btn" aria-label="Move question down" onClick={() => move(index, 1)} disabled={locked || index === count - 1}>
          <LuArrowDown size={16} aria-hidden="true" />
        </button>
        <button type="button" className="af-icon-btn af-icon-btn--danger" aria-label={`Remove question ${index + 1}`} onClick={remove} disabled={locked}>
          <LuTrash2 size={16} aria-hidden="true" />
        </button>
      </div>

      <PicturePicker value={q.image} onChange={(image) => update({ image })} disabled={locked} />

      <Input
        label="Question"
        required
        placeholder="What is this?"
        value={q.prompt}
        maxLength={1000}
        disabled={locked}
        error={qErrors?.prompt}
        onChange={(e) => update({ prompt: e.target.value })}
      />

      <TypePills question={q} types={types} disabled={locked} onPick={(code) => update({ answerType: code, ...defaultsForType(code, q) })} />

      {q.answerType === 'passage_mcq' && (
        <PassageEditor value={q.passage} onChange={(passage) => update({ passage })} disabled={locked} error={qErrors?.passage} />
      )}

      {(q.answerType === 'mcq' || q.answerType === 'passage_mcq') && (
        <OptionsEditor question={q} update={update} disabled={locked} errors={qErrors} />
      )}

      {q.answerType === 'matching' && (
        <PairsEditor pairs={q.pairs} onChange={(pairs) => update({ pairs })} disabled={locked} error={qErrors?.pairs} />
      )}

      {q.answerType === 'free_text' && (
        <Textarea
          label="Model answer (optional)"
          hint="Only you see this. Use it as a guide when marking."
          value={q.expectedAnswer}
          maxLength={1000}
          rows={3}
          disabled={locked}
          onChange={(e) => update({ expectedAnswer: e.target.value })}
        />
      )}

      <div className="af-points">
        <Input
          label="Points"
          type="number"
          min="1"
          max="1000"
          value={q.points}
          disabled={locked}
          onChange={(e) => update({ points: e.target.value })}
          reserveHelper={false}
        />
        <Checkbox
          label="Optional question"
          checked={q.required === false}
          disabled={locked}
          onChange={(e) => update({ required: !e.target.checked })}
          title="The student may skip this question"
        />
      </div>
    </article>
  );
}

/**
 * Builds a task's questions: each has an optional picture, a prompt, a
 * points value and whether it's optional, plus one of 4 answer shapes -
 * multiple choice, written answer, matching, or a reading passage with
 * multiple choice. Entirely optional - an empty list means a plain task.
 * Reorder by dragging the grip or with the arrow buttons.
 *
 * `questions` are drafts (see questionDrafts.js); `errors` comes from
 * validateQuestions. `locked` = a student has started, so no edits.
 */
export default function QuestionBuilder({ questions, onChange, errors = {}, locked = false }) {
  const types = useAnswerTypes();
  const update = (key, patch) => onChange(questions.map((q) => (q.key === key ? { ...q, ...patch } : q)));
  const moveTo = (from, to) => {
    if (to < 0 || to >= questions.length || from === to) return;
    const next = [...questions];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  const handleDragEnd = (event) => {
    if (event.canceled) return;
    const { source } = event.operation;
    if (isSortable(source) && source.initialIndex !== source.index) moveTo(source.initialIndex, source.index);
  };

  return (
    <div>
      {questions.length === 0 && (
        <p className="af-roster__note" style={{ marginTop: 0 }}>
          No questions yet. Mix multiple choice, written answers, matching and passages in one assignment.
        </p>
      )}

      <DragDropProvider onDragEnd={handleDragEnd}>
        <div className="af-questions">
          {questions.map((q, index) => (
            <QuestionCard
              key={q.key}
              q={q}
              index={index}
              count={questions.length}
              types={types}
              errors={errors}
              locked={locked}
              update={(patch) => update(q.key, patch)}
              move={(i, delta) => moveTo(i, i + delta)}
              remove={() => onChange(questions.filter((item) => item.key !== q.key))}
            />
          ))}
        </div>
      </DragDropProvider>

      <Button
        type="button"
        variant="secondary"
        startIcon={<LuPlus />}
        disabled={locked || questions.length >= MAX_QUESTIONS}
        onClick={() => onChange([...questions, newQuestion()])}
        style={{ marginTop: 12 }}
      >
        Add question
      </Button>
    </div>
  );
}
