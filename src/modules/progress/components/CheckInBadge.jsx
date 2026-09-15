import { Badge } from '../../../components/common';
import { findMood, ENERGY_LEVELS } from '../../checkIn/moods';
import { MOOD_TONE } from '../stages';

/** Today's check-in at a glance: the feeling, energy, and time - or "Not checked in yet". */
export function CheckInBadge({ today, showDetails = true }) {
  if (!today?.checkedIn) return <Badge variant="neutral">Not checked in yet</Badge>;

  const { checkIn } = today;
  const mood = findMood(checkIn.mood);

  return (
    <span style={{ display: 'inline-flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
      <Badge variant={MOOD_TONE[checkIn.mood] ?? 'neutral'}>
        <span aria-hidden="true">{mood?.emoji}</span> {mood?.label ?? checkIn.mood}
      </Badge>
      {showDetails && (
        <span className="ui-hint">
          Energy {checkIn.energy}/{ENERGY_LEVELS.length}
          {checkIn.availableMinutes != null ? ` · ${checkIn.availableMinutes} min` : ''}
        </span>
      )}
    </span>
  );
}

export default CheckInBadge;
