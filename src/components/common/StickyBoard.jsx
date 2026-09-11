import Card from './Card';
import StickyNote from './StickyNote';

/**
 * "My Notes" - a card of the student's sticky notes plus an add tile, for a
 * dashboard. Notes render at the compact `sm` size and scroll horizontally
 * rather than wrapping, so the row stays one board-like strip at any width.
 *
 * @param notes    [{ id, tone, title?, text, done }]
 * @param onAdd    opens the create-note flow; omit to hide the add tile
 * @param onToggleDone(note)  omit to make done read-only
 * @param onSelect(note)      open a note for editing; omit to make notes inert
 * @param onDelete(note)      omit to hide the delete affordance
 */
export function StickyBoard({ notes = [], onAdd, onToggleDone, onSelect, onDelete, title = 'My Notes' }) {
  const count = notes.length;

  return (
    <Card title={title} subtitle={`${count} ${count === 1 ? 'note' : 'notes'}`}>
      {count === 0 && !onAdd ? (
        <p className="ui-hint">No notes yet.</p>
      ) : (
        <div className="ui-sticky-board__row">
          {notes.map((note) => (
            <StickyNote
              key={note.id}
              size="sm"
              tone={note.tone}
              title={note.title}
              done={note.done}
              rotateSeed={note.id}
              onToggleDone={onToggleDone && (() => onToggleDone(note))}
              onSelect={onSelect && (() => onSelect(note))}
              onDelete={onDelete && (() => onDelete(note))}
            >
              {note.text}
            </StickyNote>
          ))}

          {onAdd && (
            <button type="button" className="ui-sticky-board__add" onClick={onAdd}>
              <span className="ui-sticky-board__add-icon" aria-hidden="true">
                +
              </span>
              Add a note
            </button>
          )}
        </div>
      )}
    </Card>
  );
}

export default StickyBoard;
