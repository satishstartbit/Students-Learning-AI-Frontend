import { LuCheck } from 'react-icons/lu';
import { cn } from '../../../../lib/utils';

/**
 * Big tappable answer chips for K-4 questions. Real radio/checkbox inputs
 * underneath (visually hidden), so keyboard, screen readers and switch access
 * work without custom key handling - same approach as the check-in card.
 *
 * `value` is a string for single choice, an array for `multiple`.
 */
export function KidChoiceChips({ name, legend, options, value, onChange, multiple = false }) {
  const isChecked = (optionValue) => (multiple ? value.includes(optionValue) : value === optionValue);

  const handle = (optionValue) => {
    if (!multiple) return onChange(optionValue);
    return onChange(isChecked(optionValue) ? value.filter((v) => v !== optionValue) : [...value, optionValue]);
  };

  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const checked = isChecked(option.value);
          return (
            <label
              key={option.value}
              className={cn(
                'relative flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border-[3px] px-4 py-3 font-kid-display text-lg text-kid-ink transition-colors',
                checked ? 'border-kid-teal bg-kid-sky' : 'border-kid-edge bg-kid-sheet hover:bg-white'
              )}
            >
              <input
                type={multiple ? 'checkbox' : 'radio'}
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => handle(option.value)}
                className="peer sr-only"
              />
              {option.emoji && (
                <span aria-hidden="true" className="text-2xl leading-none">
                  {option.emoji}
                </span>
              )}
              <span className="min-w-0 flex-1">{option.label}</span>
              {checked && <LuCheck className="size-6 shrink-0 text-kid-teal" strokeWidth={3} aria-hidden="true" />}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -inset-[3px] rounded-2xl peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-kid-teal peer-focus-visible:outline-solid"
              />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export default KidChoiceChips;
