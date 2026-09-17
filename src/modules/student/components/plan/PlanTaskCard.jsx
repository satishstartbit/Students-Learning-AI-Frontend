import { Link } from 'react-router-dom';
import { LuCheck, LuClock3, LuPlay, LuUser } from 'react-icons/lu';
import { getSubjectVisual } from '../subjectVisual';

/**
 * One task on the Plan board - teacher work or the student's own task
 * (the normalized shape from hooks/useTodayTasks.js). Open work gets a
 * Start button; finished work shows a green tick instead.
 */
export function PlanTaskCard({ task, isOverdue, onOpenOwn }) {
  const isOwn = task.type === 'own';
  const { tone } = getSubjectVisual(task.subject);
  const minutes = task.estimatedMinutes ? `${task.estimatedMinutes} min` : null;
  const kind = task.kind ?? (isOwn ? 'My task' : 'Assignment');
  const handedIn = !isOwn && task.status === 'submitted';

  return (
    <article className="sp-task" data-done={task.done || undefined} data-overdue={isOverdue || undefined}>
      <div className="sp-task__top">
        {task.subject ? (
          <span className="sp-chip" data-tone={tone}>
            {task.subject}
          </span>
        ) : (
          <span className="sp-chip" data-tone="neutral">
            {isOwn ? 'Personal' : 'General'}
          </span>
        )}
        {!isOwn && (
          <span className="sp-task__from" title="From your teacher">
            <LuUser size={11} aria-label="From your teacher" />
          </span>
        )}
      </div>

      <p className="sp-task__kind">{kind}</p>

      {isOwn ? (
        <button type="button" className="sp-task__title" onClick={() => onOpenOwn(task)}>
          {task.title}
        </button>
      ) : (
        <Link to={`/student/assignments/${task.assignmentId}`} className="sp-task__title">
          {task.title}
        </Link>
      )}

      {task.done ? (
        <p className="sp-task__done">
          <LuCheck size={12} strokeWidth={3} aria-hidden="true" />
          {handedIn ? 'Handed in' : minutes ?? 'Done'}
        </p>
      ) : (
        <>
          {minutes && (
            <p className="sp-task__time" data-overdue={isOverdue || undefined}>
              <LuClock3 size={12} aria-hidden="true" />
              {isOverdue ? `Overdue · ${minutes}` : minutes}
            </p>
          )}
          {!minutes && isOverdue && <p className="sp-task__time" data-overdue="true">Overdue</p>}
          {isOwn ? (
            <button type="button" className="sp-start" onClick={() => onOpenOwn(task)} aria-label={`Start ${task.title}`}>
              <LuPlay size={10} fill="currentColor" aria-hidden="true" /> Start
            </button>
          ) : (
            <Link to={`/student/assignments/${task.assignmentId}`} className="sp-start" aria-label={`Start ${task.title}`}>
              <LuPlay size={10} fill="currentColor" aria-hidden="true" /> Start
            </Link>
          )}
        </>
      )}
    </article>
  );
}

export default PlanTaskCard;
