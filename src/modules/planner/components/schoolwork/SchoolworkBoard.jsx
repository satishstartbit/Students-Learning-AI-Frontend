import { useState } from 'react';
import { subjectPaint } from '../../../../components/subjects/subjectColor';
import { COLUMNS, boardColumns, moveActions, upcomingEvents } from '../../schoolwork';
import { DueText, EstimateText, PersonalEventCard, TypeTag } from './SchoolworkBits';
import './schoolwork.css';

const EMPTY = {
  todo: 'Nothing waiting. Nice.',
  doing: 'Press Start on a note, or drag one here.',
  done: 'Work you finish shows here for two weeks.',
};

/** Where `work` may be dropped: a move the server allows, or Done for teacher work (= hand it in on its page). */
function canDrop(work, column) {
  if (!work || column === work.progress) return false;
  if ((work.moves ?? []).includes(column)) return true;
  return work.kind === 'teacher' && column === 'done' && work.progress !== 'done';
}

function Note({ work, today, colorOf, preferences, movable, busy, variant, dragging, onDragStart, onDragEnd, onOpen, onMove, onHandIn }) {
  const actions = movable ? moveActions(work) : [];
  const draggable = movable && !busy && (canDrop(work, 'todo') || canDrop(work, 'doing') || canDrop(work, 'done'));
  return (
    <li>
      <article
        className="sw-note"
        data-variant={variant}
        data-done={work.progress === 'done' || undefined}
        data-dragging={dragging || undefined}
        draggable={draggable || undefined}
        onDragStart={draggable ? (e) => onDragStart(e, work) : undefined}
        onDragEnd={draggable ? onDragEnd : undefined}
        aria-busy={busy || undefined}
        {...subjectPaint(colorOf(work.subject))}
      >
        <p className="sw-note__subject">{work.subject || 'No subject'}</p>
        <button type="button" className="sw-note__title" onClick={() => onOpen(work)}>
          {work.title}
        </button>
        {work.details && <p className="sw-note__details">{work.details}</p>}
        <p className="sw-note__meta">
          {work.progress === 'done' ? <span className="sw-due">Done</span> : <DueText dueDate={work.dueDate} today={today} />}
          <TypeTag name={work.typeName} icon={work.typeIcon} showIcon={preferences.showTypeIcons} />
          {preferences.showEstimatedTime && work.progress !== 'done' && <EstimateText work={work} />}
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
    </li>
  );
}

/**
 * Sticky notes: every piece of schoolwork as a note in its subject's colour,
 * in To Do / Doing / Done, in the plan's priority order (the planner still
 * decides what matters most - this is just a visual way to see it).
 *
 * Moving a note changes the work's real status (onMove), so every other view
 * agrees. Drag and drop, or the buttons on each note (touch and keyboard).
 * Teacher work is started here and handed in on its own page (onHandIn).
 *
 *   canMove(work)   who may move this note (a parent: only work a parent added)
 *   preferences     showTypeIcons, showEstimatedTime, showPersonalEvents
 *   personalEvents  shown in a fourth "Personal" column when switched on
 */
export function SchoolworkBoard({
  work = [],
  priorities = [],
  today,
  colorOf = () => null,
  preferences,
  personalEvents = [],
  canMove = () => true,
  busyId = null,
  variant,
  onOpen,
  onMove,
  onHandIn,
}) {
  const [dragging, setDragging] = useState(null);
  const [over, setOver] = useState(null);
  const columns = boardColumns(work, priorities);
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
      {COLUMNS.map((col) => (
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
            {col.label}
            <span className="sw-col__count" aria-label={`${columns[col.key].length} ${columns[col.key].length === 1 ? 'item' : 'items'}`}>
              {columns[col.key].length}
            </span>
          </h3>
          {columns[col.key].length === 0 ? (
            <p className="sw-col__empty">{EMPTY[col.key]}</p>
          ) : (
            <ul className="sw-notes">
              {columns[col.key].map((w) => (
                <Note
                  key={w.id}
                  work={w}
                  today={today}
                  colorOf={colorOf}
                  preferences={preferences}
                  movable={canMove(w)}
                  busy={busyId === w.id}
                  variant={variant}
                  dragging={dragging?.id === w.id}
                  onDragStart={(e, item) => {
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', item.id);
                    setDragging(item);
                  }}
                  onDragEnd={() => {
                    setDragging(null);
                    setOver(null);
                  }}
                  onOpen={onOpen}
                  onMove={onMove}
                  onHandIn={onHandIn}
                />
              ))}
            </ul>
          )}
        </section>
      ))}
      {personal && (
        <section className="sw-col" aria-labelledby="sw-col-personal">
          <h3 id="sw-col-personal" className="sw-col__head">
            Personal
            <span className="sw-col__count">{personal.length}</span>
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
