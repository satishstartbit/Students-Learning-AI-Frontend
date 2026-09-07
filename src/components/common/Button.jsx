import { forwardRef } from 'react';
import Spinner from './Spinner';

/**
 * Primary action component.
 *
 * @param variant  primary | secondary | ghost | danger | link
 * @param size     sm | md | lg
 * @param as       render as another element (e.g. Link) while keeping styling
 */
export const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    type = 'button',
    loading = false,
    disabled = false,
    fullWidth = false,
    startIcon,
    endIcon,
    className = '',
    as: Component = 'button',
    ...rest
  },
  ref
) {
  const isDisabled = disabled || loading;

  const classes = [
    'ui-btn',
    `ui-btn--${variant}`,
    size !== 'md' ? `ui-btn--${size}` : '',
    fullWidth ? 'ui-btn--block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Non-button elements have no disabled attribute - communicate it via ARIA.
  const disabledProps =
    Component === 'button'
      ? { disabled: isDisabled, type }
      : { 'aria-disabled': isDisabled || undefined };

  return (
    <Component ref={ref} className={classes} aria-busy={loading || undefined} {...disabledProps} {...rest}>
      {loading ? <Spinner size="sm" /> : startIcon}
      {children}
      {!loading && endIcon}
    </Component>
  );
});

export default Button;
