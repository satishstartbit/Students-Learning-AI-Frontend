import { formatDateKey } from '../../../../utils/date';
import { blocksByDay } from '../../planView';
import { eventsByDay } from '../../schoolwork';
import DayAgenda from './DayAgenda';
import { SubjectChip } from './SchoolworkBits';
import './schoolwork.css';

/**
 * A week of the full calendar, read-only (the parent's Schedule): each day's
 * study times and personal activities in time order, then what is due that
 * day. Times are the child's own (plan.timezone).
 */
export function ScheduleWeek({ days = [], plan, work = [], colorOf = () => null, showTypeIcons = true, onOpenWork }) {
  const blocks = blocksByDay(plan?.blocks ?? []);
  const events = eventsByDay(plan?.personalEvents ?? []);
  const today = plan?.today;
  const dueByDay = new Map();
  for (const w of work) {
    if (!w.dueDate || w.progress === 'done') continue;
    const key = String(w.dueDate).slice(0, 10);
    if (!dueByDay.has(key)) dueByDay.set(key, []);
    dueByDay.get(key).push(w);
  }

  return (
    <div className="sw-week">
      {days.map((key) => {
        const due = dueByDay.get(key) ?? [];
        const label = formatDateKey(key, { weekday: 'long', month: 'long', day: 'numeric', year: undefined });
        return (
          <section key={key} className="sw-day" data-today={key === today || undefined} aria-label={`${label}${key === today ? ' (today)' : ''}`}>
            <h3 className="sw-day__head">{formatDateKey(key, { weekday: 'short', month: 'short', day: 'numeric', year: undefined })}</h3>
            <DayAgenda
              blocks={blocks.get(key) ?? []}
              events={events.get(key) ?? []}
              timeZone={plan?.timezone}
              colorOf={colorOf}
              showTypeIcons={showTypeIcons}
              emptyText={due.length ? null : 'Nothing planned'}
              compact
            />
            {due.length > 0 && (
              <div>
                <p className="sw-section__title" style={{ marginBottom: 4 }}>
                  Due
                </p>
                <ul className="sw-agenda">
                  {due.map((w) => (
                    <li key={w.id} className="pl-row" style={{ gap: 6 }}>
                      <SubjectChip subject={w.subject} color={colorOf(w.subject)} />
                      {onOpenWork ? (
                        <button type="button" className="sw-slot__title" style={{ cursor: 'pointer' }} onClick={() => onOpenWork(w)}>
                          {w.title}
                        </button>
                      ) : (
                        <span className="sw-slot__title">{w.title}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

export default ScheduleWeek;
