import { cn } from '../../lib/utils';

/**
 * A lightweight hover/focus tooltip.
 *
 * CSS-driven rather than state-driven: the label is always in the DOM and
 * revealed by `group-hover` / `group-focus-within`, so there is no per-item
 * React state and no render on hover.
 *
 * Used by the sidebar to name icons once the rail is collapsed. When
 * `enabled` is false it renders the child untouched, so an expanded sidebar
 * carries no tooltip markup at all.
 */
export function Tooltip({ label, enabled = true, side = 'right', children, className }) {
  if (!enabled || !label) return children;

  return (
    <span className={cn('group/tooltip relative block', className)}>
      {children}

      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute top-1/2 z-50 -translate-y-1/2 whitespace-nowrap',
          'rounded-[var(--radius-sm)] px-2 py-1 text-xs font-medium',
          'opacity-0 transition-opacity duration-150',
          'group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100',
          side === 'right' ? 'left-full ml-2' : 'right-full mr-2'
        )}
        style={{
          background: 'var(--color-text-primary)',
          color: 'var(--color-surface)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        {label}
      </span>
    </span>
  );
}

export default Tooltip;
