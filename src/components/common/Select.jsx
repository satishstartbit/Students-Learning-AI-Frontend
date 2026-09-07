import { forwardRef, useId } from 'react';
import Label from './Label';
import FormError from './FormError';

/**
 * Single-choice select.
 * @param options - [{ value, label, disabled }] or plain strings
 */
export const Select = forwardRef(function Select(
  {
    id,
    name,
    label,
    value,
    onChange,
    onBlur,
    options = [],
    placeholder = 'Select an option',
    hint,
    error,
    required = false,
    optional = false,
    disabled = false,
    loading = false,
    className = '',
    fieldClassName = '',
    ...rest
  },
  ref
) {
  const generatedId = useId();
  const inputId = id || `${name || 'select'}-${generatedId}`;

  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  const normalised = options.map((o) =>
    typeof o === 'object' && o !== null ? o : { value: o, label: String(o) }
  );

  return (
    <div className={`ui-field ${fieldClassName}`.trim()}>
      {label && (
        <Label htmlFor={inputId} required={required} optional={optional}>
          {label}
        </Label>
      )}

      <select
        ref={ref}
        id={inputId}
        name={name}
        value={value ?? ''}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled || loading}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        aria-busy={loading || undefined}
        className={`ui-select ${error ? 'ui-select--error' : ''} ${className}`.trim()}
        {...rest}
      >
        <option value="" disabled={required}>
          {loading ? 'Loading…' : placeholder}
        </option>

        {normalised.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>

      {hint && !error && (
        <span id={hintId} className="ui-hint">
          {hint}
        </span>
      )}
      <FormError id={errorId}>{error}</FormError>
    </div>
  );
});

export default Select;
