import { Link } from 'react-router-dom';
import { LuTrophy } from 'react-icons/lu';
import RewardArt from '../rewards/RewardArt';

const RING_SIZE = 96;
const STROKE = 10;

/** Points toward the cheapest reward still out of reach, from the real rewards ledger/catalog. */
export function ProgressCard({ totalPoints, rewards, isLoading }) {
  // The cheapest reward not collected yet (the catalog carries `collected` - rewards are milestones on earned points).
  const nextReward = rewards
    .filter((r) => !(r.collected ?? r.pointsCost <= totalPoints))
    .sort((a, b) => a.pointsCost - b.pointsCost)[0];

  const goal = nextReward ? nextReward.pointsCost : Math.max(totalPoints, 1);
  const percent = Math.min(totalPoints / goal, 1);
  const radius = (RING_SIZE - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;

  let caption;
  if (isLoading) caption = 'Loading…';
  else if (nextReward) caption = `${nextReward.pointsCost - totalPoints} points to go`;
  else if (rewards.length) caption = 'Every reward unlocked!';
  else caption = 'Keep earning points';

  return (
    <section className="sh-card" aria-labelledby="sh-progress-title">
      <h2 id="sh-progress-title" className="sh-eyebrow">
        <LuTrophy size={13} aria-hidden="true" /> Your progress
      </h2>

      <div className="sh-progresscard__body">
        <Link to="/student/rewards" className="sh-ring" aria-label={`${totalPoints} points. ${caption}`}>
          <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: RING_SIZE, height: RING_SIZE }}>
            <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`} aria-hidden="true" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
              <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={radius} fill="none" stroke="var(--color-bg-surface-sunken)" strokeWidth={STROKE} />
              <circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={radius}
                fill="none"
                stroke="var(--accent-base)"
                strokeWidth={STROKE}
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - percent)}
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
            </svg>
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span className="sh-ring__value">{totalPoints}</span>
              <span className="sh-ring__unit">points</span>
            </span>
          </span>
          <span className="sh-ring__caption">{caption}</span>
        </Link>

        {nextReward && (
          <Link to="/student/rewards" className="sh-reward">
            <span className="sh-reward__icon" aria-hidden="true">
              <RewardArt imageUrl={nextReward.imageUrl} size={34} />
            </span>
            <span className="sh-reward__name">{nextReward.name}</span>
            <span className="sh-reward__cost">{nextReward.pointsCost} pts</span>
          </Link>
        )}
      </div>
    </section>
  );
}

export default ProgressCard;
