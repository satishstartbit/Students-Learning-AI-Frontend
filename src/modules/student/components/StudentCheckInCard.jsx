import { Card, Badge } from '../../../components/common';
import { MOODS, ENERGY_LEVELS, findMood } from './kid/moods';
import { useDailyCheckIn } from '../hooks/useDailyCheckIn';

/**
 * Today's check-in for Grade 6+ - the same mood/energy model as the K-5
 * card (kid/CheckInCard.jsx, kid/moods.js), in a plainer, calmer layout
 * that reads as this audience's age rather than illustrated mood faces.
 *
 * Same UI-only contract as the K-5 card: /check-ins is still a backend
 * stub, so this is sessionStorage-backed via useDailyCheckIn - see that
 * hook for why, and swap it for the real API in one place once it lands.
 */
const MINUTES_OPTIONS = [15, 30, 45, 60];

export function StudentCheckInCard({ userId }) {
  const { mood, energy, availableMinutes, update } = useDailyCheckIn(userId);
  const current = findMood(mood);

  return (
    <Card title="Today's check-in">
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="ui-label" style={{ marginBottom: 'var(--spacing-sm)' }}>
          How are you feeling?
        </legend>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
          {MOODS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => update({ mood: m.value })}
              className="ui-btn ui-btn--sm"
              aria-pressed={mood === m.value}
              style={
                mood === m.value
                  ? { background: 'var(--accent-soft)', color: 'var(--accent-base)', borderColor: 'var(--accent-base)' }
                  : { background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-default)' }
              }
            >
              {m.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset style={{ border: 0, padding: 0, margin: 'var(--spacing-lg) 0 0' }}>
        <legend className="ui-label" style={{ marginBottom: 'var(--spacing-sm)' }}>
          Energy
        </legend>
        <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
          {ENERGY_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => update({ energy: level })}
              aria-label={`Energy ${level} out of ${ENERGY_LEVELS.length}`}
              aria-pressed={energy === level}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: '2px solid var(--accent-base)',
                background: energy && level <= energy ? 'var(--accent-base)' : 'transparent',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
      </fieldset>

      <fieldset style={{ border: 0, padding: 0, margin: 'var(--spacing-lg) 0 0' }}>
        <legend className="ui-label" style={{ marginBottom: 'var(--spacing-sm)' }}>
          Minutes free today
        </legend>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
          {MINUTES_OPTIONS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => update({ availableMinutes: m })}
              className="ui-btn ui-btn--sm"
              aria-pressed={availableMinutes === m}
              style={
                availableMinutes === m
                  ? { background: 'var(--accent-soft)', color: 'var(--accent-base)', borderColor: 'var(--accent-base)' }
                  : { background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-default)' }
              }
            >
              {m} min
            </button>
          ))}
        </div>
      </fieldset>

      {current && (
        <p className="ui-hint" style={{ marginTop: 'var(--spacing-md)' }}>
          <Badge variant="primary">{current.feeling}</Badge>
          {availableMinutes && <span> · {availableMinutes} min free</span>}
        </p>
      )}
    </Card>
  );
}

export default StudentCheckInCard;
