import { cloneElement, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const MENU_GAP = 4;
const VIEWPORT_MARGIN = 8;
const ITEM_SELECTOR = '[role="menuitem"]:not(:disabled)';
const TRIGGER_SELECTOR = 'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

/**
 * Menu attached to a trigger element.
 *
 * The menu renders in a portal with fixed positioning, so a scrolling table
 * (.ui-table-wrap) or a card with overflow: hidden can't clip it. It opens
 * below the trigger, or above it when there is more room there. Under the
 * K-4 area it portals into .kid-theme, which is a wrapper, not <body>, so
 * the kid tokens still apply.
 *
 * @param trigger - element that opens the menu; receives the ARIA props
 * @param items   - [{ key, label, icon, onClick, href, disabled, danger, divider }]
 */
export function Dropdown({ trigger, items = [], align = 'start', className = '', children }) {
  const [host, setHost] = useState(null);
  const isOpen = host !== null;
  const containerRef = useRef(null);
  const menuRef = useRef(null);
  const menuId = useId();

  const close = useCallback((returnFocus = false) => {
    setHost(null);
    if (returnFocus) containerRef.current?.querySelector(TRIGGER_SELECTOR)?.focus();
  }, []);

  const place = useCallback(() => {
    const anchor = containerRef.current;
    const menu = menuRef.current;
    if (!anchor || !menu) return;

    const rect = anchor.getBoundingClientRect();
    menu.style.maxHeight = '';
    const { offsetWidth: width, offsetHeight: height } = menu;

    const below = window.innerHeight - rect.bottom - MENU_GAP - VIEWPORT_MARGIN;
    const above = rect.top - MENU_GAP - VIEWPORT_MARGIN;
    const dropUp = height > below && above > below;
    const room = Math.max(dropUp ? above : below, 0);
    if (height > room) menu.style.maxHeight = `${room}px`;

    const top = dropUp ? rect.top - MENU_GAP - Math.min(height, room) : rect.bottom + MENU_GAP;
    const preferredLeft = align === 'end' ? rect.right - width : rect.left;
    const maxLeft = document.documentElement.clientWidth - width - VIEWPORT_MARGIN;
    const left = Math.max(VIEWPORT_MARGIN, Math.min(preferredLeft, maxLeft));

    menu.style.top = `${top}px`;
    menu.style.left = `${left}px`;
  }, [align]);

  useLayoutEffect(() => {
    if (!isOpen) return undefined;
    place();
    menuRef.current?.querySelector(ITEM_SELECTOR)?.focus({ preventScroll: true });

    const onScroll = (event) => {
      if (!menuRef.current?.contains(event.target)) place();
    };
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', place);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(place);
    if (menuRef.current) observer?.observe(menuRef.current);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', place);
      observer?.disconnect();
    };
  }, [isOpen, place]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const onPointerDown = (event) => {
      const insideTrigger = containerRef.current?.contains(event.target);
      const insideMenu = menuRef.current?.contains(event.target);
      if (!insideTrigger && !insideMenu) close();
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') close(true);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, close]);

  // The menu sits at the end of <body>, away from the trigger, so the
  // keyboard is handled here: arrows move between items, Escape and Tab
  // go back to the trigger (Tab then carries on from there).
  const onMenuKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      close(true);
      return;
    }
    if (event.key === 'Tab') {
      close(true);
      return;
    }

    const options = [...(menuRef.current?.querySelectorAll(ITEM_SELECTOR) ?? [])];
    if (!options.length) return;
    const current = options.indexOf(document.activeElement);
    const next = {
      ArrowDown: (current + 1) % options.length,
      ArrowUp: (current - 1 + options.length) % options.length,
      Home: 0,
      End: options.length - 1,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    options[next].focus();
  };

  const triggerProps = {
    onClick: (event) => {
      trigger.props.onClick?.(event);
      const target = event.currentTarget.closest('.kid-theme') ?? document.body;
      setHost((current) => (current ? null : target));
    },
    'aria-haspopup': 'menu',
    'aria-expanded': isOpen,
    'aria-controls': isOpen ? menuId : undefined,
  };

  const menu = isOpen && (
    <ul
      ref={menuRef}
      id={menuId}
      className={`ui-dropdown__menu ui-dropdown__menu--${align}`}
      role="menu"
      onKeyDown={onMenuKeyDown}
    >
      {children}

      {items.map((item, index) =>
        item.divider ? (
          <li key={`divider-${index}`} className="ui-dropdown__divider" role="separator" />
        ) : (
          <li key={item.key ?? item.label} role="none">
            {item.href ? (
              <a
                href={item.href}
                role="menuitem"
                className={`ui-dropdown__item ${item.danger ? 'ui-dropdown__item--danger' : ''}`.trim()}
                onClick={() => close()}
              >
                {item.icon && <span aria-hidden="true">{item.icon}</span>}
                {item.label}
              </a>
            ) : (
              <button
                type="button"
                role="menuitem"
                className={`ui-dropdown__item ${item.danger ? 'ui-dropdown__item--danger' : ''}`.trim()}
                disabled={item.disabled}
                onClick={() => {
                  item.onClick?.();
                  close();
                }}
              >
                {item.icon && <span aria-hidden="true">{item.icon}</span>}
                {item.label}
              </button>
            )}
          </li>
        )
      )}
    </ul>
  );

  return (
    <div className={`ui-dropdown ${className}`.trim()} ref={containerRef}>
      {cloneElement(trigger, triggerProps)}
      {menu && createPortal(menu, host)}
    </div>
  );
}

export default Dropdown;
