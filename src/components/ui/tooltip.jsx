import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';

/**
 * A generic hover/focus tooltip - originally built for the sidebar's
 * collapsed icon rail, also used for compact icon-only row actions in admin
 * tables (`side="top"`).
 *
 * Portalled to document.body and positioned with `fixed` coordinates from the
 * trigger's own bounding box, rather than an absolutely-positioned sibling.
 * That matters beyond the sidebar too: a tooltip inside a `.ui-table-wrap`
 * (which scrolls horizontally) or a modal body would otherwise be clipped by
 * the nearest scrolling/overflow ancestor - escaping to `document.body` sidesteps
 * that entirely, the same trick `SearchableSelect`'s menu uses.
 */
export function Tooltip({ label, enabled = true, side = 'right', children, className }) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState(null);
  const triggerRef = useRef(null);

  const show = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCoords(
      side === 'top'
        ? { top: rect.top, left: rect.left + rect.width / 2 }
        : { top: rect.top + rect.height / 2, left: side === 'right' ? rect.right : rect.left }
    );
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
                side === 'top'
                  ? 'translate(-50%, calc(-100% - 0.5rem))'
                  : side === 'right'
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
