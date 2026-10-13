import { cn } from '../../../../lib/utils';

// The knob sits 3px inside the track; `on` slides it to the far end.
// `before:` pads the hit area out to 48px tall without changing the look.
const SIZES = {
  md: { track: 'h-8 w-14 before:-inset-2', knob: 'size-[26px]', on: 'translate-x-6' },
  sm: { track: 'h-6 w-11 before:-inset-3', knob: 'size-[18px]', on: 'translate-x-5' },
};

function trackTone(checked, disabled) {
  if (disabled) return 'bg-[#f3efeb]';
  return checked ? 'bg-kid-teal hover:bg-kid-teal-deep' : 'bg-[#b5aba3] hover:bg-[#6b625b]';
}

function knobTone(checked, disabled) {
  if (disabled) return checked ? 'bg-[#8f857d]' : 'bg-[#fbf9f7]';
  return 'bg-white shadow-[0_1px_2px_rgb(44_38_33/0.3)]';
}

/**
 * The K-4 on/off switch. It applies the change straight away - there is no
 * Save step, so inside a form that is submitted use a checkbox instead.
 * Always pair it with a visible label (`aria-labelledby`): the switch alone
 * never says what it controls. `md` is the default; `sm` is for dense
 * settings lists only.
 */
export function KidToggle({ checked, onCheckedChange, size = 'md', disabled = false, className, ...props }) {
  const s = SIZES[size];
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex shrink-0 items-center rounded-full p-[3px] transition-colors duration-150 before:absolute disabled:cursor-not-allowed',
        s.track,
        trackTone(checked, disabled),
        className
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          'rounded-full transition-transform duration-150',
          s.knob,
          checked && s.on,
          knobTone(checked, disabled)
        )}
      />
    </button>
  );
}

export default KidToggle;
