import { Badge } from '../../../components/common';
import { ENERGY_LEVELS } from '../../checkIn/moods';
import { useMoodLookup } from '../../checkIn/hooks/useMoodLookup';
import { MOOD_TONE } from '../stages';
import MoodIcon from './MoodIcon';

/**
 * Today's check-in at a glance: the feeling, energy, and time - or "Not
 * checked in yet".
 *
 * The face is the mood's own icon from Master Management (useMoodLookup),
 * not a static emoji, so a teacher or parent sees exactly what the student
 * picked. The badge's colour still comes from MOOD_TONE, which is about how
 * much attention a feeling deserves rather than what it looks like.
 */
export function CheckInBadge({ today, showDetails = true }) {
  const { moodFor } = useMoodLookup();

  if (!today?.checkedIn) return <Badge variant="neutral">Not checked in yet</Badge>;

  const { checkIn } = today;
  const mood = moodFor(checkIn.mood);

  return (
    <span style={{ display: 'inline-flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
      <Badge variant={MOOD_TONE[checkIn.mood] ?? 'neutral'}>
        <MoodIcon mood={mood} size={16} />
        {mood?.name ?? checkIn.mood}
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
