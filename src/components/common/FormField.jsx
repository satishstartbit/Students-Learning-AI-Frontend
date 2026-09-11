import { useId } from 'react';
import Label from './Label';
import FieldHelper from './FieldHelper';

/**
 * Wraps a control with its label, helper line and error, and wires up the
 * accessibility attributes so each input does not have to.
 *
 * Children may be a node, or a function receiving { id, describedBy, invalid }.
 *
 *   <FormField label="Email" error={errors.email}>
 *     {(props) => <input {...props} />}
 *   </FormField>
 *
 * Pass `disabled` when the control inside is disabled, so the label and helper
 * line mute with it.
 */
export function FormField({
  label,
  hint,
  error,
  required = false,
  optional = false,
  disabled = false,
  reserveHelper = true,
  htmlFor,
  className = '',
  children,
}) {
  const generatedId = useId();
  const id = htmlFor || generatedId;
  const helperId = hint || error ? `${id}-helper` : undefined;

  const controlProps = { id, 'aria-describedby': helperId, 'aria-invalid': Boolean(error) };

  return (
    <div
      className={`ui-field ui-field--control ${disabled ? 'ui-field--disabled' : ''} ${className}`.trim()}
    >
      {label && (
        <Label htmlFor={id} required={required} optional={optional}>
          {label}
        </Label>
      )}

      {typeof children === 'function' ? children(controlProps) : children}

      <FieldHelper id={helperId} hint={hint} error={error} reserve={reserveHelper} />
    </div>
  );
}

export default FormField;
