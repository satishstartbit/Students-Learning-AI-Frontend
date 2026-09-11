import { forwardRef, useId } from 'react';
import Label from './Label';
import FieldHelper from './FieldHelper';

/**
 * Text input with label, helper line, error and optional adornments.
 * Fully controlled - pass value/onChange (or spread useForm's getFieldProps).
 *
 * The helper line below the field is always present, so an error appearing on
 * blur never moves the rest of the form - pass reserveHelper={false} only for
 * a control that never validates.
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
    reserveHelper = true,
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
  const helperId = hint || error ? `${inputId}-helper` : undefined;

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
      aria-describedby={helperId}
      className={`ui-input ${error ? 'ui-input--error' : ''} ${className}`.trim()}
      {...rest}
    />
  );

  return (
    <div
      className={`ui-field ui-field--control ${disabled ? 'ui-field--disabled' : ''} ${fieldClassName}`.trim()}
    >
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

      <FieldHelper id={helperId} hint={hint} error={error} reserve={reserveHelper} />
    </div>
  );
});

export default Input;
