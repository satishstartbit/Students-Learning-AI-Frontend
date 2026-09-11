import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';

/**
 * A hover/focus tooltip for the sidebar's collapsed icon rail.
 *
 * Portalled to document.body and positioned with `fixed` coordinates from the
 * trigger's own bounding box, rather than an absolutely-positioned sibling.
 *
 * The rail sits inside several ancestors that clip overflow by design (the
 * app shell wrapper, the sidebar box itself, and its content region while
 * collapsed - all needed so the width-collapse animation doesn't show a
 * horizontal scrollbar). A tooltip flying out to the right of a 52px-wide
 * rail is exactly the content those ancestors clip, so it can only be shown
 * by escaping the DOM tree entirely.
 */
export function Tooltip({ label, enabled = true, side = 'right', children, className }) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState(null);
  const triggerRef = useRef(null);

  const show = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCoords({
      top: rect.top + rect.height / 2,
      left: side === 'right' ? rect.right : rect.left,
    });
    setVisible(true);
  };
  const hide = () => setVisible(false);

  // A scroll or resize invalidates the measured position, so drop the tooltip
  // rather than let it drift away from its trigger.
  useEffect(() => {
    if (!visible) return undefined;

    window.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);
    return () => {
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', hide);
    };
  }, [visible]);

  if (!enabled || !label) return children;

  return (
    <span
      ref={triggerRef}
      className={cn('relative block', className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}

      {visible &&
        coords &&
        createPortal(
          <span
            role="tooltip"
            className={cn(
              'pointer-events-none fixed z-[100] whitespace-nowrap',
              'rounded-[var(--radius-sm)] px-2 py-1 text-xs font-medium'
            )}
            style={{
              top: coords.top,
              left: coords.left,
              transform:
                side === 'right'
                  ? 'translate(0.5rem, -50%)'
                  : 'translate(calc(-100% - 0.5rem), -50%)',
              background: 'var(--color-bg-inverse)',
              color: 'var(--color-text-on-dark)',
              boxShadow: 'var(--elevation-3)',
            }}
          >
            {label}
          </span>,
          document.body
        )}
    </span>
  );
}

export default Tooltip;
