import { forwardRef, useId } from 'react';
import Label from './Label';
import FieldHelper from './FieldHelper';

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
    reserveHelper = true,
    className = '',
    fieldClassName = '',
    ...rest
  },
  ref
) {
  const generatedId = useId();
  const inputId = id || `${name || 'select'}-${generatedId}`;
  const helperId = hint || error ? `${inputId}-helper` : undefined;

  const normalised = options.map((o) =>
    typeof o === 'object' && o !== null ? o : { value: o, label: String(o) }
  );

  // Nothing chosen yet: the placeholder option reads as a placeholder.
  const showingPlaceholder = value == null || value === '';

  return (
    <div
      className={`ui-field ui-field--control ${disabled ? 'ui-field--disabled' : ''} ${fieldClassName}`.trim()}
    >
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
        aria-describedby={helperId}
        aria-busy={loading || undefined}
        className={`ui-select ${showingPlaceholder ? 'ui-select--placeholder' : ''} ${
          error ? 'ui-select--error' : ''
        } ${className}`.trim()}
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

      <FieldHelper id={helperId} hint={hint} error={error} reserve={reserveHelper} />
    </div>
  );
});

export default Select;
