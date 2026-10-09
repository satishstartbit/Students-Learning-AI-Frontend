import { Fragment, useState } from 'react';
import { LuArrowDown, LuArrowUp, LuCheck, LuEllipsis, LuListChecks, LuPencil, LuPlus, LuTrash2 } from 'react-icons/lu';
import { Dropdown } from '../../../../components/common';
import { milestoneHeadings } from '../assignment/milestoneHeadings';

/**
 * "Your steps" - the student's own checklist for the task a focus session is
 * about (useFocusSteps). Click a step to make it the one you're working on;
 * tick the circle to mark it done by hand; the ⋯ menu renames, moves or
 * removes it. Steps arrive with the work; an empty plan invites typing your
 * own (no "Suggest"/"Regenerate" button - smaller steps come from "Need
 * help? → Break it down more").
 */

function StepRow({ step, index, total, isCurrent, onSelect, selectDisabled, steps }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(step.title);

  const save = () => {
    const title = draft.trim();
    setEditing(false);
    if (title && title !== step.title) steps.rename(step.id, title);
    else setDraft(step.title);
  };

  return (
    <li className="fs-step" data-current={isCurrent || undefined} data-done={step.done || undefined}>
      <button
        type="button"
        className="fs-step__check"
        aria-pressed={step.done}
        aria-label={step.done ? `Mark "${step.title}" not done` : `Mark "${step.title}" done`}
        onClick={() => steps.toggleDone(step)}
      >
        {step.done ? <LuCheck size={13} strokeWidth={3} aria-hidden="true" /> : index + 1}
      </button>

      {editing ? (
        <input
          className="fs-step__edit"
          aria-label="Step name"
          value={draft}
          maxLength={200}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') {
              setDraft(step.title);
              setEditing(false);
            }
          }}
        />
      ) : (
        <button
          type="button"
          className="fs-step__main"
          onClick={() => onSelect(step)}
          disabled={selectDisabled}
          aria-current={isCurrent ? 'step' : undefined}
          title={isCurrent ? 'You’re working on this step' : 'Work on this step'}
        >
          {step.title}
        </button>
      )}

      {step.estimatedMinutes && !editing ? <span className="fs-step__mins">{step.estimatedMinutes} min</span> : null}

      <Dropdown
        align="end"
        trigger={
          <button type="button" className="fs-btn fs-btn--ghost fs-btn--round" style={{ width: 32, height: 32 }} aria-label={`More for "${step.title}"`}>
            <LuEllipsis size={16} aria-hidden="true" />
          </button>
        }
        items={[
          { label: 'Rename', icon: <LuPencil size={14} />, onClick: () => setEditing(true) },
          { label: 'Move up', icon: <LuArrowUp size={14} />, onClick: () => steps.moveUp(step.id), disabled: index === 0 },
          { label: 'Move down', icon: <LuArrowDown size={14} />, onClick: () => steps.moveDown(step.id), disabled: index === total - 1 },
          { label: 'Remove', icon: <LuTrash2 size={14} />, onClick: () => steps.remove(step.id), danger: true },
        ]}
      />
    </li>
  );
}

export function StepsPanel({ assignment, steps, currentStepId, onSelectStep, selectDisabled = false }) {
  const [newTitle, setNewTitle] = useState('');
  const total = steps.steps.length;
  const headings = milestoneHeadings(steps.steps);
  const percent = total ? Math.round((steps.doneCount / total) * 100) : 0;

  const addStep = async (event) => {
    event.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    const created = await steps.add(title);
    if (created) setNewTitle('');
  };

  return (
    <section className="fs-card" aria-labelledby="fs-steps-title">
      <header className="fs-steps__head">
        <span className="fs-steps__icon" aria-hidden="true">
          <LuListChecks size={18} />
        </span>
        <div style={{ minWidth: 0 }}>
          <h2 id="fs-steps-title" className="fs-steps__title">
            Your steps
          </h2>
          <p className="fs-steps__sub">{assignment ? assignment.title : 'Pick a task to plan it step by step'}</p>
        </div>
      </header>

      {assignment && total > 0 && (
        <div className="fs-progress">
          <div className="fs-progress__track" role="progressbar" aria-label="Steps done" aria-valuemin={0} aria-valuemax={total} aria-valuenow={steps.doneCount}>
            <div className="fs-progress__fill" style={{ width: `${percent}%` }} />
          </div>
          <span className="fs-progress__label">
            {steps.doneCount}/{total} done
          </span>
        </div>
      )}

      {!assignment ? (
        <p className="fs-steps__empty">Choose what you&apos;re working on, and break it into small steps here.</p>
      ) : steps.isLoading ? (
        <p className="fs-steps__empty">Loading your steps…</p>
      ) : total === 0 ? (
        <p className="fs-steps__empty">Your steps arrive with the work - check back in a moment, or add your own below.</p>
      ) : (
        <ol className="fs-steps">
          {steps.steps.map((step, index) => (
            <Fragment key={step.id}>
            {headings.has(step.id) && (
              <li role="presentation" className="fs-milestone">
                <span role="heading" aria-level={3}>{headings.get(step.id)}</span>
              </li>
            )}
            <StepRow
              step={step}
              index={index}
              total={total}
              isCurrent={step.id === currentStepId}
              onSelect={onSelectStep}
              selectDisabled={selectDisabled}
              steps={steps}
            />
            </Fragment>
          ))}
        </ol>
      )}

      {assignment && (
        <form className="fs-add" onSubmit={addStep}>
          <input
            aria-label="Add a step"
            placeholder="Add a step…"
            value={newTitle}
            maxLength={200}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <button type="submit" className="fs-btn fs-btn--round" style={{ width: 38, height: 38 }} aria-label="Add step" disabled={!newTitle.trim()}>
            <LuPlus size={16} aria-hidden="true" />
          </button>
        </form>
      )}

      {assignment && <p className="fs-steps__note">These steps are yours. Edit, reorder or delete them any time.</p>}
    </section>
  );
}

export default StepsPanel;
