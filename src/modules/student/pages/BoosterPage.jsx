import { Link, Navigate, useParams } from 'react-router-dom';
import { LuChevronLeft } from 'react-icons/lu';
import { BoosterGame } from '../components/brainBoosters/BoosterGame';
import { BoosterIcon } from '../components/brainBoosters/BoosterIcon';
import { getBooster } from '../components/brainBoosters/boosters';
import { useMotionAllowed } from '../hooks/useKidPreferences';
import { useStudentSettings } from '../hooks/useStudentSettings';

/**
 * Grade 6+: one Brain Booster on its own page (/student/focus/games/:id,
 * /student/focus/exercises/:id), opened from the Focus page's Brain Boosters
 * card - built to the "Student Brain Games - Finger Follow (Ready)" mockup:
 * Back to Focus, the kind and length, the game, and "How it works" with
 * "Your pace, your space". Nothing here counts towards points or grades.
 * K-4 gets pages/kid/KidBoosterPage.jsx.
 */
export default function BoosterPage({ kind = 'game' }) {
  const { boosterId } = useParams();
  const booster = getBooster(kind, boosterId);
  const { settings } = useStudentSettings();
  const motionAllowed = useMotionAllowed();
  const reducedMotion = !motionAllowed || Boolean(settings?.reduceMotion);

  if (!booster) return <Navigate to="/student/focus" replace />;

  const minutes = `About ${booster.minutes} minute${booster.minutes === 1 ? '' : 's'}`;
  return (
    <div className="bb-booster td-page">
      <div className="bb-booster__inner">
        <Link to={`/student/focus?boost=${kind === 'game' ? 'games' : 'exercises'}`} className="bb-booster__back">
          <LuChevronLeft size={16} aria-hidden="true" /> Back to Focus
        </Link>
        <p className="bb-booster__eyebrow">
          {kind === 'game' ? 'Brain games' : 'Exercises'} · {minutes}
        </p>
        <h1 className="bb-booster__title">{booster.label}</h1>
        <p className="bb-booster__sub">{booster.subtitle}</p>

        <div className="bb-booster__layout">
          <section className="bb-booster__game" aria-label={booster.label}>
            <BoosterGame booster={booster} reducedMotion={reducedMotion} />
          </section>

          <aside className="bb-booster__aside" aria-label="How it works">
            <div className="bb-booster__how">
              <div className="bb-booster__how-head">
                <span className="bb-booster__how-icon">
                  <BoosterIcon name={booster.icon} size={19} />
                </span>
                <div>
                  <h2>How it works</h2>
                  <p>A moment for you. Small breaks fit between big ideas.</p>
                </div>
              </div>
              <ol className="bb-booster__steps">
                {booster.how.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
            <div className="bb-booster__pace">
              <h3>Your pace, your space</h3>
              <p>
                {kind === 'game'
                  ? 'Scores are just for this session. Nothing here counts towards points or grades.'
                  : 'Pause or skip any step. Nothing here counts towards points or grades.'}
              </p>
              {reducedMotion && <p>Calm play is on: targets stay still and you set the pace.</p>}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
