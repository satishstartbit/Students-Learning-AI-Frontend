import { STICKY_NOTE_TONES } from '../../utils/constants';

/**
 * The "six colours, chosen by the student" affordance - a row of paper-tone
 * swatches, styled as a single-select radio group. Colour is decoration
 * only, so this has no notion of a "correct" choice, just the current one.
 */
export function StickyNoteColorPicker({ value, onChange, tones = STICKY_NOTE_TONES }) {
  return (
    <div className="ui-sticky-swatches" role="radiogroup" aria-label="Note colour">
      {tones.map((tone) => (
        <button
          key={tone}
          type="button"
          role="radio"
          aria-checked={value === tone}
          aria-label={tone}
          data-tone={tone}
          className="ui-sticky-swatch"
          onClick={() => onChange?.(tone)}
        />
      ))}
    </div>
  );
}

export default StickyNoteColorPicker;
