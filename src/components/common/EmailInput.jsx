import { forwardRef } from 'react';
import Input from './Input';
import { normalizeEmail } from '../../utils/email';

/**
 * Every email field. An `Input` with email keyboard and autofill, no
 * auto-capitalising or spell-check, and on leaving the field the value is
 * trimmed and lower-cased - the form shows what will be saved. Validate with
 * `utils/validation#emailRules()` (the same rules the API applies).
 *
 * Spread useForm's getFieldProps as for `Input`: the clean-up is sent back
 * through `onChange` as `{ target: { name, value } }` before `onBlur`, so the
 * blur validation sees the cleaned value.
 */
export const EmailInput = forwardRef(function EmailInput(
  { name, value, onChange, onBlur, autoComplete = 'email', ...rest },
  ref
) {
  const handleBlur = (event) => {
    const cleaned = normalizeEmail(event.target.value ?? '');
    if (cleaned !== (value ?? '') && onChange) onChange({ target: { name, value: cleaned, type: 'email' } });
    onBlur?.(event);
  };

  return (
    <Input
      ref={ref}
      type="email"
      name={name}
      value={value}
      onChange={onChange}
      onBlur={handleBlur}
      autoComplete={autoComplete}
      inputMode="email"
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      {...rest}
    />
  );
});

export default EmailInput;
