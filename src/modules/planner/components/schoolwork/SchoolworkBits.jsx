import { subjectPaint } from '../../../../components/subjects/subjectColor';
import { minutesLabel } from '../../planView';
import { dueInfo } from '../../schoolwork';
import { dueText, estimateOf, eventTime, shortDay } from './schoolworkFormat';

/** A subject in its colour (admin default or the student's choice); neutral when it has none. */
export function SubjectChip({ subject, color, fallback = null }) {
  const label = subject || fallback;
  if (!label) return null;
  return (
    <span className="sw-chip" {...(subject ? subjectPaint(color) : {})}>
      {label}
    </span>
  );
}

/** The kind of work: "📝 Homework", or just "Homework" when icons are switched off. */
export function TypeTag({ name, icon, showIcon = true }) {
  if (!name) return null;
  return (
    <span className="sw-type">
      {showIcon && icon && (
        <span className="sw-type__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      {name}
    </span>
  );
}

export function DueText({ dueDate, today }) {
  return (
    <span className="sw-due" data-kind={dueInfo(dueDate, today).kind}>
      {dueText(dueDate, today)}
    </span>
  );
}

export function EstimateText({ work }) {
  const minutes = estimateOf(work);
  if (!minutes) return null;
  return <span className="sw-estimate">Estimated: {minutesLabel(minutes)}</span>;
}

/** A practice, dinner or plan with a friend: shown with its category colour, never as schoolwork. */
export function PersonalEventCard({ event, showDate = false }) {
  const color = event.category?.color;
  return (
    <div className="sw-event" style={color ? { '--event-color': color } : undefined}>
      <span className="sw-event__time">
        {showDate ? `${shortDay(event.date)} · ` : ''}
        {eventTime(event)}
      </span>
      <span className="sw-event__title">{event.title}</span>
      <span className="sw-event__kind">
        {event.category?.icon ? `${event.category.icon} ` : ''}
        {event.category?.name ?? 'Personal'}
      </span>
    </div>
  );
}
