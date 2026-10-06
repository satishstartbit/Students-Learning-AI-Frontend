import { forwardRef, useCallback, useId, useLayoutEffect, useRef, useState } from 'react';
import Input from './Input';
import Label from './Label';
import FieldHelper from './FieldHelper';
import { formatPhoneAsYouType } from '../../utils/phone';
import { PHONE_PARTS, fillPhoneParts, isOtherCountryPhone, joinPhone, splitPhone } from '../../utils/phoneFormat';

const LAST = PHONE_PARTS.length - 1;
const AUTOCOMPLETE = { area: 'tel-area-code', exchange: 'tel-local-prefix', line: 'tel-local-suffix' };

/**
 * The phone field every form uses: "+1" and three boxes - area code, first 3
 * digits, last 4 digits - so a Canadian number is entered as
 * +1 (XXX) XXX-XXXX. Same props as Input; the value is still one string
 * ("+1 (416) 555-1234", "" when empty), so `{...form.getFieldProps('phone')}`,
 * validation and the API (which stores E.164) are unchanged.
 *
 *  - typing moves on to the next box when one is full; Backspace at the start
 *    of a box deletes the last digit of the box before; arrow keys cross boxes
 *  - pasting or autofilling a whole number into any box fills all three
 *    ("4165551234", "+1 416 555 1234", "(416) 555-1234" all work)
 *  - a number from another country ("+44 20 7946 0958", stored or pasted) is
 *    shown in one free-format field instead; clearing it brings the boxes back
 */
export const PhoneInput = forwardRef(function PhoneInput(
  {
    id,
    name,
    label,
    value,
    onChange,
    onBlur,
    hint,
    error,
    required = false,
    optional = false,
    disabled = false,
    readOnly = false,
    reserveHelper = true,
    autoComplete = 'tel',
    fieldClassName = '',
    className = '',
  },
  ref
) {
  const generatedId = useId();
  const baseId = id || `${name || 'phone'}-${generatedId}`;
  const labelId = `${baseId}-label`;
  const helperId = hint || error ? `${baseId}-helper` : undefined;
  const boxes = useRef([]);
  const groupRef = useRef(null);
  // { value, box, start, end }: where the caret goes once `value` is on screen.
  const pending = useRef(null);
  // A foreign number was just pasted into a box: its field opens focused.
  const [focusOther, setFocusOther] = useState(false);

  const current = value ?? '';
  const other = isOtherCountryPhone(current);
  const parts = splitPhone(current);

  const setFirstRef = useCallback(
    (node) => {
      boxes.current[0] = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref]
  );

  const moveTo = useCallback((box, start, end = start) => {
    const node = boxes.current[box];
    if (!node) return;
    node.focus();
    node.setSelectionRange(Math.min(start, node.value.length), Math.min(end, node.value.length));
  }, []);

  useLayoutEffect(() => {
    const want = pending.current;
    if (!want) return;
    pending.current = null;
    // Only for the value it was meant for - never on some later, unrelated render.
    if (want.value === current) moveTo(want.box, want.start, want.end);
  });

  /** Sends `next` to the form, and where the caret should be once it is on screen. */
  const emit = (next, caret = null) => {
    pending.current = caret && next !== current ? { value: next, ...caret } : null;
    // Same value: there may be no render to wait for, so move once the browser has settled.
    if (caret && next === current) requestAnimationFrame(() => moveTo(caret.box, caret.start, caret.end));
    onChange?.({ target: { name, value: next, type: 'tel' } });
  };

  const handleBoxChange = (index) => (event) => {
    const input = event.target;
    const raw = input.value;
    const at = input.selectionStart ?? raw.length;
    const { parts: next, box, caret } = fillPhoneParts(parts, index, raw);
    const joined = joinPhone(next);
    const full = next[index].length === PHONE_PARTS[index].length;
    const grew = next[index].length > parts[index].length;

    if (at < raw.length) {
      // Editing inside the box: the caret stays where it was.
      emit(joined, { box: index, start: Math.min(at, next[index].length) });
    } else if (box !== index) {
      // Digits ran on into the next boxes: follow the last one.
      emit(joined, { box, start: caret });
    } else if (grew && full && index < LAST) {
      // Box full: on to the next one, its digits selected so typing replaces them.
      emit(joined, { box: index + 1, start: 0, end: next[index + 1].length });
    } else {
      emit(joined);
    }
  };

  const handleKeyDown = (index) => (event) => {
    const input = event.target;
    const start = input.selectionStart ?? 0;
    if (start !== (input.selectionEnd ?? start)) return; // a selection: let the key act on it
    if (event.key === 'Backspace' && start === 0 && index > 0) {
      // At the start of a box: delete the last digit of the box before.
      event.preventDefault();
      const next = [...parts];
      next[index - 1] = next[index - 1].slice(0, -1);
      emit(joinPhone(next), { box: index - 1, start: next[index - 1].length });
    } else if (event.key === 'ArrowLeft' && start === 0 && index > 0) {
      event.preventDefault();
      moveTo(index - 1, parts[index - 1].length);
    } else if (event.key === 'ArrowRight' && start === input.value.length && index < LAST) {
      event.preventDefault();
      moveTo(index + 1, 0);
    }
  };

  const handlePaste = (event) => {
    const text = event.clipboardData?.getData('text') ?? '';
    if (isOtherCountryPhone(text)) {
      // Another country: the one free-format field takes over.
      event.preventDefault();
      setFocusOther(true);
      emit(formatPhoneAsYouType(text));
      return;
    }
    if (text.replace(/\D/g, '').length < 10) return; // a few digits: the box takes them as typed
    // A whole number, wherever it is pasted: all three boxes.
    event.preventDefault();
    const next = splitPhone(text);
    emit(joinPhone(next), { box: LAST, start: next[LAST].length });
  };

  // The foreign-number field: cleared, or turned into a +1 number, the boxes come back.
  const handleOtherChange = (event) => {
    const formatted = formatPhoneAsYouType(event.target.value);
    if (isOtherCountryPhone(formatted)) {
      emit(formatted);
      return;
    }
    setFocusOther(false);
    const next = splitPhone(formatted);
    const open = next.findIndex((part, i) => part.length < PHONE_PARTS[i].length);
    const box = open === -1 ? LAST : open;
    emit(joinPhone(next), { box, start: next[box].length });
  };

  // The form's onBlur (it marks the field touched) fires once focus leaves all three boxes.
  const handleGroupBlur = (event) => {
    if (groupRef.current?.contains(event.relatedTarget)) return;
    onBlur?.({ target: { name, value: current, type: 'tel' } });
  };

  if (other) {
    return (
      <Input
        ref={ref}
        id={baseId}
        name={name}
        label={label}
        type="tel"
        inputMode="tel"
        autoComplete={autoComplete}
        value={current}
        onChange={handleOtherChange}
        onBlur={onBlur}
        hint={hint ?? 'A number from outside Canada and the U.S. Clear it to enter a +1 number.'}
        error={error}
        required={required}
        optional={optional}
        disabled={disabled}
        readOnly={readOnly}
        reserveHelper={reserveHelper}
        fieldClassName={fieldClassName}
        className={className}
        autoFocus={focusOther}
      />
    );
  }

  return (
    <div className={`ui-field ui-field--control ${disabled ? 'ui-field--disabled' : ''} ${fieldClassName}`.trim()}>
      {label && (
        <Label id={labelId} htmlFor={`${baseId}-area`} required={required} optional={optional}>
          {label}
        </Label>
      )}

      <div
        ref={groupRef}
        className={`ui-phone ${className}`.trim()}
        role="group"
        aria-labelledby={label ? labelId : undefined}
        aria-label={label ? undefined : 'Phone number'}
        onBlur={handleGroupBlur}
      >
        <span className="ui-phone__code" aria-hidden="true">
          +1
        </span>
        {PHONE_PARTS.map((part, index) => (
          <span key={part.key} className={`ui-phone__slot ui-phone__slot--${part.key}`}>
            {part.key === 'area' && <span className="ui-phone__sep" aria-hidden="true">(</span>}
            {part.key === 'line' && <span className="ui-phone__sep" aria-hidden="true">-</span>}
            <input
              ref={
                index === 0
                  ? setFirstRef
                  : (node) => {
                      boxes.current[index] = node;
                    }
              }
              id={`${baseId}-${part.key}`}
              name={name ? `${name}-${part.key}` : undefined}
              type="tel"
              inputMode="numeric"
              autoComplete={autoComplete === 'off' ? 'off' : AUTOCOMPLETE[part.key]}
              placeholder={part.placeholder}
              aria-label={part.label}
              aria-describedby={helperId}
              aria-invalid={Boolean(error)}
              value={parts[index]}
              onChange={handleBoxChange(index)}
              onKeyDown={handleKeyDown(index)}
              onPaste={handlePaste}
              disabled={disabled}
              readOnly={readOnly}
              className={`ui-input ui-phone__box ${error ? 'ui-input--error' : ''}`.trim()}
            />
            {part.key === 'area' && <span className="ui-phone__sep" aria-hidden="true">)</span>}
          </span>
        ))}
        {/* The whole number, for anything that reads the form by name. */}
        {name && <input type="hidden" name={name} value={current} />}
      </div>

      <FieldHelper id={helperId} hint={hint} error={error} reserve={reserveHelper} />
    </div>
  );
});

export default PhoneInput;
