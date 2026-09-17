import { Link } from 'react-router-dom';
import { LuHeadphones, LuPlay } from 'react-icons/lu';
import { formatDurationLong } from '../../../../utils/date';

/** Shortcut into the Focus timer, with today's real focused minutes once there are any. */
export function StartFocusCard({ minutesToday }) {
  return (
    <section className="sh-card sh-focus" aria-labelledby="sh-focus-title">
      <div className="sh-focus__row">
        <span className="sh-focus__icon" aria-hidden="true">
          <LuHeadphones size={17} />
        </span>
        <div>
          <h2 id="sh-focus-title" className="sh-focus__title">
            Start Focus
          </h2>
          <p className="sh-focus__text">
            {minutesToday > 0
              ? `${formatDurationLong(minutesToday)} focused today - keep it going.`
              : 'Tune out distractions and get in the zone.'}
          </p>
        </div>
      </div>
      <Link to="/student/focus" className="sh-start sh-focus__button">
        <LuPlay size={12} fill="currentColor" aria-hidden="true" /> Start focus
      </Link>
    </section>
  );
}

export default StartFocusCard;
