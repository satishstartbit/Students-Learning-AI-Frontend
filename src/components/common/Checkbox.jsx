import { forwardRef, useEffect, useId, useRef } from 'react';
import FormError from './FormError';

/**
 * Single checkbox row: zero-or-more choices, or a single on/off agreement.
 * Supports an indeterminate state for a partially-selected parent (e.g. a
 * task with some steps done, or a "select all" header).
 */
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
  const rowClass = ['ui-choice', disabled && 'ui-choice--disabled', error && 'ui-choice--error']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`ui-field ${className}`.trim()}>
      {/* The whole row is the 48px hit target, not just the 24px box. Pass
          aria-label when rendering without a visible label. */}
      <label htmlFor={inputId} className={rowClass}>
        <input
          ref={setRefs}
          id={inputId}
          name={name}
          type="checkbox"
          className="ui-choice__control"
          checked={checked}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          {...rest}
        />
        {(label || description) && (
          <span>
            {label}
            {description && <span className="ui-choice__description">{description}</span>}
          </span>
        )}
      </label>

      <FormError id={errorId}>{error}</FormError>
    </div>
  );
});

export default Checkbox;
