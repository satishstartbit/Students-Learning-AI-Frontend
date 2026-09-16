import { useState } from 'react';
import { LuCheck, LuX } from 'react-icons/lu';
import QuestionPicture from '../media/QuestionPicture';
import { useMatchingAnswer } from '../hooks/useMatchingAnswer';

function ItemLabel({ item }) {
  if (item.image) return <QuestionPicture image={item.image} size="sm" />;
  return <span>{item.text}</span>;
}

/**
 * K-5 matching: tap a left item, then tap a right item to pair them - no
 * dragging. Big touch targets, one thing armed at a time so a young student
 * always knows what their next tap does.
 */
export default function MatchingQuestionKid({ question, answer, onChange, readOnly = false }) {
  const { pairForLeft, leftForRight, usedRightIds, setPair, clearPair } = useMatchingAnswer(question, answer, onChange, { readOnly });
  const [armedLeftId, setArmedLeftId] = useState(null);

  const tapLeft = (leftId) => {
    if (readOnly) return;
    if (pairForLeft.get(leftId)) {
      clearPair(leftId);
      setArmedLeftId(leftId);
      return;
    }
    setArmedLeftId((current) => (current === leftId ? null : leftId));
  };

  const tapRight = (rightId) => {
    if (readOnly) return;
    if (armedLeftId) {
      setPair(armedLeftId, rightId);
      setArmedLeftId(null);
      return;
    }
    // Tapping an already-placed right item first un-pairs it and arms its left item, so a re-tap swaps the match.
    const currentLeft = leftForRight.get(rightId);
    if (currentLeft) {
      clearPair(currentLeft);
      setArmedLeftId(currentLeft);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 'var(--spacing-md)', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
      <div role="group" aria-label="Left items" style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
        {question.leftItems.map((left, index) => {
          const rightId = pairForLeft.get(left.id);
          const matchedItem = rightId ? question.rightItems.find((r) => r.id === rightId) : null;
          const armed = armedLeftId === left.id;
          return (
            <button
              key={left.id}
              type="button"
              onClick={() => tapLeft(left.id)}
              disabled={readOnly}
              aria-pressed={armed}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                minHeight: 56,
                padding: 'var(--spacing-sm) var(--spacing-md)',
                borderRadius: 'var(--radius-lg)',
                border: `2px solid ${armed ? 'var(--accent-base)' : 'var(--color-border-control, var(--color-border-default))'}`,
                background: armed ? 'var(--accent-soft)' : 'var(--color-bg-surface)',
                textAlign: 'left',
                cursor: readOnly ? 'default' : 'pointer',
              }}
            >
              <span aria-hidden="true" className="ui-hint">
                {index + 1}.
              </span>
              <ItemLabel item={left} />
              <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                {matchedItem ? (
                  <>
                    <LuCheck aria-hidden="true" style={{ color: 'var(--color-success-fg)' }} />
                    <ItemLabel item={matchedItem} />
                  </>
                ) : (
                  <span className="ui-hint">{armed ? 'Tap a match →' : 'Tap to match'}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div role="group" aria-label="Right items" style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
        {question.rightItems.map((right) => {
          const used = usedRightIds.has(right.id);
          return (
            <button
              key={right.id}
              type="button"
              onClick={() => tapRight(right.id)}
              disabled={readOnly || (used && !armedLeftId)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 'var(--spacing-sm)',
                minHeight: 56,
                padding: 'var(--spacing-sm) var(--spacing-md)',
                borderRadius: 'var(--radius-lg)',
                border: '2px solid var(--color-border-control, var(--color-border-default))',
                background: used ? 'var(--color-bg-surface-sunken)' : 'var(--color-bg-surface)',
                opacity: used && !armedLeftId ? 0.6 : 1,
                textAlign: 'left',
                cursor: readOnly ? 'default' : 'pointer',
              }}
            >
              <ItemLabel item={right} />
              {used && <LuX aria-hidden="true" className="ui-hint" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
