import { Link } from 'react-router-dom';
import { LuHeart, LuPlus } from 'react-icons/lu';
import { formatDateKey, getClockMinutesInTimezone, weekdayOfKey } from '../../../../utils/date';
import { PersonalEventCard } from '../../../planner/components/schoolwork/SchoolworkBits';
import { shortMinutes } from '../../../planner/components/schoolwork/schoolworkFormat';
import { agendaItems, blockStats } from '../../../planner/schoolwork';
import PlanBlockCard from './PlanBlockCard';

/** What an empty weekend day says (the Plan mockup): Saturday catches up, Sunday looks ahead. */
function weekendNote(dayKey) {
  const weekday = weekdayOfKey(dayKey);
  if (weekday === 5) return { title: 'Catch up', text: 'Use this if you’re behind.' };
  if (weekday === 6) return { title: 'Plan ahead', text: 'Look at next week.', action: 'next-week' };
  return null;
}

/**
 * One day of the Grade 6+ calendar (the Plan mockup): its header, what is
 * due that day (a small "Due" line - the cards are the study times), the
 * study times the planner put on it as cards in the page's Sort order, the
 * student's personal activities (shown, never schoolwork), and at the foot
 * Add (new work pre-dated to this day), how many study times are done and
 * the time planned. An empty Saturday says "Catch up", Sunday "Plan ahead".
 *
 *   blocks       this day's study times, already in the Sort order
 *   inTimeOrder  "Recommended": study times and personal plans together, by
 *                the clock (the full calendar); otherwise the plans follow
 *   due          the tasks due this day (useTodayTasks shape)
 *   isTeacherWork(assignmentId)   for the card's person icon
 */
export function PlanDayColumn({
  dayKey,
  todayKey,
  selectedKey,
  isLoading,
  layout = 'week',
  blocks = [],
  inTimeOrder = false,
  due = [],
  events = [],
  timeZone,
  colorOf = () => null,
  isTeacherWork = () => false,
  onOpenBlock,
  onPickDay,
  onAdd,
  onOpenOwn,
  onNextWeek,
}) {
  const items = inTimeOrder
    ? agendaItems(blocks, events, (b) => getClockMinutesInTimezone(b.startAt, { timeZone }))
    : [...blocks.map((b) => ({ kind: 'study', key: `study:${b.id}`, item: b })), ...events.map((e) => ({ kind: 'event', key: `event:${e.id}`, item: e }))];
  const isToday = dayKey === todayKey;
  const isSelected = dayKey === selectedKey && !isToday;
  const stats = blockStats(blocks);
  const openDue = due.filter((t) => !t.done);
  const note = blocks.length === 0 && events.length === 0 ? weekendNote(dayKey) : null;
  const weekday = formatDateKey(dayKey, { weekday: layout === 'day' ? 'long' : 'short', month: undefined, day: undefined, year: undefined });
  const dayNumber = formatDateKey(dayKey, { day: 'numeric', month: layout === 'day' ? 'long' : undefined, year: undefined });
  const fullLabel = formatDateKey(dayKey, { weekday: 'long', month: 'long', day: 'numeric', year: undefined });
  const isWeekend = weekdayOfKey(dayKey) >= 5;

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
        onClick={() => onPickDay(dayKey)}
        aria-label={layout === 'day' ? fullLabel : `Open ${fullLabel} in day view`}
        disabled={layout === 'day'}
      >
        <span className="sp-day__weekday">{weekday}</span>
        <span className="sp-day__number">{dayNumber}</span>
        {isToday && layout === 'day' && <span className="sp-day__badge">Today</span>}
      </button>

      {openDue.length > 0 && (
        <ul className="sp-dueflags" aria-label={`Due ${fullLabel}`}>
          {openDue.map((task) => {
            const late = dayKey < todayKey;
            const content = (
              <>
                <span className="sp-dueflag__label">{late ? 'Overdue' : 'Due'}</span>
                <span className="sp-dueflag__title">{task.title}</span>
              </>
            );
            return (
              <li key={task.key}>
                {task.type === 'own' ? (
                  <button type="button" className="sp-dueflag" data-late={late || undefined} onClick={() => onOpenOwn(task)}>
                    {content}
                  </button>
                ) : (
                  <Link to={`/student/assignments/${task.assignmentId}`} className="sp-dueflag" data-late={late || undefined}>
                    {content}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="sp-day__tasks">
        {isLoading ? (
          <div className="sp-skeleton" aria-hidden="true" />
        ) : (
          items.map(({ kind, key, item }) =>
            kind === 'study' ? (
              <PlanBlockCard
                key={key}
                block={item}
                color={colorOf(item.subject)}
                fromTeacher={isTeacherWork(item.assignmentId)}
                showTime={layout === 'day'}
                timeZone={timeZone}
                todayKey={todayKey}
                onOpen={onOpenBlock}
              />
            ) : (
              <div key={key} className="sp-event">
                <PersonalEventCard event={item} />
              </div>
            )
          )
        )}
        {!isLoading &&
          note &&
          (note.action === 'next-week' ? (
            <button type="button" className="sp-rest" onClick={onNextWeek}>
              <LuHeart size={15} aria-hidden="true" />
              <span className="sp-rest__title">{note.title}</span>
              <span className="sp-rest__text">{note.text}</span>
            </button>
          ) : (
            <div className="sp-rest">
              <LuHeart size={15} aria-hidden="true" />
              <span className="sp-rest__title">{note.title}</span>
              <span className="sp-rest__text">{note.text}</span>
            </div>
          ))}
      </div>

      <div className="sp-day__foot">
        <button type="button" className="sp-add" onClick={() => onAdd(dayKey)} aria-label={`Add a task for ${fullLabel}`}>
          <LuPlus size={13} aria-hidden="true" /> Add
        </button>
        {blocks.length > 0 || !isWeekend ? (
          <>
            <span className="sp-day__stat">
              {stats.done} / {stats.total} done
            </span>
            <span
              className="sp-bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={Math.max(stats.total, 1)}
              aria-valuenow={stats.done}
              aria-label={`${stats.done} of ${stats.total} study times done`}
            >
              <span className="sp-bar__fill" style={{ width: stats.total ? `${(stats.done / stats.total) * 100}%` : 0 }} />
            </span>
          </>
        ) : (
          // Same rows as a planned day, so every Add button lines up across the week.
          <>
            <span className="sp-day__stat" aria-hidden="true">
              &nbsp;
            </span>
            <span className="sp-bar" data-empty="true" aria-hidden="true" />
          </>
        )}
        <span className="sp-day__stat">{stats.minutes > 0 ? `${shortMinutes(stats.minutes)} planned` : 'Nothing planned'}</span>
      </div>
    </section>
  );
}

export default PlanDayColumn;
