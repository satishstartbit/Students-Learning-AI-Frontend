import { useNavigate } from 'react-router-dom';
import { LuArrowLeft, LuRotateCcw } from 'react-icons/lu';
import { useOnlineStatus, useRetryWhenReconnected } from '../../hooks/useConnection';
import { classifyError, ERROR_KINDS, isRetryableKind } from '../../utils/errorKind';
import { StatusView } from '../status/StatusView';
import Button from './Button';

/**
 * Shown when a request fails - on about fifty screens and in every
 * DataTable, so this is where the site learns to tell failures apart.
 *
 * The error (a parsed API error from utils/errorHandler, a string, or
 * nothing) is classified (utils/errorKind.js) and drawn as the matching
 * status view:
 *   offline / can't reach the server / timeout / maintenance / server error
 *     - the kind's own picture and words, a Try again, and an automatic
 *       retry the moment the device reconnects or the server answers again
 *   not found - no Try again (it won't help), a Go back instead
 *   anything else - the caller's `title` and the server's message, as before
 *
 * @param variant  inline (default) | compact (dialogs, small panels) | shell
 * @param icon     ignored - kept so older call sites still compile
 */
export function ErrorState({
  title,
  error,
  description,
  onRetry,
  retryLabel = 'Try again',
  variant = 'inline',
  className = '',
}) {
  const navigate = useNavigate();
  const online = useOnlineStatus();
  const kind = classifyError(error, { online });

  // Reconnected, or the server is answering again: load it again without a tap.
  useRetryWhenReconnected(kind === ERROR_KINDS.OFFLINE || kind === ERROR_KINDS.UNREACHABLE, onRetry);

  const message = description ?? (typeof error === 'string' ? error : error?.message);
  const ownWords = kind === ERROR_KINDS.GENERIC;
  const words = ownWords
    ? { title: title ?? 'Something went wrong', description: message, eyebrow: null }
    : kind === ERROR_KINDS.FORBIDDEN
      ? { description: message }
      : {};

  const actions = [];
  if (onRetry && isRetryableKind(kind)) {
    actions.push(
      <Button key="retry" variant="secondary" startIcon={<LuRotateCcw aria-hidden="true" />} onClick={onRetry}>
        {retryLabel}
      </Button>
    );
  }
  if (kind === ERROR_KINDS.NOT_FOUND || kind === ERROR_KINDS.FORBIDDEN) {
    actions.push(
      <Button
        key="back"
        variant="secondary"
        startIcon={<LuArrowLeft aria-hidden="true" />}
        onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
      >
        Go back
      </Button>
    );
  }

  return (
    <StatusView
      kind={kind}
      variant={variant}
      className={className}
      title={words.title}
      description={words.description}
      eyebrow={words.eyebrow}
      actions={actions.length ? actions : null}
    />
  );
}

export default ErrorState;
