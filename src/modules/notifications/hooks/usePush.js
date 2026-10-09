import { useCallback, useEffect, useState } from 'react';
import notificationService from '../services/notification.service';

/**
 * Browser push on THIS device (Phase 1 "delivered in-app, by email, and as
 * browser push"; backend services/push.service.js). Push is per browser: the
 * switch subscribes this browser with the server's VAPID key, or removes it.
 *
 * Returns { status, busy, error, enable, disable } where status is
 *   'unsupported'  this browser can't do push (or the page isn't https)
 *   'off-server'   the server has no push keys - hide the switch
 *   'blocked'      the person blocked notifications for this site
 *   'on' | 'off'   subscribed here or not
 *   'loading'
 */
const supported = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window && window.isSecureContext;

function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

async function registration() {
  return (await navigator.serviceWorker.getRegistration('/')) ?? navigator.serviceWorker.register('/sw.js');
}

export function usePush() {
  const [status, setStatus] = useState(supported() ? 'loading' : 'unsupported');
  const [server, setServer] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!supported()) return setStatus('unsupported');
    try {
      const { data } = await notificationService.getPushStatus();
      setServer(data);
      if (!data?.enabled) return setStatus('off-server');
      if (Notification.permission === 'denied') return setStatus('blocked');
      const reg = await navigator.serviceWorker.getRegistration('/');
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      return setStatus(sub ? 'on' : 'off');
    } catch {
      return setStatus('off-server');
    }
  }, []);

  useEffect(() => {
    // Deferred so the first render isn't a cascading update (react-hooks/set-state-in-effect).
    const t = setTimeout(refresh, 0);
    return () => clearTimeout(t);
  }, [refresh]);

  const enable = useCallback(async () => {
    if (!server?.publicKey) return;
    setBusy(true);
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatus(permission === 'denied' ? 'blocked' : 'off');
        return;
      }
      const reg = await registration();
      await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(server.publicKey) }));
      await notificationService.savePushSubscription(sub.toJSON());
      setStatus('on');
    } catch (err) {
      setError(err?.message || "Couldn't turn on browser notifications");
    } finally {
      setBusy(false);
    }
  }, [server]);

  const disable = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration('/');
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) {
        await notificationService.removePushSubscription(sub.endpoint).catch(() => {});
        await sub.unsubscribe();
      }
      setStatus('off');
    } catch (err) {
      setError(err?.message || "Couldn't turn off browser notifications");
    } finally {
      setBusy(false);
    }
  }, []);

  return { status, busy, error, enable, disable };
}

export default usePush;
