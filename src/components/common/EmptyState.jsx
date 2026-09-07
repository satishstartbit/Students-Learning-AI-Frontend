/**
 * Shown when a list or page has no content yet.
 * `action` is usually the button that creates the first record.
 */
export function EmptyState({
  icon = '📭',
  title = 'Nothing here yet',
  description,
  action,
  className = '',
}) {
  return (
    <div className={`ui-state ${className}`.trim()}>
      <span className="ui-state__icon" aria-hidden="true">
        {icon}
      </span>
      <h3 className="ui-state__title">{title}</h3>
      {description && <p className="ui-state__description">{description}</p>}
      {action}
    </div>
  );
}

export default EmptyState;
