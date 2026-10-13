import { LuCheck } from 'react-icons/lu';
import { ACCENTS } from '../../theme';
import './accentPicker.css';

/**
 * "Colour theme" - the accent family picker.
 *
 * The families are the ones theme/accent.css ships (theme/index.js ACCENTS),
 * each hand-tuned for light and dark, and the backend validates a saved
 * choice against the same list.
 *
 * `variant="kid"` is the same picker with bigger targets for the K-4 page.
 * Saving is the caller's job, so this works with either settings provider.
 */
export function AccentPicker({ value, onChange, disabled = false, variant, label = 'Colour theme' }) {
  return (
    <ul className={`ap-list${variant === 'kid' ? ' ap-list--kid' : ''}`} aria-label={label}>
      {ACCENTS.map((option) => {
        const selected = value === option.value;
        return (
          <li key={option.value}>
            <button
              type="button"
              className="ap-option"
              style={{ '--ap-swatch': option.swatch, '--ap-swatch-soft': option.swatchSoft }}
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => onChange(option.value)}
            >
              <span className="ap-swatch" aria-hidden="true" />
              <span className="ap-label">{option.label}</span>
              {selected && (
                <span className="ap-tick" aria-hidden="true">
                  <LuCheck size={12} strokeWidth={3} />
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export default AccentPicker;
