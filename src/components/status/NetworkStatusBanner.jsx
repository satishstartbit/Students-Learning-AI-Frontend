import { useEffect, useState } from 'react';
import { LuServerCrash, LuWifi, LuWifiOff } from 'react-icons/lu';
import { useConnection } from '../../hooks/useConnection';
import { checkServer } from '../../utils/apiClient';
import './status.css';

const POLL_MS = 15000;
const BACK_ONLINE_MS = 3500;

/**
 * The connection, on every page (mounted once in App.jsx): a small card at
 * the bottom of the screen, above the phone tab bar.
 *
 *   offline          "You're offline" - nothing new loads or saves until the
 *                    device reconnects
 *   can't connect    online, but our server stopped answering - it asks
 *                    /health every 15s (and on "Retry") until it answers
 *   back online      a short confirmation once either is over
 *
 * Pages that failed meanwhile retry by themselves (ErrorState), so the card
 * only has to say what's going on.
 */
export function NetworkStatusBanner() {
  const { online, serverReachable } = useConnection();
  const healthy = online && serverReachable;
  const [checking, setChecking] = useState(false);

  // "You're back online" for a moment after a problem clears - adjusted
  // during render (React's pattern for state derived from a changing value).
  const [lastHealthy, setLastHealthy] = useState(healthy);
  const [showBack, setShowBack] = useState(false);
  if (healthy !== lastHealthy) {
    setLastHealthy(healthy);
    setShowBack(healthy);
  }
  useEffect(() => {
    if (!showBack) return undefined;
    const timer = setTimeout(() => setShowBack(false), BACK_ONLINE_MS);
    return () => clearTimeout(timer);
  }, [showBack]);

  // While the server isn't answering (and the device is online), keep asking.
  useEffect(() => {
    if (!online || serverReachable) return undefined;
    const timer = setInterval(() => checkServer(), POLL_MS);
    return () => clearInterval(timer);
  }, [online, serverReachable]);

  // Back on the network: check the server straight away rather than waiting.
  useEffect(() => {
    if (online && !serverReachable) checkServer();
  }, [online, serverReachable]);

  const retry = async () => {
    setChecking(true);
    await checkServer();
    setChecking(false);
  };

  if (!online) {
    return (
      <div className="st-banner" data-tone="offline" role="status" aria-live="polite">
        <span className="st-banner__icon" aria-hidden="true">
          <LuWifiOff />
        </span>
        <span className="st-banner__text">
          <span className="st-banner__title">You’re offline</span>
          <span className="st-banner__sub">Changes won’t save until you reconnect.</span>
        </span>
      </div>
    );
  }

  if (!serverReachable) {
    return (
      <div className="st-banner" data-tone="unreachable" role="status" aria-live="polite">
        <span className="st-banner__icon" aria-hidden="true">
          <LuServerCrash />
        </span>
        <span className="st-banner__text">
          <span className="st-banner__title">Can’t reach the server</span>
          <span className="st-banner__sub">We’ll keep trying in the background.</span>
        </span>
        <button type="button" className="st-banner__action" onClick={retry} disabled={checking}>
          {checking ? 'Checking…' : 'Retry'}
        </button>
      </div>
    );
  }

  if (showBack) {
    return (
      <div className="st-banner" data-tone="back" role="status" aria-live="polite">
        <span className="st-banner__icon" aria-hidden="true">
          <LuWifi />
        </span>
        <span className="st-banner__text">
          <span className="st-banner__title">You’re back online</span>
          <span className="st-banner__sub">Everything is loading again.</span>
        </span>
      </div>
    );
  }

  return null;
}


export default NetworkStatusBanner;
