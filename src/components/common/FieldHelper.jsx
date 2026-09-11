/**
 * The helper line under a form control.
 *
 * Rendered even when there is nothing to say, so the slot is reserved: an
 * error arriving later swaps the text in place instead of pushing the rest of
 * the form down the page under someone mid-way through filling it in.
 *
 * The error replaces the hint rather than stacking under it, and carries the
 * alert role so it is announced the moment it appears.
 *
 * @param id       id the control points at with aria-describedby
 * @param reserve  keep the empty slot (default). Pass false for controls that
 *                 never validate - a chat composer, a filter box - where the
 *                 blank line would just be dead space.
 * @param children trailing content on the same line, e.g. a character counter
 */
export function FieldHelper({ id, hint, error, reserve = true, className = '', children }) {
  const message = error || hint;

  if (!reserve && !message && !children) return null;

  return (
    <div className={`ui-helper ${className}`.trim()}>
      {message && (
        <span
          id={id}
          className={`ui-helper__message ${error ? 'ui-helper__message--error' : ''}`.trim()}
          {...(error ? { role: 'alert', 'aria-live': 'polite' } : {})}
        >
          {message}
        </span>
      )}
      {children}
    </div>
  );
}

export default FieldHelper;
