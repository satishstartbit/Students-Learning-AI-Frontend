import { Link } from 'react-router-dom';
import { LuArrowRight, LuLifeBuoy, LuPlay, LuSparkles } from 'react-icons/lu';
import { Badge, Button, ErrorState } from '../../../components/common';
import { formatDateKey, formatTime } from '../../../utils/date';
import { minutesLabel } from '../planView';

/**
 * "Next up" - the few study times coming next, each with the plan's reason
 * (PDF Q9: a small set of useful next actions, explained). `canStart` shows
 * Start (the student); a parent sees the same list read-only. `planHref`
 * links to the full plan.
 */
export function NextActionsCard({ plan, isLoading, error, onRetry, canStart = true, planHref, title = 'Next up', onHelp }) {
  const actions = plan?.nextActions ?? [];
  const timeZone = plan?.timezone;
  const when = (a) => {
    const time = `${formatTime(a.startAt, { timeZone })}`;
    return a.date === plan?.today ? time : `${formatDateKey(a.date, { weekday: 'short', month: 'short', day: 'numeric', year: undefined })}, ${time}`;
  };

  return (
    <section className="pl-card" aria-labelledby="pl-next-title">
      <div className="pl-card__head">
        <div>
          <h2 id="pl-next-title" className="pl-card__title">
            {title}
          </h2>
          <p className="pl-card__sub">Your plan, one step at a time.</p>
        </div>
        {planHref && (
          <Link className="pl-link" to={planHref}>
            Full plan <LuArrowRight size={14} aria-hidden="true" />
          </Link>
        )}
      </div>

      {error && !plan ? (
        <ErrorState error={error} onRetry={onRetry} variant="compact" />
      ) : isLoading ? (
        <p className="pl-muted">Loading the plan…</p>
      ) : actions.length === 0 ? (
        <p className="pl-muted">
          <LuSparkles size={14} aria-hidden="true" /> Nothing planned right now. New work gets study times automatically.
        </p>
      ) : (
        <ol className="pl-next">
          {actions.map((a, i) => (
            <li key={a.id} className={`pl-next__item${i === 0 ? ' pl-next__item--first' : ''}`}>
              <span className="pl-next__time">
                {when(a)}
                <br />
                {minutesLabel(a.minutes)}
              </span>
              <div className="pl-next__main">
                <p className="pl-next__title">{a.title}</p>
                {a.assignmentTitle && a.assignmentTitle !== a.title && <p className="pl-next__meta">{a.assignmentTitle}</p>}
                {a.why && <p className="pl-next__why">{a.why}</p>}
                <div className="pl-row" style={{ marginTop: 4 }}>
                  {a.carriedOver && <Badge variant="warning">Moved from earlier</Badge>}
                  {a.late && <Badge variant="danger">After the due date</Badge>}
                  {a.pinned && <Badge variant="neutral">Kept where you put it</Badge>}
                </div>
              </div>
              {canStart && a.assignmentId && (
                <div className="pl-row" style={{ flexWrap: 'nowrap' }}>
                  {onHelp && (
                    <Button type="button" size="sm" variant="ghost" startIcon={<LuLifeBuoy aria-hidden="true" />} onClick={() => onHelp(a)}>
                      Help
                    </Button>
                  )}
                  <Button
                    as={Link}
                    to={`/student/focus?assignment=${a.assignmentId}${a.stepId ? `&step=${a.stepId}` : ''}`}
                    size="sm"
                    variant={i === 0 ? 'primary' : 'secondary'}
                    startIcon={<LuPlay aria-hidden="true" />}
                  >
                    Start
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default NextActionsCard;
