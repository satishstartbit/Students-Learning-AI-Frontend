/**
 * Surface container.
 *
 * Passing onClick renders a real <button> so the card is keyboard reachable
 * rather than a click-only div.
 */
export function Card({
  children,
  title,
  subtitle,
  actions,
  footer,
  flat = false,
  padded = true,
  onClick,
  className = '',
  ...rest
}) {
  const interactive = typeof onClick === 'function';
  const Component = interactive ? 'button' : 'div';

  const classes = [
    'ui-card',
    flat ? 'ui-card--flat' : '',
    interactive ? 'ui-card--interactive' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Component
      className={classes}
      onClick={onClick}
      type={interactive ? 'button' : undefined}
      {...rest}
    >
      {(title || actions) && (
        <div className="ui-card__header">
          <div>
            {title && <h3 className="ui-card__title">{title}</h3>}
            {subtitle && <p className="ui-card__subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="ui-pageheader__actions">{actions}</div>}
        </div>
      )}

      {padded ? <div className="ui-card__body">{children}</div> : children}

      {footer && <div className="ui-card__footer">{footer}</div>}
    </Component>
  );
}

export default Card;
