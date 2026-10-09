import { Link } from 'react-router-dom';
import { LuCalendarClock, LuInfo, LuTriangleAlert } from 'react-icons/lu';
import { Spinner } from '../../../components/common';

/**
 * The plan's own words (all admin-managed in "Plan explanations"):
 *   - "Updating…" while a change is being planned,
 *   - what changed last time and that finished work didn't,
 *   - suggested study times until the student sets their own,
 *   - time problems, with the shortfall - never a pretend-feasible plan.
 * `studyTimesHref` is where "Change study times" goes (student or parent page).
 */
export function PlanNotices({ plan, studyTimesHref, viewer = 'student' }) {
  if (!plan) return null;
  const conflicts = (plan.conflicts ?? []).filter((c) => c.message);
  return (
    <div className="pl-stack" aria-live="polite">
      {plan.updating && (
        <span className="pl-updating">
          <Spinner size="sm" /> Updating the plan…
        </span>
      )}

      {plan.suggestedTimesNotice && (
        <div className="pl-notice">
          <LuCalendarClock size={16} aria-hidden="true" />
          <div className="pl-notice__body">
            <span>{plan.suggestedTimesNotice}</span>
            {studyTimesHref && (
              <Link className="pl-link" to={studyTimesHref}>
                Set study times
              </Link>
            )}
          </div>
        </div>
      )}
      {/* Time problems, with the shortfall (PDF Q6/Q10) - shown once, together. */}
      {conflicts.length > 0 && !plan.updating && (
        <div className="pl-notice pl-notice--warning" role="status">
          <LuTriangleAlert size={16} aria-hidden="true" />
          <div className="pl-notice__body">
            {conflicts.slice(0, 3).map((c) => (
              <span key={`${c.type}-${c.assignmentId ?? c.date ?? c.message}`}>{c.message}</span>
            ))}
            {conflicts.length > 3 && <span>{`And ${conflicts.length - 3} more.`}</span>}
            {/* The admin's words ("Plan explanations"), by who is reading. */}
            {plan.conflictHints?.[viewer] && <span className="pl-notice__hint">{plan.conflictHints[viewer]}</span>}
            {studyTimesHref && (
              <Link className="pl-link" to={studyTimesHref}>
                Change study times
              </Link>
            )}
          </div>
        </div>
      )}
      {plan.explanation && !plan.updating && (
        <div className="pl-notice">
          <LuInfo size={16} aria-hidden="true" />
          <div className="pl-notice__body">
            <span>{plan.explanation}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlanNotices;
