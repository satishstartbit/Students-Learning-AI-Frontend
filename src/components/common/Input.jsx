import { forwardRef, useId } from 'react';
import Label from './Label';
import FormError from './FormError';

/**
 * Text input with label, hint, error and optional adornments.
 * Fully controlled - pass value/onChange (or spread useForm's getFieldProps).
 */
export const Input = forwardRef(function Input(
  {
    id,
    name,
    label,
    type = 'text',
    value,
    onChange,
    onBlur,
    placeholder,
    hint,
    error,
    required = false,
    optional = false,
    disabled = false,
    readOnly = false,
    startAdornment,
    endAdornment,
    className = '',
    fieldClassName = '',
    ...rest
  },
  ref
) {
  const generatedId = useId();
  const inputId = id || `${name || 'input'}-${generatedId}`;

  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  const control = (
    <input
      ref={ref}
      id={inputId}
      name={name}
      type={type}
      value={value ?? ''}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      required={required}
      aria-invalid={Boolean(error)}
      aria-describedby={describedBy}
      className={`ui-input ${error ? 'ui-input--error' : ''} ${className}`.trim()}
      {...rest}
    />
  );

  return (
    <div className={`ui-field ${fieldClassName}`.trim()}>
      {label && (
        <Label htmlFor={inputId} required={required} optional={optional}>
          {label}
        </Label>
      )}

      {startAdornment || endAdornment ? (
        <div className={`ui-input-wrap ${startAdornment ? 'ui-input-wrap--lead' : ''}`.trim()}>
          {startAdornment && (
            <span className="ui-input-affix ui-input-affix--start" aria-hidden="true">
              {startAdornment}
            </span>
          )}
          {control}
          {endAdornment && <span className="ui-input-affix ui-input-affix--end">{endAdornment}</span>}
        </div>
      ) : (
        control
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

export default Input;
