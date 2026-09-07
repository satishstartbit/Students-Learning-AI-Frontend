import { cloneElement, useEffect, useId, useRef, useState } from 'react';

/**
 * Menu attached to a trigger element.
 *
 * @param trigger - element that opens the menu; receives the ARIA props
 * @param items   - [{ key, label, icon, onClick, href, disabled, danger, divider }]
 */
export function Dropdown({ trigger, items = [], align = 'start', className = '', children }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const menuId = useId();

  useEffect(() => {
    if (!isOpen) return undefined;

    const onPointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setIsOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  const triggerProps = {
    onClick: (event) => {
      trigger.props.onClick?.(event);
      setIsOpen((v) => !v);
    },
    'aria-haspopup': 'menu',
    'aria-expanded': isOpen,
    'aria-controls': isOpen ? menuId : undefined,
  };

  return (
    <div className={`ui-dropdown ${className}`.trim()} ref={containerRef}>
      {cloneElement(trigger, triggerProps)}

      {isOpen && (
        <ul id={menuId} className={`ui-dropdown__menu ui-dropdown__menu--${align}`} role="menu">
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
                    onClick={() => setIsOpen(false)}
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
                      setIsOpen(false);
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
      )}
    </div>
  );
}

export default Dropdown;
