import { Link } from 'react-router-dom';
import { LuCalendarDays, LuChevronRight, LuClock3 } from 'react-icons/lu';
import { daysUntilDateKey, formatDateKey, formatDurationLong } from '../../../../utils/date';
import { getActiveLocale } from '../../../../utils/locale';

/** The pinned "This week" note: steps done, what's still due, and time planned. */
export function WeekSummaryCard({ total, done, dueCount, minutes, isLoading }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <section className="sp-weeknote" aria-labelledby="sp-week-title">
      <span className="sp-weeknote__tape" aria-hidden="true" />
      <p id="sp-week-title" className="sp-eyebrow">
        This week
      </p>
      <p className="sp-weeknote__count">
        {isLoading ? '…' : total === 0 ? 'Nothing planned yet' : `${done} of ${total} ${total === 1 ? 'step' : 'steps'} done`}
      </p>
      <span className="sp-bar sp-bar--lg" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={`${pct}% of this week done`}>
        <span className="sp-bar__fill" style={{ width: `${pct}%` }} />
      </span>
      <div className="sp-weeknote__meta">
        <span>
          <LuCalendarDays size={12} aria-hidden="true" /> {dueCount} {dueCount === 1 ? 'assignment' : 'assignments'} due
        </span>
        <span>
          <LuClock3 size={12} aria-hidden="true" /> {minutes > 0 ? `${formatDurationLong(minutes)} planned` : 'No time planned'}
        </span>
      </div>
    </section>
  );
}

function whenLabel(days) {
  if (days < 0) return 'Overdue';
  const text = new Intl.RelativeTimeFormat(getActiveLocale(), { numeric: 'auto' }).format(days, 'day');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const MAX_ROWS = 4;

/** Open work with a due date - overdue first, then soonest. */
export function DueSoonCard({ tasks, isLoading, onOpenOwn }) {
  const count = tasks.length;
  return (
    <section className="sh-card sp-duesoon" aria-labelledby="sp-due-title">
      <header className="sh-card__head">
        <div className="sh-card__heading">
          <span className="sh-card__icon" aria-hidden="true">
            <LuCalendarDays size={15} />
          </span>
          <div>
            <h2 id="sp-due-title" className="sh-card__title">
              Due soon
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
          <div className="sh-skeleton" />
          <div className="sh-skeleton" />
        </div>
      ) : count === 0 ? (
        <p className="sh-empty">Nothing due. Enjoy the breathing room.</p>
      ) : (
        <ul className="sh-deadlines">
          {tasks.slice(0, MAX_ROWS).map((task) => {
            const days = daysUntilDateKey(task.dueDate);
            const content = (
              <>
                <span className="sh-datebadge" aria-hidden="true">
                  <span className="sh-datebadge__month">{formatDateKey(task.dueDate, { month: 'short', day: undefined, year: undefined })}</span>
                  <span className="sh-datebadge__day">{formatDateKey(task.dueDate, { month: undefined, day: 'numeric', year: undefined })}</span>
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
              <li key={task.key}>
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
          })}
        </ul>
      )}
    </section>
  );
}
