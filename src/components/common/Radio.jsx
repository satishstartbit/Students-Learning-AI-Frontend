import { useId } from 'react';
import FormError from './FormError';

/**
 * Radio group. Grouped in a fieldset so assistive tech announces the legend
 * with each option.
 *
 * @param options - [{ value, label, description, disabled }]
 */
export function Radio({
  name,
  label,
  value,
  onChange,
  onBlur,
  options = [],
  error,
  required = false,
  disabled = false,
  direction = 'column',
  className = '',
}) {
  const generatedId = useId();
  const groupName = name || `radio-${generatedId}`;
  const errorId = error ? `${groupName}-error` : undefined;

  return (
    <fieldset
      className={`ui-field ${className}`.trim()}
      aria-invalid={Boolean(error)}
      aria-describedby={errorId}
      style={{ border: 0, padding: 0, margin: '0 0 16px' }}
    >
      {label && (
        <legend className="ui-label">
          {label}
          {required && (
            <span className="ui-label__required" aria-hidden="true">
              *
            </span>
          )}
        </legend>
      )}

      <div className={`ui-choice-group ${direction === 'row' ? 'ui-choice-group--row' : ''}`.trim()}>
        {options.map((option) => {
          const optionId = `${groupName}-${option.value}`;
          const isDisabled = disabled || option.disabled;

          return (
            <label
              key={option.value}
              htmlFor={optionId}
              className={`ui-choice ${isDisabled ? 'ui-choice--disabled' : ''}`.trim()}
            >
              <input
                id={optionId}
                type="radio"
                name={groupName}
                value={option.value}
                checked={value === option.value}
                onChange={onChange}
                onBlur={onBlur}
                disabled={isDisabled}
                required={required}
              />
              <span>
                {option.label}
                {option.description && (
                  <span className="ui-choice__description">{option.description}</span>
                )}
              </span>
            </label>
          );
        })}
      </div>

      <FormError id={errorId}>{error}</FormError>
    </fieldset>
  );
}

export default Radio;
