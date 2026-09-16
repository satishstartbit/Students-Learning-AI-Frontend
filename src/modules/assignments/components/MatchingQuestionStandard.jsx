import { DragDropProvider, useDraggable, useDroppable } from '@dnd-kit/react';
import { LuGripVertical, LuX } from 'react-icons/lu';
import QuestionPicture from '../media/QuestionPicture';
import { useMatchingAnswer } from '../hooks/useMatchingAnswer';

function ItemLabel({ item }) {
  if (item.image) return <QuestionPicture image={item.image} size="sm" />;
  return <span>{item.text}</span>;
}

/** A right-column item the student can drag onto a left row. */
function DraggableRight({ item, disabled }) {
  const { ref, isDragging } = useDraggable({ id: item.id, disabled });
  return (
    <div
      ref={ref}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={item.text ?? 'Picture item'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-xs)',
        minHeight: 48,
        padding: 'var(--spacing-sm) var(--spacing-md)',
        borderRadius: 'var(--radius-lg)',
        border: '2px solid var(--color-border-control, var(--color-border-default))',
        background: 'var(--color-bg-surface)',
        cursor: disabled ? 'default' : 'grab',
        opacity: isDragging ? 0.4 : 1,
        touchAction: 'none',
      }}
    >
      <LuGripVertical aria-hidden="true" className="ui-hint" />
      <ItemLabel item={item} />
    </div>
  );
}

/** A left row's drop target - shows the currently-matched right item, or an empty slot. */
function DroppableLeft({ left, index, matchedItem, onClear, disabled }) {
  const { ref, isDropTarget } = useDroppable({ id: left.id, disabled });
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-sm)',
        minHeight: 56,
        padding: 'var(--spacing-sm) var(--spacing-md)',
        borderRadius: 'var(--radius-lg)',
        border: '2px solid var(--color-border-control, var(--color-border-default))',
        background: 'var(--color-bg-surface)',
      }}
    >
      <span aria-hidden="true" className="ui-hint">
        {index + 1}.
      </span>
      <ItemLabel item={left} />
      <div
        ref={ref}
        style={{
          marginLeft: 'auto',
          minWidth: 140,
          minHeight: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: matchedItem ? 'space-between' : 'center',
          gap: 6,
          padding: '4px 10px',
          borderRadius: 'var(--radius-md)',
          border: `2px dashed ${isDropTarget ? 'var(--accent-base)' : 'var(--color-border-default)'}`,
          background: isDropTarget ? 'var(--accent-soft)' : matchedItem ? 'var(--color-bg-surface-sunken)' : 'transparent',
        }}
      >
        {matchedItem ? (
          <>
            <ItemLabel item={matchedItem} />
            {!disabled && (
              <button type="button" onClick={onClear} aria-label="Remove this match" style={{ display: 'flex', color: 'var(--color-text-tertiary)' }}>
                <LuX aria-hidden="true" />
              </button>
            )}
          </>
        ) : (
          <span className="ui-hint" style={{ fontSize: '0.85em' }}>
            Drop here
          </span>
        )}
      </div>
    </div>
  );
}

/** Grade 6+ matching: drag a right item onto a left row's drop zone. */
export default function MatchingQuestionStandard({ question, answer, onChange, readOnly = false }) {
  const { pairForLeft, usedRightIds, setPair, clearPair } = useMatchingAnswer(question, answer, onChange, { readOnly });

  const handleDragEnd = (event) => {
    const rightId = event.operation.source?.id;
    const leftId = event.operation.target?.id;
    if (rightId && leftId) setPair(String(leftId), String(rightId));
  };

  const bankItems = question.rightItems.filter((r) => !usedRightIds.has(r.id));

  return (
    <DragDropProvider onDragEnd={handleDragEnd}>
      <div style={{ display: 'grid', gap: 'var(--spacing-lg)', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        <div role="group" aria-label="Left items - drop a matching item here" style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
          {question.leftItems.map((left, index) => {
            const rightId = pairForLeft.get(left.id);
            const matchedItem = rightId ? question.rightItems.find((r) => r.id === rightId) : null;
            return (
              <DroppableLeft key={left.id} left={left} index={index} matchedItem={matchedItem} onClear={() => clearPair(left.id)} disabled={readOnly} />
            );
          })}
        </div>

        <div role="group" aria-label="Items to drag" style={{ display: 'grid', gap: 'var(--spacing-sm)', alignContent: 'start' }}>
          {bankItems.length === 0 && !readOnly && <p className="ui-hint">All items are matched.</p>}
          {bankItems.map((item) => (
            <DraggableRight key={item.id} item={item} disabled={readOnly} />
          ))}
        </div>
      </div>
    </DragDropProvider>
  );
}
