import { useEffect, useId, useRef, useState } from 'react';
import Label from './Label';
import FormError from './FormError';
import Badge from './Badge';

/**
 * Multi-choice select built as an accessible listbox.
 *
 * @param value    array of selected values
 * @param onChange (nextValues) => void
 * @param options  [{ value, label, disabled }]
 */
export function MultiSelect({
  name,
  label,
  value = [],
  onChange,
  options = [],
  placeholder = 'Select options',
  hint,
  error,
  required = false,
  disabled = false,
  maxSelected,
  className = '',
}) {
  const generatedId = useId();
  const controlId = `${name || 'multiselect'}-${generatedId}`;
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close when focus or a click leaves the component.
  useEffect(() => {
    if (!isOpen) return undefined;

    const onPointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setIsOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  const selected = new Set(value);
  const atLimit = maxSelected != null && value.length >= maxSelected;

  const toggle = (optionValue) => {
    const next = selected.has(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];

    if (maxSelected != null && next.length > maxSelected) return;
    onChange?.(next);
  };

  const labelFor = (v) => options.find((o) => o.value === v)?.label ?? v;

  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;

  return (
    <div className={`ui-field ${className}`.trim()} ref={containerRef}>
      {label && (
        <Label htmlFor={controlId} required={required}>
          {label}
        </Label>
      )}

      <div className="ui-multiselect">
        <button
          id={controlId}
          type="button"
          className="ui-multiselect__control"
          onClick={() => !disabled && setIsOpen((v) => !v)}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-invalid={Boolean(error)}
          aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        >
          {value.length === 0 ? (
            <span className="ui-multiselect__placeholder">{placeholder}</span>
          ) : (
            value.map((v) => (
              <Badge key={v} variant="primary">
                {labelFor(v)}
              </Badge>
            ))
          )}
        </button>

        {isOpen && (
          <ul className="ui-multiselect__menu" role="listbox" aria-multiselectable="true">
            {options.length === 0 && (
              <li className="ui-multiselect__option" aria-disabled="true">
                No options available
              </li>
            )}

            {options.map((option) => {
              const isSelected = selected.has(option.value);
              const isDisabled = option.disabled || (atLimit && !isSelected);

              return (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={isDisabled || undefined}
                  className="ui-multiselect__option"
                  onClick={() => !isDisabled && toggle(option.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (!isDisabled) toggle(option.value);
                    }
                  }}
                  tabIndex={isDisabled ? -1 : 0}
                  style={isDisabled ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                >
                  <input type="checkbox" checked={isSelected} readOnly tabIndex={-1} />
                  <span>{option.label}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {hint && !error && (
        <span id={hintId} className="ui-hint">
          {hint}
          {maxSelected != null && ` (up to ${maxSelected})`}
        </span>
      )}
      <FormError id={errorId}>{error}</FormError>
    </div>
  );
}

export default MultiSelect;
