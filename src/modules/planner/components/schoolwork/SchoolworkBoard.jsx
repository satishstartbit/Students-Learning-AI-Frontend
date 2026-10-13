import { useState } from 'react';
import { LuCalendarDays, LuCircleCheck, LuClock3, LuPlus } from 'react-icons/lu';
import { subjectPaint } from '../../../../components/subjects/subjectColor';
import { COLUMNS, boardColumns, moveActions, upcomingEvents } from '../../schoolwork';
import { PersonalEventCard, TypeTag } from './SchoolworkBits';
import { dueInText, estimateOf, shortMinutes } from './schoolworkFormat';
import './schoolwork.css';

const EMPTY = {
  todo: 'Nothing waiting. Nice.',
  doing: 'Open a note and press Start, or drag one here.',
  done: 'Work you finish shows here for two weeks.',
};

/** A small, steady tilt per note, so the board looks pinned up by hand (never random between renders). */
const TILTS = ['-1deg', '0.7deg', '-0.5deg', '1deg', '-0.8deg', '0.4deg'];

/** Where `work` may be dropped: a move the server allows, or Done for teacher work (= hand it in on its page). */
function canDrop(work, column) {
  if (!work || column === work.progress) return false;
  if ((work.moves ?? []).includes(column)) return true;
  return work.kind === 'teacher' && column === 'done' && work.progress !== 'done';
}

/**
 * The Plan mockup's sticky note: tape on top, the subject on a white pill and
 * the kind of work, the title, the detail line, then when it's due, how long
 * it takes and its steps. Finished work says "Done". The move buttons
 * (`showActions`) are for the parent's board; a student opens the note to
 * move it, or drags it.
 */
function Note({ work, today, colorOf, preferences, showActions, busy, onOpen, onMove, onHandIn }) {
  const done = work.progress === 'done';
  const actions = showActions ? moveActions(work) : [];
  const due = dueInText(work.dueDate, today);
  const estimate = preferences.showEstimatedTime ? estimateOf(work) : null;
  return (
    <article className="sw-note" data-done={done || undefined} aria-busy={busy || undefined} {...subjectPaint(colorOf(work.subject))}>
      <span className="sw-note__tape" aria-hidden="true" />
      <div className="sw-note__labels">
        <span className="sw-note__pill">{work.subject || 'No subject'}</span>
        <TypeTag name={work.typeName} icon={work.typeIcon} showIcon={preferences.showTypeIcons} />
      </div>
      <button type="button" className="sw-note__title" onClick={() => onOpen(work)}>
        {work.title}
      </button>
      {work.details && <p className="sw-note__details">{work.details}</p>}
      <p className="sw-note__meta">
        {done ? (
          <span className="sw-note__done">
            <LuCircleCheck size={13} aria-hidden="true" /> Done
          </span>
        ) : (
          due && (
            <span className="sw-note__due" data-kind={work.dueDate ? undefined : 'none'}>
              <LuCalendarDays size={13} aria-hidden="true" /> {due}
            </span>
          )
        )}
        {estimate && (
          <span>
            <LuClock3 size={13} aria-hidden="true" /> {shortMinutes(estimate)}
          </span>
        )}
        {work.stepsTotal > 0 && (
          <span>
            {work.stepsDone}/{work.stepsTotal} steps
          </span>
        )}
      </p>
      {actions.length > 0 && (
        <div className="sw-note__actions">
          {actions.map((a) => (
            <button
              key={a.to}
              type="button"
              className="sw-note__action"
              disabled={busy}
              aria-label={`${a.label}: ${work.title}`}
              onClick={() => (a.to === 'handIn' ? onHandIn(work) : onMove(work, a.to))}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </article>
  );
}

/**
 * Sticky notes: every piece of schoolwork as a note in its subject's colour,
 * in To Do / Doing / Done, in the order the page's Sort picks (`sort`,
 * schoolwork.js#sortWork - the plan's order by default).
 *
 * Moving a note changes the work's real status (onMove), so every other view
 * agrees: drag it, or open it (onOpen) and use the dialog's buttons - or,
 * with `showActions`, the buttons on the note itself. Teacher work is started
 * here and handed in on its own page (onHandIn).
 *
 *   canMove(work)   who may move this note (a parent: only work a parent added)
 *   preferences     showTypeIcons, showEstimatedTime, showPersonalEvents
 *   personalEvents  shown in a fourth "Personal" column when switched on
 *   onAdd()         a dashed "+ Add assignment" under To Do
 *   renderNote(work, { busy })   the note's face instead of the standard one (K-4)
 *   columnLabels    rename the columns ({ done: 'Done!' })
 *   showCounts      the count beside each column's name (default true)
 */
export function SchoolworkBoard({
  work = [],
  priorities = [],
  sort = 'plan',
  today,
  colorOf = () => null,
  preferences,
  personalEvents = [],
  canMove = () => true,
  busyId = null,
  variant,
  showActions = false,
  showCounts = true,
  columnLabels = {},
  renderNote,
  onAdd,
  onOpen,
  onMove,
  onHandIn,
}) {
  const [dragging, setDragging] = useState(null);
  const [over, setOver] = useState(null);
  const columns = boardColumns(work, priorities, sort);
  const personal = preferences.showPersonalEvents ? upcomingEvents(personalEvents, today) : null;

  const drop = (column) => {
    const w = dragging;
    setDragging(null);
    setOver(null);
    if (!w || !canDrop(w, column)) return;
    if ((w.moves ?? []).includes(column)) onMove(w, column);
    else onHandIn(w);
  };

  return (
    <div className="sw-board" data-variant={variant} style={personal ? { '--sw-cols': 4 } : undefined}>
      {COLUMNS.map((col) => {
        const items = columns[col.key];
        const label = columnLabels[col.key] ?? col.label;
        return (
          <section
            key={col.key}
            className="sw-col"
            aria-labelledby={`sw-col-${col.key}`}
            data-drop={over === col.key ? 'ok' : undefined}
            onDragOver={(e) => {
              if (!canDrop(dragging, col.key)) return;
              e.preventDefault();
              if (over !== col.key) setOver(col.key);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) setOver((current) => (current === col.key ? null : current));
            }}
            onDrop={(e) => {
              e.preventDefault();
              drop(col.key);
            }}
          >
            <h3 id={`sw-col-${col.key}`} className="sw-col__head">
              {label}
              {showCounts && (
                <span className="sw-col__count" aria-label={`${items.length} ${items.length === 1 ? 'item' : 'items'}`}>
                  {items.length}
                </span>
              )}
            </h3>
            {items.length === 0 ? (
              <p className="sw-col__empty">{EMPTY[col.key]}</p>
            ) : (
              <ul className="sw-notes">
                {items.map((w, i) => {
                  const busy = busyId === w.id;
                  const draggable = canMove(w) && !busy && (canDrop(w, 'todo') || canDrop(w, 'doing') || canDrop(w, 'done'));
                  return (
                    <li
                      key={w.id}
                      className="sw-notes__item"
                      data-dragging={dragging?.id === w.id || undefined}
                      draggable={draggable || undefined}
                      style={{ '--sw-tilt': TILTS[i % TILTS.length] }}
                      onDragStart={
                        draggable
                          ? (e) => {
                              e.dataTransfer.effectAllowed = 'move';
                              e.dataTransfer.setData('text/plain', w.id);
                              setDragging(w);
                            }
                          : undefined
                      }
                      onDragEnd={
                        draggable
                          ? () => {
                              setDragging(null);
                              setOver(null);
                            }
                          : undefined
                      }
                    >
                      {renderNote ? (
                        renderNote(w, { busy })
                      ) : (
                        <Note
                          work={w}
                          today={today}
                          colorOf={colorOf}
                          preferences={preferences}
                          showActions={showActions && canMove(w)}
                          busy={busy}
                          onOpen={onOpen}
                          onMove={onMove}
                          onHandIn={onHandIn}
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            {col.key === 'todo' && onAdd && (
              <button type="button" className="sw-col__add" onClick={onAdd}>
                <LuPlus size={15} aria-hidden="true" /> Add assignment
              </button>
            )}
          </section>
        );
      })}
      {personal && (
        <section className="sw-col" aria-labelledby="sw-col-personal">
          <h3 id="sw-col-personal" className="sw-col__head">
            Personal
            {showCounts && <span className="sw-col__count">{personal.length}</span>}
          </h3>
          <p className="sw-col__hint">This week’s plans outside school - not schoolwork.</p>
          {personal.length === 0 ? (
            <p className="sw-col__empty">No personal plans this week.</p>
          ) : (
            <ul className="sw-notes">
              {personal.map((event) => (
                <li key={event.id}>
                  <PersonalEventCard event={event} showDate />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

export default SchoolworkBoard;
