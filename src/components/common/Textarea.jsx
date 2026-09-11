import { forwardRef, useId } from 'react';
import Label from './Label';
import FieldHelper from './FieldHelper';

/** Multi-line text input with an optional character counter. */
export const Textarea = forwardRef(function Textarea(
  {
    id,
    name,
    label,
    value,
    onChange,
    onBlur,
    placeholder,
    hint,
    error,
    rows = 4,
    maxLength,
    showCount = false,
    required = false,
    optional = false,
    disabled = false,
    readOnly = false,
    reserveHelper = true,
    className = '',
    fieldClassName = '',
    ...rest
  },
  ref
) {
  const generatedId = useId();
  const inputId = id || `${name || 'textarea'}-${generatedId}`;
  const helperId = hint || error ? `${inputId}-helper` : undefined;

  const length = String(value ?? '').length;

  return (
    <div
      className={`ui-field ui-field--control ${disabled ? 'ui-field--disabled' : ''} ${fieldClassName}`.trim()}
    >
      {label && (
        <Label htmlFor={inputId} required={required} optional={optional}>
          {label}
        </Label>
      )}

      <textarea
        ref={ref}
        id={inputId}
        name={name}
        rows={rows}
        value={value ?? ''}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={helperId}
        className={`ui-textarea ${error ? 'ui-textarea--error' : ''} ${className}`.trim()}
        {...rest}
      />

      {/* The counter shares the helper's line, so showing it costs no height. */}
      <FieldHelper id={helperId} hint={hint} error={error} reserve={reserveHelper}>
        {showCount && maxLength && (
          <span className="ui-helper__count" aria-live="polite">
            {length} / {maxLength}
          </span>
        )}
      </FieldHelper>
    </div>
  );
});

export default Textarea;
