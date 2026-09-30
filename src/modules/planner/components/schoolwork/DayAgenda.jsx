import { LuPin } from 'react-icons/lu';
import { normalizeHex } from '../../../../components/subjects/subjectColor';
import { formatTime, getClockMinutesInTimezone } from '../../../../utils/date';
import { agendaItems } from '../../schoolwork';
import { eventTime } from './schoolworkFormat';
import './schoolwork.css';

const BLOCK_STATUS = { done: 'Done', missed: 'Missed - moved to a later time' };

/**
 * One day of the full calendar, in time order: the study times the planner
 * placed (coloured by subject, labelled "Homework · Math") and the student's
 * personal activities - practice, family dinner, plans with friends -
 * coloured by their category. Personal events are here so the day reads
 * true; they never become schoolwork.
 *
 *   timeZone     the student's zone (plan.timezone) - a parent sees the child's times
 *   onOpenBlock  a future study time opens the move / keep dialog (left out = read only)
 */
export function DayAgenda({
  blocks = [],
  events = [],
  timeZone,
  todayKey,
  colorOf = () => null,
  showTypeIcons = true,
  onOpenBlock,
  emptyText = null,
  compact = false,
}) {
  const items = agendaItems(blocks, events, (b) => getClockMinutesInTimezone(b.startAt, { timeZone }));
  if (!items.length) return emptyText ? <p className="sw-muted">{emptyText}</p> : null;

  return (
    // `compact`: a narrow week column - each time sits above its title.
    <ol className="sw-agenda" data-compact={compact || undefined} aria-label="Study times and plans">
      {items.map(({ kind, key, item }) => {
        if (kind === 'event') {
          return (
            <li key={key} className="sw-slot" style={item.category?.color ? { '--slot-color': item.category.color } : undefined}>
              <span className="sw-slot__time">{eventTime(item)}</span>
              <span className="sw-slot__bar" aria-hidden="true" />
              <span className="sw-slot__body">
                <span className="sw-slot__title">{item.title}</span>
                <span className="sw-slot__kind">
                  {item.category?.icon && showTypeIcons ? `${item.category.icon} ` : ''}
                  {item.category?.name ?? 'Personal'}
                </span>
              </span>
            </li>
          );
        }
        const color = normalizeHex(colorOf(item.subject));
        const editable = Boolean(onOpenBlock) && item.status === 'scheduled' && (!todayKey || item.date >= todayKey);
        const kindLine = [
          item.typeName ? `${showTypeIcons && item.typeIcon ? `${item.typeIcon} ` : ''}${item.typeName}` : null,
          item.subject,
          item.assignmentTitle && item.assignmentTitle !== item.title ? item.assignmentTitle : null,
          BLOCK_STATUS[item.status],
        ]
          .filter(Boolean)
          .join(' · ');
        return (
          <li key={key} className="sw-slot" data-status={item.status} style={color ? { '--slot-color': color } : { '--slot-color': 'var(--accent-base)' }}>
            <span className="sw-slot__time">
              {formatTime(item.startAt, { timeZone })}
              {item.pinned && <LuPin size={10} aria-label="Kept where you put it" style={{ marginLeft: 3 }} />}
            </span>
            <span className="sw-slot__bar" aria-hidden="true" />
            <span className="sw-slot__body">
              {editable ? (
                <button type="button" className="sw-slot__title" onClick={() => onOpenBlock(item)} aria-label={`${item.title}, ${formatTime(item.startAt, { timeZone })} - move or keep`}>
                  {item.title}
                </button>
              ) : (
                <span className="sw-slot__title">{item.title}</span>
              )}
              {kindLine && <span className="sw-slot__kind">{kindLine}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default DayAgenda;
