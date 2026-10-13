import { useEffect, useId, useRef, useState } from 'react';
import { LuCheck, LuChevronDown, LuFilter } from 'react-icons/lu';
import './schoolwork.css';

/**
 * "Sort: Recommended ⌄" (the Plan mockups, both bands): a button that opens a
 * short list of orders (schoolwork.js#sortOptionsFor). Picking one sorts the
 * work inside every column, section or day of the current view.
 *
 * Keyboard: Enter/Space/↓ opens it on the current choice, ↑/↓ move, Enter
 * picks, Esc closes and returns to the button. A click outside closes it.
 *
 *   variant   'kid' for the K-4 look (rounder, Fredoka)
 */
export function SortMenu({ value, options = [], onChange, variant, label = 'Sort' }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const itemRefs = useRef([]);
  const listId = useId();
  const current = options.find((o) => o.key === value) ?? options[0];

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    // Focus the chosen order when the list opens.
    const index = Math.max(0, options.findIndex((o) => o.key === value));
    itemRefs.current[index]?.focus();
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [open, options, value]);

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) buttonRef.current?.focus();
  };
  const pick = (key) => {
    onChange(key);
    close();
  };
  const onListKey = (e) => {
    const items = itemRefs.current.filter(Boolean);
    const at = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      items[(at + 1) % items.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      items[(at - 1 + items.length) % items.length]?.focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'Tab') {
      close(false);
    }
  };

  return (
    <div className="sw-sort" data-variant={variant} ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className="sw-sort__button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        <LuFilter size={14} aria-hidden="true" />
        <span>
          {label}: <strong>{current?.label}</strong>
        </span>
        <LuChevronDown size={14} aria-hidden="true" className="sw-sort__chevron" />
      </button>
      {open && (
        <ul id={listId} className="sw-sort__menu" role="menu" aria-label={label} onKeyDown={onListKey}>
          {options.map((o, i) => (
            <li key={o.key} role="none">
              <button
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                type="button"
                role="menuitemradio"
                aria-checked={o.key === current?.key}
                className="sw-sort__item"
                onClick={() => pick(o.key)}
              >
                <span>{o.label}</span>
                {o.key === current?.key && <LuCheck size={15} aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SortMenu;
