/**
 * Inline validation message.
 *
 * Renders nothing when there is no error, and announces politely so screen
 * readers hear the message when it appears.
 */
export function FormError({ id, children, className = '' }) {
  if (!children) return null;

  return (
    <p id={id} className={`ui-error ${className}`.trim()} role="alert" aria-live="polite">
      <span aria-hidden="true">⚠</span>
      <span>{children}</span>
    </p>
  );
}

export default FormError;
