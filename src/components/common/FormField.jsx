import { useId } from 'react';
import Label from './Label';
import FormError from './FormError';

/**
 * Wraps a control with its label, hint and error, and wires up the
 * accessibility attributes so each input does not have to.
 *
 * Children may be a node, or a function receiving { id, describedBy, invalid }.
 *
 *   <FormField label="Email" error={errors.email}>
 *     {(props) => <input {...props} />}
 *   </FormField>
 */
export function FormField({
  label,
  hint,
  error,
  required = false,
  optional = false,
  htmlFor,
  className = '',
  children,
}) {
  const generatedId = useId();
  const id = htmlFor || generatedId;

  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  const controlProps = { id, 'aria-describedby': describedBy, 'aria-invalid': Boolean(error) };

  return (
    <div className={`ui-field ${className}`.trim()}>
      {label && (
        <Label htmlFor={id} required={required} optional={optional}>
          {label}
        </Label>
      )}

      {typeof children === 'function' ? children(controlProps) : children}

      {hint && !error && (
        <span id={hintId} className="ui-hint">
          {hint}
        </span>
      )}

      <FormError id={errorId}>{error}</FormError>
    </div>
  );
}

export default FormField;
