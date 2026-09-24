import { useState } from 'react';
import { LuPlus, LuX } from 'react-icons/lu';
import { Button, Input } from '../../../../components/common';

/**
 * A short list of short things - "ruler", "calculator", "glue stick".
 *
 * Stored as an array of strings rather than one free-text field on purpose:
 * the check-in reason "I can't find the materials I need" is meant to be
 * matched against these entries later, which a comma-separated blob would
 * make guesswork.
 *
 * Enter adds, so a teacher can type a list without reaching for the mouse.
 */
export function TagListInput({ label, hint, value = [], onChange, placeholder, max = 30, disabled = false }) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const entry = draft.trim();
    if (!entry || value.length >= max) return;
    // Case-insensitive, so "Ruler" doesn't join "ruler" in the list.
    if (!value.some((v) => v.toLowerCase() === entry.toLowerCase())) onChange([...value, entry]);
    setDraft('');
  };

  const remove = (entry) => onChange(value.filter((v) => v !== entry));

  return (
    <div className="af-tags">
      <div className="af-tags__row">
        <Input
          label={label}
          hint={hint}
          value={draft}
          disabled={disabled || value.length >= max}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return;
            // Enter belongs to this field here, not to the form's save.
            event.preventDefault();
            add();
          }}
          placeholder={placeholder}
          maxLength={120}
        />
        <Button type="button" variant="secondary" onClick={add} disabled={disabled || !draft.trim()}>
          <LuPlus aria-hidden="true" />
          Add
        </Button>
      </div>

      {value.length > 0 && (
        <ul className="af-tags__list" aria-label={label}>
          {value.map((entry) => (
            <li key={entry} className="af-tag">
              {entry}
              <button
                type="button"
                className="af-tag__remove"
                aria-label={`Remove ${entry}`}
                disabled={disabled}
                onClick={() => remove(entry)}
              >
                <LuX size={12} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default TagListInput;
