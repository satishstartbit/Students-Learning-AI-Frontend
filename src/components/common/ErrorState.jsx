import Button from './Button';

/**
 * Shown when a request fails.
 *
 * Accepts either a message or a parsed API error from utils/errorHandler,
 * and offers a retry when the caller can re-run the request.
 */
export function ErrorState({
  title = 'Something went wrong',
  error,
  description,
  onRetry,
  retryLabel = 'Try again',
  icon = '⚠',
  className = '',
}) {
  const message = description ?? (typeof error === 'string' ? error : error?.message);

  return (
    <div className={`ui-state ${className}`.trim()} role="alert">
      <span className="ui-state__icon" aria-hidden="true">
        {icon}
      </span>
      <h3 className="ui-state__title">{title}</h3>
      {message && <p className="ui-state__description">{message}</p>}
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

export default ErrorState;
