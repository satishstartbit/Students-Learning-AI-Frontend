import { LuCircleCheck, LuCircleX, LuInfo, LuTriangleAlert, LuX } from 'react-icons/lu';

const ICONS = { info: LuInfo, success: LuCircleCheck, warning: LuTriangleAlert, error: LuCircleX };

// "danger" is the same message as "error" (some pages use the Badge/Button name).
const VARIANT_ALIASES = { danger: 'error' };

/**
 * Inline contextual message - and every toast (Toast.jsx renders these),
 * built to the notification mockup: a tinted card with a coloured border,
 * an outline status icon, a bold title with a quieter description under it,
 * and a plain close cross. Success / info / warning / error each take their
 * colours from the status tokens, so accent themes, dark mode and the K-5
 * theme all follow.
 *
 * Without a title the message itself is the main line (normal colour).
 *
 * Errors and warnings announce assertively; info and success announce
 * politely, so a page full of alerts does not talk over itself.
 */
export function Alert({
  variant: requested = 'info',
  title,
  children,
  onDismiss,
  icon,
  className = '',
  ...rest
}) {
  const variant = VARIANT_ALIASES[requested] ?? (ICONS[requested] ? requested : 'info');
  const assertive = variant === 'error' || variant === 'warning';
  const Icon = ICONS[variant];

  return (
    <div
      className={`ui-alert ui-alert--${variant}${title ? ' ui-alert--titled' : ''} ${className}`.trim()}
      role={assertive ? 'alert' : 'status'}
      aria-live={assertive ? 'assertive' : 'polite'}
      {...rest}
    >
      <span className="ui-alert__icon" aria-hidden="true">
        {icon ?? <Icon size={20} strokeWidth={2.2} />}
      </span>

      <div className="ui-alert__body">
        {title && <div className="ui-alert__title">{title}</div>}
        {children && <div className="ui-alert__text">{children}</div>}
      </div>

      {onDismiss && (
        <button type="button" className="ui-alert__close" aria-label="Dismiss message" onClick={onDismiss}>
          <LuX size={18} strokeWidth={2.2} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export default Alert;
