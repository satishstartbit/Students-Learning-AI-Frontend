import { LuCheck, LuClock3, LuPlay } from 'react-icons/lu';
import { subjectPaint } from '../../../../components/subjects/subjectColor';
import ProvenanceBadge from '../ProvenanceBadge';
import { LIST_ORDERS, canTick, listSections, planSections, upcomingEvents } from '../../schoolwork';
import { PersonalEventCard, SubjectChip, TypeTag } from './SchoolworkBits';
import { dueInText, dueText, estimateOf, shortMinutes } from './schoolworkFormat';
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

/**
 * One row (the Plan mockup's list): the tick, the subject in its colour and
 * the kind of work, the title, the detail line with when it's due, and on
 * the right how long it takes - plus Start on the first row (`onStart`).
 */
function Row({ work, today, colorOf, preferences, movable, busy, viewer, why, start, onOpen, onMove, onHandIn, onStart }) {
  const done = work.progress === 'done';
  const color = colorOf(work.subject);
  const estimate = preferences.showEstimatedTime ? estimateOf(work) : null;
  // Who added it: always for a parent; for the student, when a parent did (never claims a teacher).
  const showSource = viewer === 'parent' || work.source === 'parent';
  const when = done ? 'Done' : dueInText(work.dueDate, today) ?? dueText(work.dueDate, today);
  return (
    <li className="sw-row" data-done={done || undefined} {...subjectPaint(color)}>
      <Tick work={work} movable={movable} busy={busy} onMove={onMove} onHandIn={onHandIn} />
      <div className="sw-row__main">
        <div className="sw-row__labels">
          <SubjectChip subject={work.subject} color={color} />
          <TypeTag name={work.typeName} icon={work.typeIcon} showIcon={preferences.showTypeIcons} />
        </div>
        <button type="button" className="sw-row__title" onClick={() => onOpen(work)}>
          {work.title}
        </button>
        <p className="sw-row__meta">{[work.details, when].filter(Boolean).join(' · ')}</p>
        {why?.length > 0 && !done && <p className="sw-row__estimate">Why now: {why.join(' · ')}</p>}
      </div>
      {(estimate || start || showSource) && (
        <div className="sw-row__aside">
          {estimate && (
            <span className="sw-time">
              <LuClock3 size={13} aria-hidden="true" /> {shortMinutes(estimate)}
            </span>
          )}
          {start && (
            <button type="button" className="sw-start" onClick={() => onStart(work)} aria-label={`Start ${work.title}`}>
              <LuPlay size={12} fill="currentColor" aria-hidden="true" /> Start
            </button>
          )}
          {showSource && <ProvenanceBadge source={work.source} viewer={viewer} />}
        </div>
      )}
    </li>
  );
}

function Section({ title, count, items, rowProps, startFirst }) {
  return (
    <section className="sw-section" aria-label={title}>
      <h3 className="sw-section__title">
        {title}
        {count != null && <span className="sw-section__count">{count}</span>}
      </h3>
      <ol className="sw-rows">
        {items.map((w, i) => (
          <Row key={w.id} work={w} start={startFirst && i === 0} {...rowProps(w)} />
        ))}
      </ol>
    </section>
  );
}

/**
 * The list: a checklist, each row with its subject in colour, a small label
 * for the kind of work, the detail line, when it's due and how long it should
 * take. Tick own work done right here; teacher work opens so it can be handed
 * in.
 *
 * With `sort` (the Plan page's Sort menu): "Up next" in that order -
 * schoolwork.js#planSections - with Start on the first row (`onStart`), then
 * "Finished". Without it (the parent's Schedule): the older orders - the
 * plan's, Next 3, by due date, by subject - switched with `onOrderChange`.
 */
export function SchoolworkList({
  work = [],
  priorities = [],
  sort,
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
  onStart,
}) {
  const personal = preferences.showPersonalEvents ? upcomingEvents(personalEvents, today) : [];
  // In the plan's own order, each row says why it is where it is (the planner's reasons).
  const planOrder = sort ? sort === 'plan' || sort === 'next3' : order === 'priority' || order === 'next3';
  const whyById = planOrder ? new Map((priorities ?? []).map((p) => [p.assignmentId, p.why ?? []])) : null;
  const rowProps = (w) => ({
    today,
    colorOf,
    preferences,
    movable: canMove(w),
    busy: busyId === w.id,
    viewer,
    why: whyById?.get(w.id),
    onOpen,
    onMove,
    onHandIn,
    onStart,
  });

  let body;
  if (sort) {
    const { open, done } = planSections(work, priorities, sort);
    body =
      open.length === 0 && done.length === 0 ? (
        <p className="sw-muted">Nothing on the list right now.</p>
      ) : (
        <>
          {open.length > 0 ? (
            <Section title="Up next" count={open.length} items={open} rowProps={rowProps} startFirst={Boolean(onStart)} />
          ) : (
            <p className="sw-muted">Nothing left to do - nice work.</p>
          )}
          {done.length > 0 && <Section title="Finished" count={done.length} items={done} rowProps={rowProps} />}
        </>
      );
  } else {
    const sections = listSections(work, priorities, order, today).filter((s) => s.items.length);
    body =
      sections.length === 0 ? (
        <p className="sw-muted">Nothing on the list right now.</p>
      ) : (
        sections.map((section) => {
          const title = section.key.startsWith('subject:') ? section.subject ?? 'No subject' : SECTION_TITLES[section.key] ?? 'To do';
          return <Section key={section.key} title={title} items={section.items} rowProps={rowProps} />;
        })
      );
  }

  return (
    <div className="sw-list" data-variant={variant}>
      {!sort && (
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
      )}

      {body}

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
