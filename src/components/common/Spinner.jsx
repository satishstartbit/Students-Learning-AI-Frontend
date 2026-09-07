/**
 * Bare loading indicator.
 * Use <Loader /> when you need a spinner plus a message or overlay.
 */
export function Spinner({ size = 'md', label = 'Loading', className = '', ...rest }) {
  const classes = [
    'ui-spinner',
    'ui-spin',
    size !== 'md' ? `ui-spinner--${size}` : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <span className={classes} role="status" aria-hidden="true" {...rest} />
      <span className="ui-sr-only">{label}</span>
    </>
  );
}

export default Spinner;
