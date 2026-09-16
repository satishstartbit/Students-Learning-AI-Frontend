import { forwardRef } from 'react';
import Spinner from './Spinner';

/**
 * Icon-only button.
 * `label` is required - it becomes the accessible name.
 */
export const IconButton = forwardRef(function IconButton(
  {
    icon,
    label,
    size = 'md',
    variant = 'default',
    type = 'button',
    loading = false,
    disabled = false,
    className = '',
    children,
    as: Component = 'button',
    ...rest
  },
  ref
) {
  const classes = [
    'ui-iconbtn',
    size === 'sm' ? 'ui-iconbtn--sm' : '',
    variant !== 'default' ? `ui-iconbtn--${variant}` : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const isDisabled = disabled || loading;
  // Non-button elements (e.g. Link) have no disabled attribute - communicate
  // it via ARIA instead, same convention as Button.
  const disabledProps =
    Component === 'button'
      ? { disabled: isDisabled, type }
      : { 'aria-disabled': isDisabled || undefined };

  return (
    <Component
      ref={ref}
      className={classes}
      title={label}
      aria-label={label}
      aria-busy={loading || undefined}
      {...disabledProps}
      {...rest}
    >
      {loading ? <Spinner size="sm" /> : (icon ?? children)}
    </Component>
  );
});

export default IconButton;
