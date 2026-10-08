import { Link } from 'react-router-dom';
import { LuCheck, LuClock3, LuPin, LuPlay, LuUser } from 'react-icons/lu';
import { subjectPaint } from '../../../../components/subjects/subjectColor';
import { formatTime } from '../../../../utils/date';
import { shortMinutes } from '../../../planner/components/schoolwork/schoolworkFormat';

/**
 * One study time on the Grade 6+ calendar (the Plan mockup's day card): the
 * subject on its pastel pill (with a little person when the work is from a
 * teacher), the work it belongs to, the step to do, how long, and Start -
 * which opens Focus on exactly this step. A finished one shows a green tick;
 * a missed one says so (the planner finds it a new time). The step's name of
 * an upcoming study time opens it to move it or keep it there
 * (StudyBlockDialog); a pin marks one the student kept in place.
 *
 *   fromTeacher   the work is a teacher's (shows the person icon)
 *   showTime      the clock time too (day view), from the plan's own zone
 */
export function PlanBlockCard({ block, color, fromTeacher, showTime = false, timeZone, todayKey, onOpen }) {
  const done = block.status === 'done';
  const missed = block.status === 'missed';
  const editable = Boolean(onOpen) && block.status === 'scheduled' && (!todayKey || block.date >= todayKey);
  const minutes = shortMinutes(block.minutes) || '–';
  const focusHref = `/student/focus?assignment=${encodeURIComponent(block.assignmentId)}${block.stepId ? `&step=${encodeURIComponent(block.stepId)}` : ''}`;
  const time = showTime && block.startAt ? formatTime(block.startAt, timeZone ? { timeZone } : undefined) : null;
  const name = block.title || block.assignmentTitle;

  return (
    <article className="sp-task" data-done={done || undefined} data-missed={missed || undefined}>
      <div className="sp-task__top">
        {block.subject ? (
          <span className="sp-chip" {...subjectPaint(color)}>
            {block.subject}
          </span>
        ) : (
          <span className="sp-chip">Study</span>
        )}
        {fromTeacher && (
          <span className="sp-task__from" title="From your teacher">
            <LuUser size={11} aria-label="From your teacher" />
          </span>
        )}
        {block.pinned && (
          <span className="sp-task__from" title="Kept where you put it">
            <LuPin size={10} aria-label="Kept where you put it" />
          </span>
        )}
      </div>
      <p className="sp-task__kind">{block.assignmentTitle}</p>
      {editable ? (
        <button type="button" className="sp-task__title" onClick={() => onOpen(block)} aria-label={`${name} - move or keep this study time`}>
          {name}
        </button>
      ) : (
        <span className="sp-task__title">{name}</span>
      )}
      {done ? (
        <p className="sp-task__done">
          <LuCheck size={12} strokeWidth={3} aria-hidden="true" /> {minutes}
        </p>
      ) : (
        <>
          <p className="sp-task__time" data-missed={missed || undefined}>
            <LuClock3 size={12} aria-hidden="true" />
            {[time, missed ? `Missed · ${minutes}` : minutes].filter(Boolean).join(' · ')}
          </p>
          {!missed && (
            <Link to={focusHref} className="sp-start" aria-label={`Start ${block.title || block.assignmentTitle}`}>
              <LuPlay size={10} fill="currentColor" aria-hidden="true" /> Start
            </Link>
          )}
        </>
      )}
    </article>
  );
}

export default PlanBlockCard;
