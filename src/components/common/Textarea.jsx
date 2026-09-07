import { forwardRef, useId } from 'react';
import Label from './Label';
import FormError from './FormError';

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
    className = '',
    fieldClassName = '',
    ...rest
  },
  ref
) {
  const generatedId = useId();
  const inputId = id || `${name || 'textarea'}-${generatedId}`;

  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  const length = String(value ?? '').length;

  return (
    <div className={`ui-field ${fieldClassName}`.trim()}>
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
        aria-describedby={describedBy}
        className={`ui-textarea ${error ? 'ui-textarea--error' : ''} ${className}`.trim()}
        {...rest}
      />

      {showCount && maxLength && (
        <span className="ui-hint" style={{ alignSelf: 'flex-end' }} aria-live="polite">
          {length} / {maxLength}
        </span>
      )}

      {hint && !error && (
        <span id={hintId} className="ui-hint">
          {hint}
        </span>
      )}
      <FormError id={errorId}>{error}</FormError>
    </div>
  );
});

export default Textarea;
