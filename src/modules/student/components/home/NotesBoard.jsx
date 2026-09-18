import { LuCheck, LuPlus, LuStickyNote, LuX } from 'react-icons/lu';

/**
 * "My Notes" - the student's own sticky notes (backend: /notes) pinned to a
 * board: taped, torn, folded or corner-taped paper, each slightly tilted.
 *
 * Paper style cycles by the note's age (oldest first, so adding a note never
 * restyles the ones already there) and the tilt comes from its id - a note
 * keeps the same look on every visit without storing anything; the colour is
 * the student's own choice (`tone`). Click a note to edit it, tick it done
 * (it stays on the board, faded, so finished reminders visibly pile up), or
 * remove it.
 */

// Indexed by age, oldest = 0 - so a board of four newest-first notes reads tape, torn, fold, corner like the mockup.
const PAPER_STYLES = ['corner', 'fold', 'torn', 'tape'];

/**
 * "Make it yours" -> Sticky note style. Picking one puts every note on the
 * same paper; "classic" keeps the mixed board the mockup shows.
 */
const CHOSEN_PAPER = { folded: 'fold', torn: 'torn', tag: 'corner' };
const TILTS = [-2.5, 2, -1.5, 3, -3, 1.5];

function hash(seed) {
  let h = 0;
  const str = String(seed ?? '');
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function PaperNote({ note, age, paperStyle, onOpen, onToggleDone, onDelete }) {
  const seed = hash(note.id);
  const style = paperStyle ?? PAPER_STYLES[age % PAPER_STYLES.length];
  const tilt = TILTS[seed % TILTS.length];
  const label = note.title || note.content;

  return (
    <li
      className="sh-note"
      data-tone={note.tone}
      data-style={style}
      data-done={note.done || undefined}
      style={{ '--sh-note-rotate': `${tilt}deg`, listStyle: 'none' }}
    >
      <button type="button" className="sh-note__paper" onClick={() => onOpen(note)} aria-label={`Edit note: ${label}`}>
        {note.title && <span className="sh-note__title">{note.title}</span>}
        <span className="sh-note__text">{note.content}</span>
      </button>
      {style !== 'fold' && <span className="sh-note__tape" aria-hidden="true" />}
      {style === 'fold' && <span className="sh-note__fold" aria-hidden="true" />}

      <button
        type="button"
        className="sh-note__check"
        aria-pressed={note.done}
        aria-label={note.done ? `Mark "${label}" not done` : `Mark "${label}" done`}
        onClick={() => onToggleDone(note)}
      >
        <LuCheck size={13} strokeWidth={3} aria-hidden="true" />
      </button>
      <button type="button" className="sh-note__delete" aria-label={`Delete "${label}"`} onClick={() => onDelete(note)}>
        <LuX size={12} aria-hidden="true" />
      </button>
    </li>
  );
}

export function NotesBoard({ notes, isLoading, error, onRetry, onAdd, onOpen, onToggleDone, onDelete, noteStyle }) {
  const count = notes.length;

  return (
    <section className="sh-card sh-notes" aria-labelledby="sh-notes-title">
      <header className="sh-card__head">
        <div className="sh-card__heading">
          <span className="sh-card__icon" aria-hidden="true">
            <LuStickyNote size={15} />
          </span>
          <div>
            <h2 id="sh-notes-title" className="sh-card__title">
              My Notes
            </h2>
            <p className="sh-card__subtitle">
              {count} {count === 1 ? 'note' : 'notes'}
            </p>
          </div>
        </div>
      </header>

      <ul className="sh-board" style={{ margin: 0 }} aria-busy={isLoading || undefined}>
        {error && count === 0 ? (
          <li className="sh-board__empty" style={{ listStyle: 'none' }}>
            Couldn&apos;t load your notes.{' '}
            <button type="button" className="sh-card__link" onClick={onRetry}>
              Try again
            </button>
          </li>
        ) : (
          notes.map((note, index) => (
            <PaperNote
              key={note.id}
              note={note}
              age={count - 1 - index}
              paperStyle={CHOSEN_PAPER[noteStyle]}
              onOpen={onOpen}
              onToggleDone={onToggleDone}
              onDelete={onDelete}
            />
          ))
        )}
        <li style={{ listStyle: 'none' }}>
          <button type="button" className="sh-note-add" onClick={onAdd}>
            <LuPlus size={18} aria-hidden="true" />
            Add a note
          </button>
        </li>
      </ul>
    </section>
  );
}

export default NotesBoard;
