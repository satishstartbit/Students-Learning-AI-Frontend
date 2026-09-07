import IconButton from './IconButton';

const ICONS = { info: 'ℹ', success: '✓', warning: '⚠', error: '⚠' };

/**
 * Inline contextual message.
 *
 * Errors and warnings announce assertively; info and success announce
 * politely, so a page full of alerts does not talk over itself.
 */
export function Alert({
  variant = 'info',
  title,
  children,
  onDismiss,
  icon,
  className = '',
  ...rest
}) {
  const assertive = variant === 'error' || variant === 'warning';

  return (
    <div
      className={`ui-alert ui-alert--${variant} ${className}`.trim()}
      role={assertive ? 'alert' : 'status'}
      aria-live={assertive ? 'assertive' : 'polite'}
      {...rest}
    >
      <span aria-hidden="true">{icon ?? ICONS[variant]}</span>

      <div className="ui-alert__body">
        {title && <div className="ui-alert__title">{title}</div>}
        {children}
      </div>

      {onDismiss && (
        <IconButton
          size="sm"
          icon={<span aria-hidden="true">✕</span>}
          label="Dismiss message"
          onClick={onDismiss}
        />
      )}
    </div>
  );
}

export default Alert;
