import Alert from './Alert';
import { useToast } from '../../hooks/useToast';

/**
 * Renders the toast queue. Mount once, near the root of the app.
 *
 * Anything (including non-React module code) can raise a toast through
 * `toast.success(...)` from hooks/useToast.
 */
export function Toast({ className = '' }) {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      className={`ui-toast-region ${className}`.trim()}
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((item) => (
        <Alert
          key={item.id}
          variant={item.variant}
          title={item.title}
          onDismiss={() => dismiss(item.id)}
          className="ui-toast"
        >
          {item.message}
        </Alert>
      ))}
    </div>
  );
}

export default Toast;
