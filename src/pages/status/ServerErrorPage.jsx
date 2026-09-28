import { Link } from 'react-router-dom';
import { LuHouse, LuRotateCcw } from 'react-icons/lu';
import { Button } from '../../components/common';
import { StatusView } from '../../components/status/StatusView';
import { useAuth } from '../../hooks/useAuth';

/**
 * "This page ran into a problem" - what AppErrorBoundary shows when a page
 * throws while drawing, instead of a blank white screen.
 *
 *   inShell  inside a role's layout (the navigation still works, so the
 *            person can simply go somewhere else)
 *   else     the whole screen
 *
 * `kind="server"` gives the same page for a server fault reached some other
 * way. Development builds show the error underneath.
 */
export default function ServerErrorPage({ inShell = false, error = null, onRetry, kind = 'crash' }) {
  const { isAuthenticated, homePath } = useAuth();

  return (
    <StatusView
      kind={kind}
      variant={inShell ? 'shell' : 'page'}
      actions={
        <>
          <Button startIcon={<LuRotateCcw aria-hidden="true" />} onClick={onRetry ?? (() => window.location.reload())}>
            Try again
          </Button>
          <Button
            variant="secondary"
            as={Link}
            to={isAuthenticated ? homePath || '/' : '/login'}
            startIcon={<LuHouse aria-hidden="true" />}
            onClick={onRetry}
          >
            {isAuthenticated ? 'Go to your home' : 'Go to sign in'}
          </Button>
        </>
      }
    >
      {import.meta.env.DEV && error && (
        <details className="st-details">
          <summary>What went wrong (shown in development only)</summary>
          <pre>{String(error?.stack || error?.message || error)}</pre>
        </details>
      )}
    </StatusView>
  );
}
