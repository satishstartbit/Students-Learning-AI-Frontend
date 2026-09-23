import { useMemo } from 'react';
import { formatDateKey } from '../../../utils/date';
import { describeMood, ENERGY_LEVELS } from '../../checkIn/moods';

/** "2026-09-22" minus n days - calendar arithmetic, no timezone involved. */
function shiftDayKey(dayKey, days) {
  const [y, m, d] = String(dayKey ?? '').split('-').map(Number);
  if (!y || !m || !d) return null;
  const shifted = new Date(Date.UTC(y, m - 1, d + days, 12));
  return shifted.toISOString().slice(0, 10);
}

/** A day's energy, as filled dots out of five. */
function EnergyDots({ energy }) {
  return (
    <span className="pp-day__dots" aria-hidden="true">
      {ENERGY_LEVELS.map((level) => (
        <span key={level} className={`pp-dot${level <= energy ? ' pp-dot--on' : ''}`} />
      ))}
    </span>
  );
}

/**
 * The last `days` days of check-ins as one strip: a mood face per day, energy
 * underneath, and a dashed circle where the child didn't check in.
 *
 * The strip is built from the day keys themselves, not from the history rows,
 * because a missing day is exactly what it needs to show - the API only
 * returns the days that have a check-in.
 */
export function ProgressCheckInStrip({ history = [], todayKey, days = 14, name }) {
  const byDate = useMemo(() => new Map(history.map((row) => [row.date, row])), [history]);

  const columns = useMemo(() => {
    if (!todayKey) return [];
    return Array.from({ length: days }, (_, i) => {
      const date = shiftDayKey(todayKey, -(days - 1 - i));
      return { date, entry: date ? byDate.get(date) : null };
    }).filter((c) => c.date);
  }, [byDate, days, todayKey]);

  const summary = useMemo(() => {
    const entries = columns.map((c) => c.entry).filter(Boolean);
    const tally = new Map();
    entries.forEach((e) => tally.set(e.mood, (tally.get(e.mood) ?? 0) + 1));
    const [topMood] = [...tally.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];
    return {
      mostCommon: topMood ? describeMood(topMood).name : null,
      checkedIn: entries.length,
      // "Low energy" is the bottom two of the five levels - the days worth
      // a parent's attention.
      lowEnergy: entries.filter((e) => e.energy <= 2).length,
    };
  }, [columns]);

  return (
    <section className="pp-block">
      <h3 className="pp-block__title">Check-ins, last {days} days</h3>
      <p className="pp-block__lead">
        How {name ?? 'your child'} has been arriving each day. A dashed circle means no check-in that day.
      </p>

      <div className="pp-strip">
        {columns.map(({ date, entry }) => {
          const mood = entry ? describeMood(entry.mood) : null;
          const weekday = formatDateKey(date, { weekday: 'short', year: undefined, month: undefined, day: undefined });
          const dayNum = formatDateKey(date, { year: undefined, month: undefined, day: 'numeric' });

          return (
            <div key={date} className="pp-day">
              <span className="pp-day__weekday">{weekday}</span>
              <span className="pp-day__num">{dayNum}</span>

              {entry ? (
                <span
                  className="pp-face"
                  data-mood={entry.mood}
                  title={`${formatDateKey(date)}: ${mood.name}, energy ${entry.energy}/${ENERGY_LEVELS.length}`}
                >
                  <span aria-hidden="true">{mood.emoji}</span>
                  <span className="ui-sr-only">
                    {formatDateKey(date)}: {mood.name}, energy {entry.energy} of {ENERGY_LEVELS.length}
                  </span>
                </span>
              ) : (
                <span className="pp-face pp-face--empty" title={`${formatDateKey(date)}: no check-in`}>
                  <span aria-hidden="true">–</span>
                  <span className="ui-sr-only">{formatDateKey(date)}: no check-in</span>
                </span>
              )}

              {entry ? <EnergyDots energy={entry.energy} /> : <span className="pp-day__dots" />}
            </div>
          );
        })}
      </div>

      <p className="pp-strip__summary">
        {summary.mostCommon && (
          <span>
            Most common: <strong>{summary.mostCommon}</strong>
          </span>
        )}
        <span>
          Check-ins:{' '}
          <strong>
            {summary.checkedIn} of {columns.length} days
          </strong>
        </span>
        <span>
          Low energy days: <strong>{summary.lowEnergy}</strong>
        </span>
      </p>
    </section>
  );
}

export default ProgressCheckInStrip;
