import Spinner from './Spinner';

/**
 * Spinner with a message.
 *
 * @param variant  inline | overlay (covers its positioned parent) | fullscreen
 */
export function Loader({ message = 'Loading…', variant = 'inline', size = 'lg', className = '' }) {
  const classes = [
    'ui-loader',
    variant !== 'inline' ? `ui-loader--${variant}` : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} role="status" aria-live="polite">
      <Spinner size={size} label={message} />
      {message && <span>{message}</span>}
    </div>
  );
}

export default Loader;
