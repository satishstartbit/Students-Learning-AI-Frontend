import { useState } from 'react';
import { LuArrowDown, LuArrowUp, LuCheck, LuClock3, LuEllipsis, LuPencil, LuPlus, LuTrash2 } from 'react-icons/lu';
import { Button, Dropdown } from '../../../../components/common';

/**
 * "Task breakdown" on the Grade 6+ assignment page: the student's own steps
 * for this assignment (the same plan the Focus page uses - useFocusSteps,
 * backend /focus/steps), with Done / In progress / To do.
 *
 * "In progress" is real: it's the step the student's live focus session is on.
 * Steps arrive with the work (made when it was saved); there is no "Suggest"
 * or "Regenerate" button - smaller steps come from "Need help? → Break it
 * down more". Editing (rename / reorder / remove / add) appears under "Edit steps".
 */

const stateOf = (step, activeStepId) => {
  if (step.done) return { key: 'done', label: 'Done' };
  if (step.id === activeStepId) return { key: 'doing', label: 'In progress' };
  return { key: 'todo', label: 'To do' };
};

function StepRow({ step, index, total, steps, activeStepId, editing, onSelect }) {
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(step.title);
  const state = stateOf(step, activeStepId);

  const save = () => {
    const title = draft.trim();
    setRenaming(false);
    if (title && title !== step.title) steps.rename(step.id, title);
    else setDraft(step.title);
  };

  return (
    <li className="ad-step" data-done={step.done || undefined} data-current={state.key === 'doing' || undefined}>
      <button
        type="button"
        className="ad-step__check"
        aria-pressed={step.done}
        aria-label={step.done ? `Mark "${step.title}" not done` : `Mark "${step.title}" done`}
        onClick={() => steps.toggleDone(step)}
      >
        {step.done ? <LuCheck size={14} strokeWidth={3} aria-hidden="true" /> : index + 1}
      </button>

      {renaming ? (
        <input
          className="ad-step__edit"
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
              setRenaming(false);
            }
          }}
        />
      ) : (
        <button type="button" className="ad-step__main" onClick={() => onSelect?.(step)} disabled={!onSelect}>
          <span className="ad-step__name">{step.title}</span>
          {step.estimatedMinutes ? <span className="ad-step__desc">About {step.estimatedMinutes} minutes</span> : null}
        </button>
      )}

      <span className="ad-step__side">
        {step.estimatedMinutes ? (
          <span className="ad-step__mins">
            <LuClock3 size={12} aria-hidden="true" /> {step.estimatedMinutes} min
          </span>
        ) : null}
        <span className="ad-pill" data-state={state.key}>
          {state.label}
        </span>
        {editing && (
          <Dropdown
            align="end"
            trigger={
              <button type="button" className="ad-edit" style={{ width: 32, padding: 0, justifyContent: 'center' }} aria-label={`More for "${step.title}"`}>
                <LuEllipsis size={15} aria-hidden="true" />
              </button>
            }
            items={[
              { label: 'Rename', icon: <LuPencil size={14} />, onClick: () => setRenaming(true) },
              { label: 'Move up', icon: <LuArrowUp size={14} />, onClick: () => steps.moveUp(step.id), disabled: index === 0 },
              { label: 'Move down', icon: <LuArrowDown size={14} />, onClick: () => steps.moveDown(step.id), disabled: index === total - 1 },
              { label: 'Remove', icon: <LuTrash2 size={14} />, onClick: () => steps.remove(step.id), danger: true },
            ]}
          />
        )}
      </span>
    </li>
  );
}

export function TaskBreakdown({ steps, activeStepId, onSelectStep }) {
  const [editing, setEditing] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const total = steps.steps.length;
  const totalMinutes = steps.steps.reduce((sum, s) => sum + (s.estimatedMinutes ?? 0), 0);

  const addStep = async (event) => {
    event.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    if (await steps.add(title)) setNewTitle('');
  };

  return (
    <section className="ad-card" aria-labelledby="ad-steps-title">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h2 id="ad-steps-title" className="ad-card__title">
            Task breakdown
          </h2>
          <p className="ad-card__hint">
            {total === 0
              ? 'Break this into small steps'
              : `${total} ${total === 1 ? 'step' : 'steps'}${totalMinutes ? ` · about ${Math.floor(totalMinutes / 60) ? `${Math.floor(totalMinutes / 60)} hr ` : ''}${totalMinutes % 60} min in total` : ''}`}
          </p>
        </div>
        {total > 0 && (
          <button type="button" className="ad-edit" aria-pressed={editing} onClick={() => setEditing((v) => !v)}>
            <LuPencil size={14} aria-hidden="true" /> {editing ? 'Done editing' : 'Edit steps'}
          </button>
        )}
      </div>

      {steps.isLoading ? (
        <p className="ad-steps__empty">Loading your steps…</p>
      ) : total === 0 ? (
        <div className="ad-steps__empty">
          <p style={{ margin: '0 0 12px' }}>
            Your steps arrive with the work - check back in a moment. You can also add your own.
          </p>
          <Button size="sm" variant="secondary" startIcon={<LuPlus aria-hidden="true" />} onClick={() => setEditing(true)}>
            Add a step
          </Button>
        </div>
      ) : (
        <ol className="ad-steps">
          {steps.steps.map((step, index) => (
            <StepRow
              key={step.id}
              step={step}
              index={index}
              total={total}
              steps={steps}
              activeStepId={activeStepId}
              editing={editing}
              onSelect={onSelectStep}
            />
          ))}
        </ol>
      )}

      {editing && (
        <form className="ad-add" onSubmit={addStep}>
          <input aria-label="Add a step" placeholder="Add a step…" value={newTitle} maxLength={200} onChange={(e) => setNewTitle(e.target.value)} />
          <button type="submit" className="ad-edit" aria-label="Add step" disabled={!newTitle.trim()} style={{ width: 38, justifyContent: 'center' }}>
            <LuPlus size={15} aria-hidden="true" />
          </button>
        </form>
      )}

      {total > 0 && <p className="ad-foot">These steps are yours - edit, reorder, add or delete them at any time.</p>}
    </section>
  );
}

export default TaskBreakdown;
