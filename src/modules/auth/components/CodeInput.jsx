import { useRef } from 'react';

/**
 * One box per digit for a short numeric code ("Check your email" on sign-up).
 * Typing moves to the next box, Backspace on an empty box goes back, the
 * arrow keys move, and pasting a whole code fills every box. `value` is an
 * array of single digits ('' for an empty box).
 *
 * @param onComplete  called with the full code when the last box is filled
 */
export function CodeInput({ value, onChange, onComplete, error = false, disabled = false, label = 'Verification code', id = 'code' }) {
  const refs = useRef([]);
  const length = value.length;
  const focusBox = (i) => refs.current[Math.max(0, Math.min(length - 1, i))]?.focus();

  const update = (next, focusAt) => {
    onChange(next);
    if (focusAt != null) focusBox(focusAt);
    if (next.every(Boolean)) onComplete?.(next.join(''));
  };

  const fillFrom = (start, digits) => {
    const next = [...value];
    let i = start;
    for (const d of digits) {
      if (i >= length) break;
      next[i] = d;
      i += 1;
    }
    update(next, i);
  };

  return (
    <div role="group" aria-labelledby={`${id}-label`}>
      <span id={`${id}-label`} className="lg-code__label">
        {label}
      </span>
      <div className="lg-code" data-error={error || undefined}>
        {value.map((digit, i) => (
          <input
            // Boxes never reorder - the position is the identity.
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className="lg-code__box"
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            maxLength={length}
            value={digit}
            disabled={disabled}
            aria-label={`Digit ${i + 1} of ${length}`}
            aria-invalid={error || undefined}
            onFocus={(e) => e.target.select()}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '');
              if (!digits) {
                const next = [...value];
                next[i] = '';
                update(next);
                return;
              }
              // Typing over a filled box gives "old+new" (or "new+old") -
              // keep the new digit. Anything longer is autofill or a paste
              // that skipped onPaste: spread it from this box on.
              if (digit && digits.length === 2) {
                fillFrom(i, digits.startsWith(digit) ? digits[1] : digits[0]);
              } else {
                fillFrom(i, digits);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && !digit && i > 0) {
                e.preventDefault();
                const next = [...value];
                next[i - 1] = '';
                update(next, i - 1);
              } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                focusBox(i - 1);
              } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                focusBox(i + 1);
              }
            }}
            onPaste={(e) => {
              const digits = e.clipboardData.getData('text').replace(/\D/g, '');
              if (!digits) return;
              e.preventDefault();
              fillFrom(digits.length >= length ? 0 : i, digits);
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default CodeInput;
