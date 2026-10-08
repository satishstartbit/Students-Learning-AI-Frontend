import { useState } from 'react';
import { Alert, Button } from '../../../components/common';
import { isTodayInTimezone } from '../../../utils/date';
import RewardArt from '../components/rewards/RewardArt';
import '../components/rewards/studentRewards.css';
import { useRewards } from '../hooks/useRewards';

/**
 * /student/rewards for Grade 6+ (K-4 has KidRewardsPage), built to the Grade
 * 6-12 rewards mockup. Rewards are collectibles: a sticker or emoji is
 * collected automatically once earned points reach its level (backend
 * services/reward.service.js) - there's nothing to buy or redeem here.
 */

const TABS = [
  { key: 'stickers', label: 'Stickers' },
  { key: 'emojis', label: 'Emojis' },
];

const RING = 92;
const STROKE = 10;

function ProgressRing({ value, points }) {
  const r = (RING - STROKE) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="rw-ring" aria-hidden="true">
      <svg width={RING} height={RING} viewBox={`0 0 ${RING} ${RING}`}>
        <circle cx={RING / 2} cy={RING / 2} r={r} fill="none" stroke="var(--accent-soft)" strokeWidth={STROKE} />
        <circle
          cx={RING / 2}
          cy={RING / 2}
          r={r}
          fill="none"
          stroke="var(--accent-base)"
          strokeWidth={STROKE}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value)}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
        />
      </svg>
      <span>
        <span className="rw-ring__value">{points}</span>
        <span className="rw-ring__unit">points</span>
      </span>
    </div>
  );
}

function RewardTile({ reward, index }) {
  const isNew = reward.collected && isTodayInTimezone(reward.collectedAt);
  const label = reward.collected
    ? `${reward.name}, collected`
    : `${reward.name}, ${reward.pointsCost} points to unlock`;

  return (
    <li>
      <div className="rw-tile" data-collected={reward.collected || undefined} data-new={isNew || undefined} aria-label={label} role="group">
        {isNew && <span className="rw-tile__badge">New</span>}
        <RewardArt imageUrl={reward.imageUrl} size={64} locked={!reward.collected} delay={(index % 6) * 0.25} />
        <span className="rw-tile__name">{reward.name}</span>
        {!reward.collected && <span className="rw-tile__hint">{reward.pointsCost} pts to unlock</span>}
      </div>
    </li>
  );
}

export default function RewardsPage() {
  const rewards = useRewards();
  const [tab, setTab] = useState('stickers');

  const list = tab === 'emojis' ? rewards.emojis : rewards.stickers;
  const nextText = rewards.next
    ? `Next up: ${rewards.next.name} ${rewards.next.rewardType === 'emoji' ? 'emoji' : 'sticker'} at ${rewards.next.pointsCost} points — ${rewards.toGo} to go.`
    : rewards.items.length
      ? 'You’ve collected every reward - amazing work!'
      : 'Rewards are on their way.';

  return (
    <div className="rw-page td-page">
      <h1 className="rw-title">Rewards</h1>
      <p className="rw-subtitle">Everything you have collected, and what is coming next.</p>

      {rewards.error && (
        <Alert variant="error" className="ui-field">
          {rewards.error.message}{' '}
          <Button variant="secondary" size="sm" onClick={rewards.reload}>
            Try again
          </Button>
        </Alert>
      )}

      <section className="rw-progress" aria-label="Your points">
        <ProgressRing value={rewards.progress} points={rewards.points} />
        <div className="rw-progress__body">
          <h2 className="rw-progress__title">
            {rewards.isLoading ? 'Loading your points…' : `${rewards.points} points earned so far`}
          </h2>
          <p className="rw-progress__text">{rewards.isLoading ? ' ' : nextText}</p>
          <div
            className="rw-bar"
            role="progressbar"
            aria-label={rewards.next ? `Progress to ${rewards.next.name}` : 'Rewards progress'}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(rewards.progress * 100)}
          >
            <div className="rw-bar__fill" style={{ width: `${Math.round(rewards.progress * 100)}%` }} />
          </div>
        </div>
      </section>

      <div className="rw-tabs" role="tablist" aria-label="Reward type">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            id={`rw-tab-${t.key}`}
            aria-controls="rw-panel"
            aria-selected={tab === t.key}
            className="rw-tab"
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div id="rw-panel" role="tabpanel" aria-labelledby={`rw-tab-${tab}`}>
        {rewards.isLoading ? (
          <ul className="rw-grid" aria-busy="true">
            {Array.from({ length: 6 }, (_, i) => (
              <li key={i} className="rw-skeleton" />
            ))}
          </ul>
        ) : list.length === 0 ? (
          <p className="rw-empty">No {tab} to collect yet - check back soon.</p>
        ) : (
          <ul className="rw-grid">
            {list.map((reward, i) => (
              <RewardTile key={reward.id} reward={reward} index={i} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
