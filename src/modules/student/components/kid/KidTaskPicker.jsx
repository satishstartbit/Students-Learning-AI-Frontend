import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LuCheck, LuTimer, LuX } from 'react-icons/lu';
import { cn } from '../../../../lib/utils';
import { DueChip, SubjectTile } from './PaperKit';

/**
 * "What will you work on?" - the K-5 Focus time card's dashed "+" corner
 * button. Lists the student's to-do tasks (useMyTasks().toDo, soonest due
 * first) plus "Just the timer"; the one tapped becomes the card's "Up next"
 * and the task a new focus session is tied to.
 *
 * @param chosenId  the assignment id shown as Up next, or null for just the timer
 * @param onChoose  (assignmentId | null) => void
 */
export function KidTaskPicker({ isOpen, tasks, chosenId, onChoose, onClose }) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const choose = (id) => {
    onChoose(id);
    onClose?.();
  };

  // Portalled into .kid-theme, like the other kid dialogs, so it keeps the
  // --kid-* tokens and escapes any transformed ancestor.
  const container = document.querySelector('.kid-theme') ?? document.body;
  const rowClass = (selected) =>
    cn(
      'flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left font-kid-body text-base text-kid-ink',
      selected ? 'border-kid-teal bg-kid-sky/40' : 'border-kid-edge bg-kid-paper hover:bg-kid-sheet'
    );

  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-kid-ink/45 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="kid-task-picker-title"
        className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col rounded-[2rem] bg-kid-sheet px-5 py-7 shadow-2xl sm:px-7"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-kid-ink/10 text-kid-ink-soft hover:bg-kid-ink/20"
        >
          <LuX className="size-5" aria-hidden="true" />
        </button>

        <h2 id="kid-task-picker-title" className="pr-10 font-kid-hand text-[2rem] leading-none text-kid-ink">
          What will you work on?
        </h2>
        <p className="mt-2 font-kid-body text-lg text-kid-ink-soft">Pick one thing for this focus time.</p>

        <ul className="mt-5 flex min-h-0 flex-col gap-2.5 overflow-y-auto pb-1">
          {tasks.map((task) => {
            const assignment = task.assignment ?? {};
            const selected = chosenId === assignment.id;
            return (
              <li key={task.id ?? assignment.id}>
                <button type="button" aria-pressed={selected} autoFocus={selected} onClick={() => choose(assignment.id)} className={rowClass(selected)}>
                  <SubjectTile subject={assignment.subject} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-kid-display text-lg font-semibold leading-snug">{assignment.title}</span>
                    <DueChip dueDate={assignment.dueDate} status={task.status} className="mt-1" />
                  </span>
                  {selected && <LuCheck className="size-5 shrink-0 text-kid-teal" strokeWidth={3} aria-hidden="true" />}
                </button>
              </li>
            );
          })}
          <li>
            <button type="button" aria-pressed={chosenId === null} autoFocus={chosenId === null} onClick={() => choose(null)} className={rowClass(chosenId === null)}>
              <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-full bg-kid-paper-deep text-kid-ink-soft">
                <LuTimer className="size-6" />
              </span>
              <span className="flex-1 font-kid-display text-lg font-semibold">Just the timer</span>
              {chosenId === null && <LuCheck className="size-5 shrink-0 text-kid-teal" strokeWidth={3} aria-hidden="true" />}
            </button>
          </li>
        </ul>
      </div>
    </div>,
    container
  );
}

export default KidTaskPicker;
