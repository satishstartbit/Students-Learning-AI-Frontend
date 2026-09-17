import { Link } from 'react-router-dom';
import { DragDropProvider } from '@dnd-kit/react';
import { isSortable, useSortable } from '@dnd-kit/react/sortable';
import { LuCheck, LuChevronRight, LuClock3, LuGripVertical, LuImage, LuListChecks, LuPlay } from 'react-icons/lu';
import SubjectTile from './SubjectTile';

/**
 * Today's Tasks - teacher work and the student's own tasks in one list the
 * student can drag into their own order (saved to /my-tasks/order).
 *
 * The first open task is "up next": highlighted, with the Start button. Done
 * rows stay in the list for the rest of the day so progress is visible.
 * Only a student's own task can be ticked done here - teacher work is done
 * when it's handed in, so its circle just reflects that.
 */

function TaskRow({ task, index, isNext, taskPoints, onOpenOwn, onToggleOwn }) {
  const { ref, handleRef, isDragging } = useSortable({ id: task.key, index, disabled: task.done });

  const isOwn = task.type === 'own';
  const href = isOwn ? null : `/student/assignments/${task.assignmentId}`;
  const minutes = task.estimatedMinutes ? `${task.estimatedMinutes} min` : null;
  const openLabel = `Open ${task.title}`;

  const body = (
    <>
      <SubjectTile subject={task.subject} />
      <span className="sh-task__text">
        <span className="sh-task__title">{task.title}</span>
        <span className="sh-task__meta">
          {task.subject && <span>{task.subject}</span>}
          {task.subject && minutes && <span className="sh-task__dot" aria-hidden="true" />}
          {minutes && (
            <>
              <LuClock3 size={11} aria-hidden="true" />
              <span>{minutes}</span>
            </>
          )}
          {isOwn && <span className="sh-task__tag">My task</span>}
          {isOwn && task.raw.photo && <LuImage size={12} aria-label="Has a photo" />}
        </span>
      </span>
    </>
  );

  return (
    <li ref={ref} className="sh-task" data-next={isNext || undefined} data-done={task.done || undefined} data-dragging={isDragging || undefined}>
      <button
        ref={handleRef}
        type="button"
        className="sh-task__handle"
        aria-label={task.done ? `${task.title} is done` : `Reorder ${task.title}`}
        disabled={task.done}
      >
        <LuGripVertical size={14} aria-hidden="true" />
      </button>

      {isOwn ? (
        <button
          type="button"
          className="sh-task__check"
          aria-pressed={task.done}
          aria-label={task.done ? `Mark ${task.title} not done` : `Mark ${task.title} done`}
          onClick={() => onToggleOwn(task, !task.done)}
        >
          <LuCheck size={13} strokeWidth={3} aria-hidden="true" />
        </button>
      ) : (
        <span
          className="sh-task__check"
          data-static="true"
          data-done={task.done || undefined}
          role="img"
          aria-label={task.done ? 'Handed in' : 'Not handed in yet'}
        >
          <LuCheck size={13} strokeWidth={3} aria-hidden="true" />
        </span>
      )}

      {href ? (
        <Link to={href} className="sh-task__main" aria-label={openLabel}>
          {body}
        </Link>
      ) : (
        <button type="button" className="sh-task__main" aria-label={openLabel} onClick={() => onOpenOwn(task)}>
          {body}
        </button>
      )}

      <span className="sh-task__side">
        {!isOwn && taskPoints ? <span className="sh-task__pts">+{taskPoints} pts</span> : null}
        {isNext &&
          (href ? (
            <Link to={href} className="sh-start">
              <LuPlay size={11} fill="currentColor" aria-hidden="true" /> Start
            </Link>
          ) : (
            <button type="button" className="sh-start" onClick={() => onOpenOwn(task)}>
              <LuPlay size={11} fill="currentColor" aria-hidden="true" /> Start
            </button>
          ))}
      </span>
    </li>
  );
}

export function TodayTasksCard({ tasks, openCount, doneCount, isLoading, error, onRetry, taskPoints, onMove, onOpenOwn, onToggleOwn }) {
  const total = tasks.length;
  const nextKey = tasks.find((t) => !t.done)?.key;

  const handleDragEnd = (event) => {
    if (event.canceled) return;
    const { source } = event.operation;
    if (isSortable(source) && source.initialIndex !== source.index) {
      onMove(source.initialIndex, source.index);
    }
  };

  return (
    <section className="sh-card" aria-labelledby="sh-tasks-title">
      <header className="sh-card__head">
        <div className="sh-card__heading">
          <span className="sh-card__icon" aria-hidden="true">
            <LuListChecks size={15} />
          </span>
          <div>
            <h2 id="sh-tasks-title" className="sh-card__title">
              Today&apos;s Tasks
            </h2>
            <p className="sh-card__subtitle">
              {total} {total === 1 ? 'task' : 'tasks'} · {openCount} to go
            </p>
          </div>
        </div>
        <Link to="/student/calendar" className="sh-card__link">
          View full plan <LuChevronRight size={14} aria-hidden="true" />
        </Link>
      </header>

      {total > 0 && (
        <div className="sh-progress">
          <div
            className="sh-progress__track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={doneCount}
            aria-label="Tasks complete today"
          >
            <div className="sh-progress__fill" style={{ width: `${Math.round((doneCount / total) * 100)}%` }} />
          </div>
          <span className="sh-progress__label">
            {doneCount}/{total} complete
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="sh-tasks" aria-busy="true" aria-label="Loading your tasks">
          {[0, 1, 2].map((i) => (
            <div key={i} className="sh-skeleton" />
          ))}
        </div>
      ) : error && total === 0 ? (
        <p className="sh-empty">
          Couldn&apos;t load your tasks.{' '}
          <button type="button" className="sh-card__link" onClick={onRetry}>
            Try again
          </button>
        </p>
      ) : total === 0 ? (
        <p className="sh-empty">You&apos;re all caught up for today. Add a task below if something&apos;s on your mind.</p>
      ) : (
        <DragDropProvider onDragEnd={handleDragEnd}>
          <ul className="sh-tasks">
            {tasks.map((task, index) => (
              <TaskRow
                key={task.key}
                task={task}
                index={index}
                isNext={task.key === nextKey}
                taskPoints={taskPoints}
                onOpenOwn={onOpenOwn}
                onToggleOwn={onToggleOwn}
              />
            ))}
          </ul>
        </DragDropProvider>
      )}
    </section>
  );
}

export default TodayTasksCard;
