import { Link } from 'react-router-dom';
import { LuArrowRight, LuGamepad2 } from 'react-icons/lu';
import './brainBoostersTeaser.css';

/**
 * A shared home shortcut for both student experiences. Brain Boosters live on
 * the Focus page now; `?boost=games` opens it on the brain games.
 */
export default function BrainBoostersTeaser({ isJunior = false }) {
  return (
    <Link
      to="/student/focus?boost=games"
      className={`bbt-card${isJunior ? ' bbt-card--junior' : ''}`}
    >
      <span className="bbt-icon" aria-hidden="true">
        <LuGamepad2 size={24} />
      </span>
      <div className="bbt-copy">
        <h2 className="bbt-title">Brain Boosters</h2>
        <p className="bbt-description">A quick break for focus and memory</p>
      </div>
      <span className="bbt-cta">
        {isJunior ? "Let's play" : 'Take a brain break'}
        <LuArrowRight size={16} aria-hidden="true" />
      </span>
    </Link>
  );
}
