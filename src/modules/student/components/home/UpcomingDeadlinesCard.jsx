import { Link } from 'react-router-dom';
import { LuCalendarDays, LuChevronRight } from 'react-icons/lu';
import { daysUntilDateKey, formatDateKey } from '../../../../utils/date';

const MAX_ROWS = 4;

function whenLabel(days) {
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
}

function DeadlineRow({ task, onOpenOwn }) {
  const days = daysUntilDateKey(task.dueDate);
  const month = formatDateKey(task.dueDate, { month: 'short', day: undefined, year: undefined });
  const day = formatDateKey(task.dueDate, { month: undefined, day: 'numeric', year: undefined });

  const content = (
    <>
      <span className="sh-datebadge" aria-hidden="true">
        <span className="sh-datebadge__month">{month}</span>
        <span className="sh-datebadge__day">{day}</span>
      </span>
      <span className="sh-deadline__text">
        <span className="sh-deadline__title">{task.title}</span>
        <span className="sh-deadline__subject">{task.subject || (task.type === 'own' ? 'My task' : '')}</span>
      </span>
      <span className="sh-deadline__when" data-soon={days <= 1 || undefined}>
        {whenLabel(days)}
      </span>
    </>
  );

  return (
    <li>
      {task.type === 'own' ? (
        <button type="button" className="sh-deadline" onClick={() => onOpenOwn(task)}>
          {content}
        </button>
      ) : (
        <Link to={`/student/assignments/${task.assignmentId}`} className="sh-deadline">
          {content}
        </Link>
      )}
    </li>
  );
}

/** Open work due after today, soonest first - a look ahead, not a repeat of Today's Tasks. */
export function UpcomingDeadlinesCard({ upcoming, isLoading, onOpenOwn }) {
  const count = upcoming.length;

  return (
    <section className="sh-card" aria-labelledby="sh-deadlines-title">
      <header className="sh-card__head">
        <div className="sh-card__heading">
          <span className="sh-card__icon" aria-hidden="true">
            <LuCalendarDays size={15} />
          </span>
          <div>
            <h2 id="sh-deadlines-title" className="sh-card__title">
              Upcoming Deadlines
            </h2>
            <p className="sh-card__subtitle">
              {count} {count === 1 ? 'assignment' : 'assignments'}
            </p>
          </div>
        </div>
        <Link to="/student/assignments" className="sh-card__link">
          View all <LuChevronRight size={14} aria-hidden="true" />
        </Link>
      </header>

      {isLoading ? (
        <div className="sh-deadlines" aria-busy="true">
          {[0, 1].map((i) => (
            <div key={i} className="sh-skeleton" />
          ))}
        </div>
      ) : count === 0 ? (
        <p className="sh-empty">Nothing due after today. Enjoy the breathing room.</p>
      ) : (
        <ul className="sh-deadlines">
          {upcoming.slice(0, MAX_ROWS).map((task) => (
            <DeadlineRow key={task.key} task={task} onOpenOwn={onOpenOwn} />
          ))}
        </ul>
      )}
    </section>
  );
}

export default UpcomingDeadlinesCard;
