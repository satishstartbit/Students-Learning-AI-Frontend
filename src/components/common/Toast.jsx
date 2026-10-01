import { useEffect, useId, useSyncExternalStore } from 'react';
import Alert from './Alert';
import { useToast } from '../../hooks/useToast';

/*
 * Only ONE <Toast /> may paint the queue. The layouts mount it, and many
 * pages mount another; each copy used to draw the same toasts in the same
 * fixed spot, so screen readers announced every message twice. Mounted
 * copies register here and only the first one renders.
 */
const mounted = [];
const listeners = new Set();
const notify = () => listeners.forEach((listener) => listener());
const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const currentOwner = () => mounted[0] ?? null;

function register(id) {
  mounted.push(id);
  notify();
  return () => {
    const index = mounted.indexOf(id);
    if (index >= 0) mounted.splice(index, 1);
    notify();
  };
}

/**
 * Renders the toast queue. Mount once, near the root of the app (extra
 * mounts are harmless - only one copy renders).
 *
 * Anything (including non-React module code) can raise a toast through
 * `toast.success(...)` from hooks/useToast.
 */
export function Toast({ className = '' }) {
  const id = useId();
  const { toasts, dismiss } = useToast();
  useEffect(() => register(id), [id]);
  const owner = useSyncExternalStore(subscribe, currentOwner, currentOwner);

  if (owner !== id || toasts.length === 0) return null;

  return (
    <div
      className={`ui-toast-region ${className}`.trim()}
      role="region"
      aria-label="Notifications"
    >
      {/* Like the mockup's "Profile saved / Your changes are live.": a toast
          with a title shows the message under it; a message on its own
          ("Progress saved") is the bold line. */}
      {toasts.map((item) => (
        <Alert
          key={item.id}
          variant={item.variant}
          title={item.title ?? item.message}
          onDismiss={() => dismiss(item.id)}
          className="ui-toast"
        >
          {item.title ? item.message : null}
        </Alert>
      ))}
    </div>
  );
}

export default Toast;
