import { LuPlus, LuX } from 'react-icons/lu';
import { Button, IconButton, Input } from '../../../components/common';
import PicturePicker from '../media/PicturePicker';
import { MAX_PAIRS, MIN_PAIRS, newPair } from './questionDrafts';

/** One side of a pair (left or right) - a short label, text and/or a compact picture. */
function SideEditor({ label, side, onChange, disabled }) {
  return (
    <div style={{ flex: '1 1 12rem', minWidth: 0 }}>
      <Input
        aria-label={label}
        placeholder={label}
        value={side.text}
        maxLength={200}
        disabled={disabled}
        onChange={(e) => onChange({ ...side, text: e.target.value })}
        reserveHelper={false}
        fieldClassName="ui-field--compact"
      />
      <PicturePicker compact value={side.image} onChange={(image) => onChange({ ...side, image })} disabled={disabled} />
    </div>
  );
}

/**
 * Builds a matching question's 3-8 left/right pairs. Each pair's left item
 * has exactly one correct right match - that pairing is exactly the row, so
 * there's nothing extra to "mark correct" the way mcq needs.
 */
export default function PairsEditor({ pairs, onChange, disabled, error }) {
  const update = (id, patch) => onChange(pairs.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const remove = (id) => onChange(pairs.filter((p) => p.id !== id));

  return (
    <fieldset className="ui-field" style={{ border: 0, padding: 0, margin: '0 0 var(--spacing-md)' }}>
      <legend className="ui-label">Matching pairs - each left item matches exactly one right item</legend>
      <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
        {pairs.map((pair, index) => (
          <div key={pair.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-sm)' }}>
            <span className="ui-hint" style={{ paddingTop: 10, width: 20, flexShrink: 0 }}>
              {index + 1}.
            </span>
            <SideEditor label={`Pair ${index + 1} left item`} side={pair.left} onChange={(left) => update(pair.id, { left })} disabled={disabled} />
            <span aria-hidden="true" className="ui-hint" style={{ paddingTop: 10 }}>
              &harr;
            </span>
            <SideEditor label={`Pair ${index + 1} right item`} side={pair.right} onChange={(right) => update(pair.id, { right })} disabled={disabled} />
            {pairs.length > MIN_PAIRS && (
              <IconButton label={`Remove pair ${index + 1}`} variant="danger" size="sm" onClick={() => remove(pair.id)} disabled={disabled}>
                <LuX aria-hidden="true" />
              </IconButton>
            )}
          </div>
        ))}
      </div>
      {pairs.length < MAX_PAIRS && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          startIcon={<LuPlus />}
          disabled={disabled}
          onClick={() => onChange([...pairs, newPair()])}
          style={{ marginTop: 'var(--spacing-xs)', alignSelf: 'flex-start' }}
        >
          Add pair
        </Button>
      )}
      {error && (
        <p className="ui-hint" role="alert" style={{ color: 'var(--color-danger-fg)', marginBottom: 0 }}>
          {error}
        </p>
      )}
    </fieldset>
  );
}
