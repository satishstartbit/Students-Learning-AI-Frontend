/**
 * Lays out related buttons.
 *
 * @param attached  join the buttons into a single segmented control
 * @param label     accessible name when the group is a toolbar
 */
export function ButtonGroup({
  children,
  attached = false,
  fullWidth = false,
  label,
  className = '',
  ...rest
}) {
  const classes = [
    'ui-btngroup',
    attached ? 'ui-btngroup--attached' : '',
    fullWidth ? 'ui-btngroup--block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} role="group" aria-label={label} {...rest}>
      {children}
    </div>
  );
}

export default ButtonGroup;
