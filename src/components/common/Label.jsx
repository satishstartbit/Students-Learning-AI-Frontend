/**
 * Form label with required/optional affordances.
 * Always pair with an input's id via htmlFor.
 */
export function Label({ htmlFor, children, required = false, optional = false, className = '', ...rest }) {
  return (
    <label htmlFor={htmlFor} className={`ui-label ${className}`.trim()} {...rest}>
      {children}
      {required && (
        <span className="ui-label__required" aria-hidden="true">
          *
        </span>
      )}
      {required && <span className="ui-sr-only">(required)</span>}
      {optional && !required && <span className="ui-label__optional">(optional)</span>}
    </label>
  );
}

export default Label;
