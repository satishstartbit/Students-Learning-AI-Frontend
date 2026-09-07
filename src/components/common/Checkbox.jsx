import { forwardRef, useEffect, useId, useRef } from 'react';
import FormError from './FormError';

/** Single checkbox. Supports an indeterminate state for "select all" headers. */
export const Checkbox = forwardRef(function Checkbox(
  {
    id,
    name,
    label,
    description,
    checked = false,
    indeterminate = false,
    onChange,
    onBlur,
    error,
    disabled = false,
    value,
    className = '',
    ...rest
  },
  ref
) {
  const generatedId = useId();
  const inputId = id || `${name || 'checkbox'}-${generatedId}`;
  const innerRef = useRef(null);

  useEffect(() => {
    const node = innerRef.current;
    if (node) node.indeterminate = indeterminate && !checked;
  }, [indeterminate, checked]);

  const setRefs = (node) => {
    innerRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className={`ui-field ${className}`.trim()}>
      <label
        htmlFor={inputId}
        className={`ui-choice ${disabled ? 'ui-choice--disabled' : ''}`.trim()}
      >
        <input
          ref={setRefs}
          id={inputId}
          name={name}
          type="checkbox"
          checked={checked}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          {...rest}
        />
        <span>
          {label}
          {description && <span className="ui-choice__description">{description}</span>}
        </span>
      </label>

      <FormError id={errorId}>{error}</FormError>
    </div>
  );
});

export default Checkbox;
