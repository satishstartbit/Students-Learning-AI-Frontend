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
