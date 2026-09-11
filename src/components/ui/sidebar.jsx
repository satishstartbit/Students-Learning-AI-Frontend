import { forwardRef, useCallback, useEffect, useId, useMemo, useState } from 'react';
import { cn } from '../../lib/utils';
import { useIsMobile } from '../../hooks/useIsMobile';
import { SidebarContext, useSidebar } from './sidebar-context';

// Re-exported so the documented import path keeps working.
// eslint-disable-next-line react-refresh/only-export-components
export { useSidebar };

/**
 * shadcn/ui sidebar, ported to JSX.
 *
 * Same component contract and composition as the documented shadcn sidebar
 * (SidebarProvider > Sidebar > SidebarContent > SidebarGroup > SidebarMenu),
 * so the usage in the docs applies unchanged. Two deliberate differences:
 *
 *  - JSX rather than TSX, because this project is JavaScript.
 *  - The mobile off-canvas panel is built in rather than delegating to a
 *    separate Sheet component, so the sidebar has no other shadcn dependency.
 *
 * Tailwind's preflight is disabled (see styles/tailwind.css) to protect the
 * existing design system, so interactive elements reset their own UA styles
 * via `appearance-none bg-transparent border-0` instead of relying on it.
 */
const SIDEBAR_WIDTH = '16rem';
const SIDEBAR_WIDTH_MOBILE = '18rem';
const SIDEBAR_WIDTH_ICON = '3.25rem';
const SIDEBAR_KEYBOARD_SHORTCUT = 'b';
const SIDEBAR_STORAGE_KEY = 'eflp.sidebar';

// ---------------------------------------------------------------- provider

export function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange,
  className,
  style,
  children,
  ...props
}) {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = useState(false);

  // Remember the desktop state across reloads; a collapsed rail should stay
  // collapsed. Wrapped because storage throws in some privacy modes.
  const [internalOpen, setInternalOpen] = useState(() => {
    try {
      const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
      return stored === null ? defaultOpen : stored === 'true';
    } catch {
      return defaultOpen;
    }
  });

  const open = openProp ?? internalOpen;

  const setOpen = useCallback(
    (value) => {
      const next = typeof value === 'function' ? value(open) : value;

      if (onOpenChange) onOpenChange(next);
      else setInternalOpen(next);

      try {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch {
        /* a lost preference is not worth failing over */
      }
    },
    [open, onOpenChange]
  );

  const toggleSidebar = useCallback(
    () => (isMobile ? setOpenMobile((v) => !v) : setOpen((v) => !v)),
    [isMobile, setOpen]
  );

  // cmd+B / ctrl+B, as documented.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggleSidebar]);

  const state = open ? 'expanded' : 'collapsed';

  const value = useMemo(
    () => ({ state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar }),
    [state, open, setOpen, isMobile, openMobile, toggleSidebar]
  );

  return (
    <SidebarContext.Provider value={value}>
      <div
        data-slot="sidebar-wrapper"
        style={{
          '--sidebar-width': SIDEBAR_WIDTH,
          '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
          '--sidebar-width-mobile': SIDEBAR_WIDTH_MOBILE,
          ...style,
        }}
        /*
         * The app shell: one flex row, viewport tall, that never scrolls
         * itself. The sidebar is a shrink-0 flex child and the inset takes
         * the rest, so main content can never render underneath the sidebar
         * and no offset or z-index is needed to keep them apart.
         *
         * overflow-hidden here means scrolling happens inside the inset, so
         * the sidebar stays put while the page scrolls.
         */
        className={cn('group/sidebar-wrapper flex h-svh w-full overflow-hidden', className)}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

// ---------------------------------------------------------------- sidebar

export function Sidebar({
  side = 'left',
  variant = 'sidebar',
  collapsible = 'offcanvas',
  className,
  children,
  ...props
}) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

  if (collapsible === 'none') {
    return (
      <div
        data-slot="sidebar"
        className={cn(
          'bg-sidebar text-sidebar-foreground flex h-full w-(--sidebar-width) flex-col',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }

  // Mobile: an overlay panel rather than an in-place collapse.
  if (isMobile) {
    return (
      <>
        {openMobile && (
          <div
            className="fixed inset-0 z-40 bg-[color:var(--color-bg-scrim)] md:hidden"
            onClick={() => setOpenMobile(false)}
            aria-hidden="true"
          />
        )}
        <div
          data-slot="sidebar"
          data-mobile="true"
          data-state={openMobile ? 'expanded' : 'collapsed'}
          role="dialog"
          aria-modal={openMobile || undefined}
          aria-label="Sidebar"
          aria-hidden={!openMobile}
          className={cn(
            'bg-sidebar text-sidebar-foreground fixed inset-y-0 z-50 flex w-(--sidebar-width-mobile) max-w-[85vw] flex-col shadow-lg transition-transform duration-200 ease-linear md:hidden',
            side === 'left' ? 'left-0' : 'right-0',
            openMobile
              ? 'translate-x-0'
              : side === 'left'
                ? '-translate-x-full'
                : 'translate-x-full',
            className
          )}
          {...props}
        >
          {children}
        </div>
      </>
    );
  }

  /*
   * Desktop: an ordinary flex child, not a fixed overlay.
   *
   * The width is driven by the element's own data-state, and `shrink-0` stops
   * the flex row squeezing it, so the inset beside it always occupies exactly
   * the remaining space. This is what removes the overlap - there is no
   * absolutely-positioned panel to sit on top of the content, and no spacer
   * div that could fall out of step with it.
   *
   * `group` + data-collapsible stay on this element because every collapsed
   * style below (hidden labels, square buttons) is written as a descendant
   * variant of it.
   */
  return (
    <div
      className={cn(
        'group peer bg-sidebar text-sidebar-foreground relative hidden h-full shrink-0 flex-col md:flex',
        'overflow-hidden transition-[width] duration-200 ease-linear',
        'data-[state=expanded]:w-(--sidebar-width)',
        collapsible === 'icon'
          ? 'data-[state=collapsed]:w-(--sidebar-width-icon)'
          : 'data-[state=collapsed]:w-0',
        side === 'left' ? 'border-r' : 'border-l',
        'border-sidebar-border',
        className
      )}
      data-state={state}
      data-collapsible={state === 'collapsed' ? collapsible : ''}
      data-variant={variant}
      data-side={side}
      data-slot="sidebar"
      {...props}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------- controls

export const SidebarTrigger = forwardRef(function SidebarTrigger(
  { className, onClick, children, ...props },
  ref
) {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      ref={ref}
      type="button"
      data-slot="sidebar-trigger"
      aria-label="Toggle sidebar"
      title="Toggle sidebar (Ctrl+B)"
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      className={cn(
        'inline-flex h-8 w-8 cursor-pointer appearance-none items-center justify-center rounded-md border-0 bg-transparent text-current',
        'hover:bg-accent focus-visible:ring-ring/50 focus-visible:ring-2 focus-visible:outline-none',
        className
      )}
      {...props}
    >
      {children ?? (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 3v18" />
        </svg>
      )}
    </button>
  );
});

/**
 * The strip along the sidebar's inner edge; clicking it toggles collapse.
 *
 * Sits inside the sidebar's own box (which is `relative`), so it needs no
 * negative offset and cannot overlap the content area.
 */
export function SidebarRail({ className, ...props }) {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      type="button"
      data-slot="sidebar-rail"
      aria-label="Toggle sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle sidebar"
      className={cn(
        'absolute inset-y-0 hidden w-1.5 appearance-none border-0 bg-transparent transition-colors sm:block',
        'group-data-[side=left]:right-0 group-data-[side=right]:left-0',
        'hover:bg-sidebar-border cursor-col-resize',
        className
      )}
      {...props}
    />
  );
}

/**
 * The main content column.
 *
 * `flex-1` claims the space the sidebar does not use and `min-w-0` lets it
 * shrink below its content's intrinsic width - without that, a wide table
 * would push the column out and force the whole page to scroll sideways
 * instead of scrolling within its own container.
 */
export function SidebarInset({ className, ...props }) {
  return (
    <div
      data-slot="sidebar-inset"
      className={cn('bg-background flex h-full min-w-0 flex-1 flex-col overflow-hidden', className)}
      {...props}
    />
  );
}

// ---------------------------------------------------------------- regions

export function SidebarHeader({ className, ...props }) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={cn('flex flex-col gap-2 p-2', className)}
      {...props}
    />
  );
}

export function SidebarFooter({ className, ...props }) {
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={cn('flex flex-col gap-2 p-2', className)}
      {...props}
    />
  );
}

export function SidebarContent({ className, ...props }) {
  return (
    <div
      data-slot="sidebar-content"
      data-sidebar="content"
      className={cn(
        'flex min-h-0 flex-1 flex-col gap-2 overflow-auto',
        'group-data-[collapsible=icon]:overflow-hidden',
        className
      )}
      {...props}
    />
  );
}

export function SidebarSeparator({ className, ...props }) {
  return (
    <hr
      data-slot="sidebar-separator"
      className={cn('bg-sidebar-border mx-2 h-px w-auto border-0', className)}
      {...props}
    />
  );
}

// ---------------------------------------------------------------- groups

export function SidebarGroup({ className, ...props }) {
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn('relative flex w-full min-w-0 flex-col p-2', className)}
      {...props}
    />
  );
}

export function SidebarGroupLabel({ className, as: Component = 'div', ...props }) {
  return (
    <Component
      data-slot="sidebar-group-label"
      data-sidebar="group-label"
      className={cn(
        'text-muted-foreground flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-semibold tracking-wide uppercase',
        'transition-[margin,opacity] duration-200 ease-linear',
        // Hidden rather than removed, so the group keeps its spacing.
        'group-data-[collapsible=icon]:mt-0 group-data-[collapsible=icon]:opacity-0',
        className
      )}
      {...props}
    />
  );
}

export function SidebarGroupAction({ className, ...props }) {
  return (
    <button
      type="button"
      data-slot="sidebar-group-action"
      className={cn(
        'text-sidebar-foreground absolute top-3.5 right-3 flex aspect-square w-5 cursor-pointer appearance-none items-center justify-center rounded-md border-0 bg-transparent p-0',
        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        'group-data-[collapsible=icon]:hidden',
        className
      )}
      {...props}
    />
  );
}

export function SidebarGroupContent({ className, ...props }) {
  return (
    <div
      data-slot="sidebar-group-content"
      data-sidebar="group-content"
      className={cn('w-full text-sm', className)}
      {...props}
    />
  );
}

// ---------------------------------------------------------------- menu

export function SidebarMenu({ className, ...props }) {
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn('flex w-full min-w-0 list-none flex-col gap-1 p-0', className)}
      {...props}
    />
  );
}

export const SidebarMenuItem = forwardRef(function SidebarMenuItem({ className, ...props }, ref) {
  return (
    <li
      ref={ref}
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={cn('group/menu-item relative', className)}
      {...props}
    />
  );
});

const MENU_BUTTON_BASE = [
  'peer/menu-button group/menu-button relative flex w-full min-w-0 items-center gap-2 overflow-hidden rounded-md px-2 text-left text-sm outline-hidden',
  'cursor-pointer appearance-none border-0 bg-transparent no-underline',
  'text-sidebar-foreground transition-[width,height,padding]',
  'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
  'focus-visible:ring-sidebar-ring focus-visible:ring-2',
  'disabled:pointer-events-none disabled:opacity-50',
  'data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-semibold',
  '[&>svg]:size-4 [&>svg]:shrink-0',
  /*
   * Collapsed rail: a square button showing only the leading icon.
   *
   * Everything after the first child is hidden. An earlier version targeted
   * `span:last-child`, which silently failed whenever a trailing <svg> (the
   * chevron) was the real last child - the label then stayed visible and
   * overflowed the rail.
   */
  'group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:justify-center',
  'group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:overflow-hidden',
  'group-data-[collapsible=icon]:[&>*:not(:first-child)]:hidden',
].join(' ');

const MENU_BUTTON_SIZES = {
  sm: 'h-7 text-xs',
  default: 'h-8 text-sm',
  lg: 'h-12 text-sm',
};

/**
 * A menu entry.
 *
 * Renders a <button> by default. Pass `href` for a plain link, or `as` to use
 * a router component (this app passes react-router's NavLink).
 */
export const SidebarMenuButton = forwardRef(function SidebarMenuButton(
  { as: Component, href, isActive = false, size = 'default', tooltip, className, ...props },
  ref
) {
  const Element = Component ?? (href ? 'a' : 'button');
  const extra = Element === 'button' ? { type: 'button' } : {};

  return (
    <Element
      ref={ref}
      href={href}
      data-slot="sidebar-menu-button"
      data-sidebar="menu-button"
      data-size={size}
      data-active={isActive || undefined}
      // Surfaces the label when the rail is collapsed to icons.
      title={tooltip}
      className={cn(MENU_BUTTON_BASE, MENU_BUTTON_SIZES[size], className)}
      {...extra}
      {...props}
    />
  );
});

export function SidebarMenuAction({ className, showOnHover = false, ...props }) {
  return (
    <button
      type="button"
      data-slot="sidebar-menu-action"
      className={cn(
        'text-sidebar-foreground absolute top-1.5 right-1 flex aspect-square w-5 cursor-pointer appearance-none items-center justify-center rounded-md border-0 bg-transparent p-0',
        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        'group-data-[collapsible=icon]:hidden',
        showOnHover &&
          'opacity-0 focus-within:opacity-100 group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 peer-data-[active=true]/menu-button:opacity-100',
        className
      )}
      {...props}
    />
  );
}

export function SidebarMenuBadge({ className, ...props }) {
  return (
    <div
      data-slot="sidebar-menu-badge"
      className={cn(
        'text-sidebar-foreground pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums select-none',
        'peer-data-[size=sm]/menu-button:top-1 peer-data-[size=default]/menu-button:top-1.5 peer-data-[size=lg]/menu-button:top-2.5',
        'group-data-[collapsible=icon]:hidden',
        className
      )}
      {...props}
    />
  );
}

export function SidebarMenuSkeleton({ className, showIcon = false, ...props }) {
  const id = useId();

  /*
   * Varied widths so a loading list does not look like a barcode. Derived
   * from the component's own id rather than Math.random, so it stays stable
   * across re-renders and rendering remains pure.
   */
  const width = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) % 41;
    return `${50 + hash}%`;
  }, [id]);

  return (
    <div
      data-slot="sidebar-menu-skeleton"
      className={cn('flex h-8 items-center gap-2 rounded-md px-2', className)}
      {...props}
    >
      {showIcon && <div className="bg-sidebar-accent size-4 shrink-0 animate-pulse rounded-md" />}
      <div
        className="bg-sidebar-accent h-4 max-w-(--skeleton-width) flex-1 animate-pulse rounded-md"
        style={{ '--skeleton-width': width }}
      />
    </div>
  );
}

// ---------------------------------------------------------------- submenu

export function SidebarMenuSub({ className, ...props }) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      className={cn(
        'border-sidebar-border mx-3.5 flex min-w-0 list-none flex-col gap-1 border-l px-2.5 py-0.5',
        'group-data-[collapsible=icon]:hidden',
        className
      )}
      {...props}
    />
  );
}

export function SidebarMenuSubItem({ className, ...props }) {
  return (
    <li
      data-slot="sidebar-menu-sub-item"
      className={cn('group/menu-sub-item relative', className)}
      {...props}
    />
  );
}

export const SidebarMenuSubButton = forwardRef(function SidebarMenuSubButton(
  { as: Component, href, size = 'md', isActive = false, className, ...props },
  ref
) {
  const Element = Component ?? (href ? 'a' : 'button');
  const extra = Element === 'button' ? { type: 'button' } : {};

  return (
    <Element
      ref={ref}
      href={href}
      data-slot="sidebar-menu-sub-button"
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive || undefined}
      className={cn(
        'text-sidebar-foreground flex h-8 w-full min-w-0 items-center gap-2 overflow-hidden rounded-md px-2',
        'cursor-pointer appearance-none border-0 bg-transparent no-underline outline-hidden',
        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        'focus-visible:ring-sidebar-ring focus-visible:ring-2',
        'data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-semibold',
        size === 'sm' ? 'text-xs' : 'text-sm',
        '[&>svg]:size-4 [&>svg]:shrink-0 [&>span:last-child]:truncate',
        'group-data-[collapsible=icon]:hidden',
        className
      )}
      {...extra}
      {...props}
    />
  );
});
