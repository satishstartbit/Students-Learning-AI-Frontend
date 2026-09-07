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

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      title={label}
      aria-label={label}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner size="sm" /> : (icon ?? children)}
    </button>
  );
});

export default IconButton;
