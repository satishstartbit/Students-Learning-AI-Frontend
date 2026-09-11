/**
 * Design system "Sticky Note": the student's own reminders on their
 * dashboard.
 *
 * Colour is one of six paper tones the student picks for themselves - pure
 * decoration. Never read `tone` to decide anything; it carries no status.
 * The tone list itself lives in utils/constants.js#STICKY_NOTE_TONES
 * (react-refresh forbids a component file from also exporting a constant).
 *
 * Done keeps the note on the board rather than removing it, struck through
 * so finished work visibly piles up (the reward loop this is built for).
 * Confetti on top of this state is a Phase 2 addition, not part of this
 * component.
 *
 * Physicality - the slight rotation and the tighter Elevation/Sticky shadow
 * - comes from `rotateSeed` (typically the note's id) hashed into one of a
 * small set of tilt angles, so a board of notes looks hand-placed without
 * every consumer picking an angle itself. Pass `rotate` to pin an exact
 * value, or `rotate={0}` to turn tilt off entirely (e.g. a single note shown
 * on its own, like in an edit dialog).
 */
const TILT_ANGLES = [-3, -2, -1.2, 1.2, 2, 3];

function hashSeed(seed) {
  const str = String(seed ?? '');
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function resolveRotation(rotate, rotateSeed) {
  if (rotate != null) return rotate;
  if (rotateSeed == null) return 0;
  return TILT_ANGLES[hashSeed(rotateSeed) % TILT_ANGLES.length];
}

export function StickyNote({
  tone = 'yellow',
  title,
  children,
  done = false,
  onToggleDone,
  onSelect,
  onDelete,
  size = 'md',
  rotate,
  rotateSeed,
  className = '',
  style,
  ...rest
}) {
  const angle = resolveRotation(rotate, rotateSeed);
  const labelText = title || (typeof children === 'string' ? children : 'this note');

  const body = (
    <>
      {title && <p className="ui-sticky__title">{title}</p>}
      <p className="ui-sticky__text">{children}</p>
    </>
  );

  return (
    <div
      className={`ui-sticky ui-sticky--${size} ${className}`.trim()}
      data-tone={tone}
      data-done={done || undefined}
      style={{ '--sticky-rotate': `${angle}deg`, ...style }}
      {...rest}
    >
      {onToggleDone && (
        <button
          type="button"
          className="ui-sticky__check"
          aria-pressed={done}
          aria-label={done ? `Mark "${labelText}" not done` : `Mark "${labelText}" done`}
          onClick={onToggleDone}
        />
      )}

      {onDelete && (
        <button
          type="button"
          className="ui-sticky__delete"
          aria-label={`Delete "${labelText}"`}
          onClick={onDelete}
        >
          <span aria-hidden="true">✕</span>
        </button>
      )}

      {onSelect ? (
        <button type="button" className="ui-sticky__body ui-sticky__body--button" onClick={onSelect}>
          {body}
        </button>
      ) : (
        <div className="ui-sticky__body">{body}</div>
      )}
    </div>
  );
}

export default StickyNote;
