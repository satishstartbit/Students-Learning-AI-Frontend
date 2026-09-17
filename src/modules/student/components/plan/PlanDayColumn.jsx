import { LuCalendarCheck, LuCoffee, LuHeart, LuPlus } from 'react-icons/lu';
import { formatDateKey, formatDurationLong, weekdayOfKey } from '../../../../utils/date';
import PlanTaskCard from './PlanTaskCard';

/** What an empty day says - weekends nudge toward planning, weekdays just rest. */
function emptyState(dayKey, todayKey) {
  const weekday = weekdayOfKey(dayKey);
  if (weekday === 6) return { icon: LuHeart, title: 'Plan ahead', text: 'Look at next week.', action: 'next-week' };
  if (weekday === 5) return { icon: LuCoffee, title: 'Catch up', text: 'Finish anything left over, or rest.' };
  if (dayKey < todayKey) return { icon: LuCalendarCheck, title: 'Nothing was due', text: 'A lighter day.' };
  return { icon: LuCalendarCheck, title: 'Free day', text: 'Nothing due yet.' };
}

/**
 * One day on the Plan board: its header, the tasks due that day, an Add
 * button (a new own task pre-dated to this day) and the day's totals.
 */
export function PlanDayColumn({ day, todayKey, selectedKey, isLoading, layout = 'week', onPickDay, onAdd, onOpenOwn, onNextWeek }) {
  const isToday = day.key === todayKey;
  const isSelected = day.key === selectedKey && !isToday;
  const doneCount = day.items.filter((t) => t.done).length;
  const minutes = day.items.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  const empty = emptyState(day.key, todayKey);
  const EmptyIcon = empty.icon;
  const weekday = formatDateKey(day.key, { weekday: layout === 'day' ? 'long' : 'short', month: undefined, day: undefined, year: undefined });
  const dayNumber = formatDateKey(day.key, { day: 'numeric', month: layout === 'day' ? 'long' : undefined, year: undefined });
  const fullLabel = formatDateKey(day.key, { weekday: 'long', month: 'long', day: 'numeric', year: undefined });

  return (
    <section
      className="sp-day"
      data-layout={layout}
      data-today={isToday || undefined}
      data-selected={isSelected || undefined}
      aria-label={`${fullLabel}${isToday ? ' (today)' : ''}`}
    >
      <button
        type="button"
        className="sp-day__head"
        onClick={() => onPickDay(day.key)}
        aria-label={layout === 'day' ? fullLabel : `Open ${fullLabel} in day view`}
        disabled={layout === 'day'}
      >
        <span className="sp-day__weekday">{weekday}</span>
        <span className="sp-day__number">{dayNumber}</span>
        {isToday && layout === 'day' && <span className="sp-day__badge">Today</span>}
      </button>

      <div className="sp-day__tasks">
        {isLoading ? (
          <div className="sp-skeleton" aria-hidden="true" />
        ) : day.items.length === 0 ? (
          empty.action === 'next-week' ? (
            <button type="button" className="sp-rest" onClick={onNextWeek}>
              <EmptyIcon size={16} aria-hidden="true" />
              <span className="sp-rest__title">{empty.title}</span>
              <span className="sp-rest__text">{empty.text}</span>
            </button>
          ) : (
            <div className="sp-rest">
              <EmptyIcon size={16} aria-hidden="true" />
              <span className="sp-rest__title">{empty.title}</span>
              <span className="sp-rest__text">{empty.text}</span>
            </div>
          )
        ) : (
          day.items.map((task) => (
            <PlanTaskCard key={task.key} task={task} isOverdue={!task.done && day.key < todayKey} onOpenOwn={onOpenOwn} />
          ))
        )}
      </div>

      <div className="sp-day__foot">
        <button type="button" className="sp-add" onClick={() => onAdd(day.key)} aria-label={`Add a task for ${fullLabel}`}>
          <LuPlus size={13} aria-hidden="true" /> Add
        </button>
        {day.items.length > 0 ? (
          <>
            <span className="sp-day__stat">
              {doneCount} / {day.items.length} done
            </span>
            <span
              className="sp-bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={day.items.length}
              aria-valuenow={doneCount}
              aria-label={`${doneCount} of ${day.items.length} done`}
            >
              <span className="sp-bar__fill" style={{ width: `${(doneCount / day.items.length) * 100}%` }} />
            </span>
            <span className="sp-day__stat">{minutes > 0 ? `${formatDurationLong(minutes)} planned` : 'No time estimate'}</span>
          </>
        ) : (
          // Same three rows as a planned day, so every Add button lines up across the week.
          <>
            <span className="sp-day__stat" aria-hidden="true">
              &nbsp;
            </span>
            <span className="sp-bar" data-empty="true" aria-hidden="true" />
            <span className="sp-day__stat">Nothing planned</span>
          </>
        )}
      </div>
    </section>
  );
}

export default PlanDayColumn;
