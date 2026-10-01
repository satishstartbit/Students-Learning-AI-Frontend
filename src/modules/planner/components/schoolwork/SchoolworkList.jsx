import { LuCheck } from 'react-icons/lu';
import { subjectPaint } from '../../../../components/subjects/subjectColor';
import ProvenanceBadge from '../ProvenanceBadge';
import { LIST_ORDERS, canTick, listSections, upcomingEvents } from '../../schoolwork';
import { EstimateText, PersonalEventCard, SubjectChip, TypeTag } from './SchoolworkBits';
import { dueText } from './schoolworkFormat';
import './schoolwork.css';

const SECTION_TITLES = {
  priority: null,
  next3: 'The three most important things right now',
  overdue: 'Past the due date',
  today: 'Due today',
  week: 'Due this week',
  later: 'Due later',
  none: 'No due date',
  done: 'Done',
};
const ORDER_HINTS = {
  priority: 'Sorted by due date and urgency',
  next3: 'Just the next three',
  due: 'Grouped by when it’s due',
  subject: 'Grouped by subject',
};

function Tick({ work, movable, busy, onMove, onHandIn }) {
  const done = work.progress === 'done';
  if (movable && canTick(work)) {
    return (
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={done ? `Mark “${work.title}” as not done` : `Mark “${work.title}” as done`}
        className="sw-tick"
        disabled={busy}
        onClick={() => onMove(work, done ? 'todo' : 'done')}
      >
        {done && <LuCheck size={15} strokeWidth={3} aria-hidden="true" />}
      </button>
    );
  }
  if (movable && work.kind === 'teacher' && !done) {
    // Teacher work is handed in on its own page; the circle takes the student there.
    return <button type="button" className="sw-tick" aria-label={`Open “${work.title}” to hand it in`} onClick={() => onHandIn(work)} />;
  }
  return (
    <span className="sw-tick" role="img" aria-label={done ? 'Done' : 'Not done yet'} data-checked={done || undefined}>
      {done && <LuCheck size={15} strokeWidth={3} aria-hidden="true" />}
    </span>
  );
}

function Row({ work, today, colorOf, preferences, movable, busy, viewer, why, onOpen, onMove, onHandIn }) {
  const color = colorOf(work.subject);
  const paint = subjectPaint(color);
  // Who added it: always for a parent; for the student, when a parent did (never claims a teacher).
  const showSource = viewer === 'parent' || work.source === 'parent';
  return (
    <li className="sw-row" data-done={work.progress === 'done' || undefined} style={paint.style}>
      <Tick work={work} movable={movable} busy={busy} onMove={onMove} onHandIn={onHandIn} />
      <div className="sw-row__main">
        <div className="sw-row__labels">
          <SubjectChip subject={work.subject} color={color} />
          <TypeTag name={work.typeName} icon={work.typeIcon} showIcon={preferences.showTypeIcons} />
        </div>
        <button type="button" className="sw-row__title" onClick={() => onOpen(work)}>
          {work.title}
        </button>
        <p className="sw-row__meta">{[work.details, work.progress === 'done' ? null : dueText(work.dueDate, today)].filter(Boolean).join(' · ')}</p>
        {preferences.showEstimatedTime && work.progress !== 'done' && (
          <p className="sw-row__estimate">
            <EstimateText work={work} />
          </p>
        )}
        {why?.length > 0 && work.progress !== 'done' && <p className="sw-row__estimate">Why now: {why.join(' · ')}</p>}
      </div>
      {(showSource || work.progress === 'doing') && (
        <div className="sw-row__aside">
          {work.progress === 'doing' && <span className="sw-chip">Doing</span>}
          {showSource && <ProvenanceBadge source={work.source} viewer={viewer} />}
        </div>
      )}
    </li>
  );
}

/**
 * The list: a simple checklist with the most urgent work at the top (the
 * server plan's order - due date and urgency), each row with its subject in
 * colour, a small label for the kind of work, the detail line, when it's due
 * and how long it should take. Tick own work done right here; teacher work
 * opens so it can be handed in. Other orders: Next 3, by due date, by subject.
 */
export function SchoolworkList({
  work = [],
  priorities = [],
  today,
  colorOf = () => null,
  preferences,
  personalEvents = [],
  order = 'priority',
  onOrderChange,
  canMove = () => true,
  busyId = null,
  viewer = 'student',
  variant,
  onOpen,
  onMove,
  onHandIn,
}) {
  const sections = listSections(work, priorities, order, today).filter((s) => s.items.length);
  const personal = preferences.showPersonalEvents ? upcomingEvents(personalEvents, today) : [];
  // In the plan's own order, each row says why it is where it is (the planner's reasons).
  const whyById = order === 'priority' || order === 'next3' ? new Map((priorities ?? []).map((p) => [p.assignmentId, p.why ?? []])) : null;

  return (
    <div data-variant={variant}>
      <div className="sw-list-head">
        <p className="sw-muted" style={{ margin: 0 }}>
          {ORDER_HINTS[order]}
        </p>
        {onOrderChange && (
          <div className="sw-views" role="group" aria-label="Order the list by">
            {LIST_ORDERS.map((o) => (
              <button key={o.key} type="button" aria-pressed={order === o.key} onClick={() => onOrderChange(o.key)}>
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {sections.length === 0 ? (
        <p className="sw-muted">Nothing on the list right now.</p>
      ) : (
        sections.map((section) => {
          const title = section.key.startsWith('subject:') ? section.subject ?? 'No subject' : SECTION_TITLES[section.key];
          return (
            <section key={section.key} className="sw-section" aria-label={title ?? 'To do'}>
              {title && <h3 className="sw-section__title">{title}</h3>}
              <ol className="sw-rows">
                {section.items.map((w) => (
                  <Row
                    key={w.id}
                    work={w}
                    today={today}
                    colorOf={colorOf}
                    preferences={preferences}
                    movable={canMove(w)}
                    busy={busyId === w.id}
                    viewer={viewer}
                    why={whyById?.get(w.id)}
                    onOpen={onOpen}
                    onMove={onMove}
                    onHandIn={onHandIn}
                  />
                ))}
              </ol>
            </section>
          );
        })
      )}

      {personal.length > 0 && (
        <section className="sw-section" aria-label="Personal plans this week">
          <h3 className="sw-section__title">Personal plans this week (not schoolwork)</h3>
          <ul className="sw-agenda">
            {personal.map((event) => (
              <li key={event.id}>
                <PersonalEventCard event={event} showDate />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export default SchoolworkList;
