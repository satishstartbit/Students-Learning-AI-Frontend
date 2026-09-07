/**
 * Small label for counts, categories and tags.
 * For a status value, prefer <StatusBadge /> so the colour is derived
 * consistently.
 */
export function Badge({ children, variant = 'neutral', dot = false, className = '', ...rest }) {
  return (
    <span className={`ui-badge ui-badge--${variant} ${className}`.trim()} {...rest}>
      {dot && <span className="ui-badge__dot" aria-hidden="true" />}
      {children}
    </span>
  );
}

export default Badge;
