import { useEffect, useRef, useState } from 'react';
import { LuHouse, LuLogIn, LuRotateCcw } from 'react-icons/lu';
import { Alert, Button } from '../../components/common';
import { StatusView } from '../../components/status/StatusView';
import { useAuth } from '../../hooks/useAuth';
import { useOnlineStatus } from '../../hooks/useConnection';
import { APP_NAME } from '../../utils/constants';
import { isPageLoadError } from '../../utils/pageLoadError';

/** The site itself (not only the API) answers: a tiny uncached request for its own address. */
async function siteReachable() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${window.location.origin}/`, { method: 'HEAD', cache: 'no-store', signal: controller.signal });
    return res.status < 500;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

const isPlainClick = (e) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

/**
 * "This page ran into a problem" - what AppErrorBoundary shows when a page
 * throws while drawing, instead of a blank white screen.
 *
 *   inShell  inside a role's layout (the navigation still works, so the
 *            person can simply go somewhere else)
 *   else     the whole screen
 *
 * Both buttons do a REAL page load (QA 2026-10-16: they "did nothing" after a
 * network problem). The usual cause is a page whose code didn't download
 * (utils/pageLoadError.js): React keeps that failure, so re-rendering - or a
 * router link to the same address, e.g. "Go to sign in" on /login - failed
 * again silently. Now each button shows it is working, checks the connection
 * first (offline / site unreachable → says so under the buttons instead of
 * loading a browser error page), then reloads or opens the target. A
 * download that failed while offline loads again by itself once back online,
 * and is worded as a connection problem, not a crash.
 *
 * `kind="server"` gives the same page for a server fault reached some other
 * way. Development builds show the error underneath.
 */
export default function ServerErrorPage({ inShell = false, error = null, kind = 'crash' }) {
  const { isAuthenticated, homePath } = useAuth();
  const online = useOnlineStatus();
  const pageLoad = isPageLoadError(error);
  const [busy, setBusy] = useState(null); // 'retry' | 'leave'
  const [note, setNote] = useState(null);
  const target = isAuthenticated ? homePath || '/' : '/login';

  // Shown while offline (or the download failed): once the device is back online, load again by itself.
  const wasOffline = useRef(!online);
  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
      return;
    }
    if (pageLoad && wasOffline.current) {
      wasOffline.current = false;
      window.location.reload();
    }
  }, [online, pageLoad]);

  const run = async (which, load) => {
    setBusy(which);
    setNote(null);
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setBusy(null);
      setNote('You’re still offline. Connect to the internet, then try again.');
      return;
    }
    if (!(await siteReachable())) {
      setBusy(null);
      setNote(`We still can’t reach ${APP_NAME}. Check your connection, then try again.`);
      return;
    }
    // Stays "busy" until the browser leaves this page.
    load();
  };

  const leave = (e) => {
    // Ctrl/Cmd-click, middle click: the browser opens the link as usual.
    if (!isPlainClick(e) && !busy) return;
    e.preventDefault();
    if (busy) return;
    run('leave', () => window.location.assign(target));
  };

  return (
    <StatusView
      kind={pageLoad ? (online ? 'pageLoad' : 'offline') : kind}
      variant={inShell ? 'shell' : 'page'}
      actions={
        <>
          <Button
            startIcon={<LuRotateCcw aria-hidden="true" />}
            loading={busy === 'retry'}
            disabled={Boolean(busy)}
            onClick={() => run('retry', () => window.location.reload())}
          >
            {busy === 'retry' ? 'Trying again…' : 'Try again'}
          </Button>
          <Button
            variant="secondary"
            as="a"
            href={target}
            startIcon={isAuthenticated ? <LuHouse aria-hidden="true" /> : <LuLogIn aria-hidden="true" />}
            loading={busy === 'leave'}
            disabled={Boolean(busy)}
            onClick={leave}
          >
            {isAuthenticated ? 'Go to your home' : 'Go to sign in'}
          </Button>
        </>
      }
    >
      {note && (
        <Alert variant="warning" className="st-note">
          {note}
        </Alert>
      )}
      {import.meta.env.DEV && error && (
        <details className="st-details">
          <summary>What went wrong (shown in development only)</summary>
          <pre>{String(error?.stack || error?.message || error)}</pre>
        </details>
      )}
    </StatusView>
  );
}
