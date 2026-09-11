import { forwardRef } from 'react';
import Spinner from './Spinner';

/**
 * Triggers an action.
 *
 * Exactly one Primary button per view - the design principle is one clear
 * next step per screen, and two primaries breaks it.
 *
 * @param variant  primary   the single main action; solid accent fill
 *                 secondary supporting actions; surface fill with a border
 *                 ghost     low emphasis - toolbars and dismissals
 *                 danger    destructive actions only
 * @param size     lg 60px | md 48px | sm 44px. Md and Lg meet the 48px touch
 *                 target this system prefers; sm only meets the WCAG 2.5.5
 *                 minimum, so keep it to dense secondary contexts and never
 *                 use it for a primary student action.
 * @param startIcon / endIcon  leading / trailing icon slots. The glyph is
 *                 sized to the button and takes its label colour.
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
      {loading ? (
        // The spinner takes the leading slot, so the label doesn't shift.
        <span className="ui-btn__icon">
          <Spinner size="sm" />
        </span>
      ) : (
        startIcon && (
          // Icons are decorative here - the label names the button.
          <span className="ui-btn__icon" aria-hidden="true">
            {startIcon}
          </span>
        )
      )}
      {children}
      {!loading && endIcon && (
        <span className="ui-btn__icon" aria-hidden="true">
          {endIcon}
        </span>
      )}
    </Component>
  );
});

export default Button;
