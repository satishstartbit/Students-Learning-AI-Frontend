import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';

/**
 * A single-select combobox with an in-dropdown search box.
 *
 * Generic on purpose - Subject, Teacher, Student and anything else reuse this
 * rather than each page growing its own dropdown.
 *
 * The menu renders in a portal on <body>, positioned against the trigger's
 * bounding box. That is not decoration: the control is used inside .ui-card,
 * which sets `overflow: hidden`, and an absolutely-positioned child would be
 * clipped at the card's edge. No z-index can escape a clipping ancestor - the
 * element has to leave the subtree. The portal also sidesteps any stacking
 * context an ancestor happens to create, so the menu works inside modals and
 * scroll containers too.
 *
 * Filtering happens locally over `options`. When the caller searches on the
 * server, pass `onSearchChange` and hand back already-filtered options; set
 * `filterLocally={false}` so the list is not filtered twice.
 *
 * @param options            array of items
 * @param value              currently selected value
 * @param onChange           (value, option) => void
 * @param getOptionValue     item => unique value        (default: o.value ?? o.id)
 * @param getOptionLabel     item => primary text        (default: o.label ?? o.name)
 * @param getOptionDescription item => secondary line    (default: o.description)
 * @param placeholder        text shown when nothing is selected
 * @param searchPlaceholder  placeholder inside the search box
 * @param loading            show a loading row
 * @param disabled           disable the trigger
 * @param emptyMessage       shown when there are no options
 * @param disabledMessage    shown on the trigger while disabled
 * @param clearable          allow clearing the selection
 * @param onSearchChange     called as the user types (for server-side search)
 * @param filterLocally      filter `options` in the browser (default true)
 */
const MENU_MAX_HEIGHT = 288;
const MENU_GAP = 4;

export function SearchableSelect({
  options = [],
  value = null,
  onChange,
  getOptionValue = (o) => o?.value ?? o?.id,
  getOptionLabel = (o) => o?.label ?? o?.name ?? '',
  getOptionDescription = (o) => o?.description ?? null,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  loading = false,
  disabled = false,
  emptyMessage = 'No results found',
  disabledMessage = null,
  clearable = true,
  onSearchChange,
  filterLocally = true,
  label,
  hint,
  error,
  required = false,
  id,
  className,
}) {
  const generatedId = useId();
  const controlId = id ?? `searchable-${generatedId}`;
  const listboxId = `${controlId}-listbox`;

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState(null);

  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const searchRef = useRef(null);
  const optionRefs = useRef([]);

  const selected = useMemo(
    () => options.find((o) => getOptionValue(o) === value) ?? null,
    [options, value, getOptionValue]
  );

  const visible = useMemo(() => {
    if (!filterLocally || !search.trim()) return options;

    const term = search.trim().toLowerCase();
    return options.filter((o) => {
      const optionLabel = String(getOptionLabel(o) ?? '').toLowerCase();
      const description = String(getOptionDescription(o) ?? '').toLowerCase();
      return optionLabel.includes(term) || description.includes(term);
    });
  }, [options, search, filterLocally, getOptionLabel, getOptionDescription]);

  /**
   * Anchors the portal to the trigger.
   *
   * Flips above when there is not enough room below, so the menu is never
   * stranded off-screen near the bottom of the viewport.
   */
  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropUp = spaceBelow < MENU_MAX_HEIGHT && rect.top > spaceBelow;

    setPosition({
      left: rect.left,
      width: rect.width,
      top: dropUp ? undefined : rect.bottom + MENU_GAP,
      bottom: dropUp ? window.innerHeight - rect.top + MENU_GAP : undefined,
      maxHeight: Math.max(
        160,
        Math.min(MENU_MAX_HEIGHT, (dropUp ? rect.top : spaceBelow) - MENU_GAP * 2)
      ),
    });
  }, []);

  /** Closing also resets the search box. Every close path goes through here. */
  const close = useCallback(() => {
    setOpen(false);
    setSearch('');
    setActiveIndex(0);
    setPosition(null);
  }, []);

  // Measure before paint so the menu never flashes in the wrong place.
  useLayoutEffect(() => {
    if (open) updatePosition();
  }, [open, updatePosition]);

  // Keep it anchored while the page moves underneath it.
  useEffect(() => {
    if (!open) return undefined;

    const onScroll = () => updatePosition();
    // Capture phase so scrolling in any ancestor container is caught, not
    // just the window.
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);

    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open, updatePosition]);

  // Close on outside click or Escape. The menu lives outside the trigger's
  // subtree, so both have to be checked.
  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      const insideTrigger = triggerRef.current?.contains(event.target);
      const insideMenu = menuRef.current?.contains(event.target);
      if (!insideTrigger && !insideMenu) close();
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') close();
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, close]);

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  useEffect(() => {
    optionRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const commit = (option) => {
    onChange?.(getOptionValue(option), option);
    close();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, visible.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (visible[activeIndex]) commit(visible[activeIndex]);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setActiveIndex(Math.max(visible.length - 1, 0));
    }
  };

  const describedBy = [hint ? `${controlId}-hint` : null, error ? `${controlId}-error` : null]
    .filter(Boolean)
    .join(' ');

  const menu = open && position && (
    <div
      ref={menuRef}
      className="fixed overflow-hidden rounded-[var(--radius-md)] border"
      style={{
        left: position.left,
        width: position.width,
        top: position.top,
        bottom: position.bottom,
        background: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        boxShadow: 'var(--shadow-lg)',
        // Above the modal overlay (800) but below toasts (1000), so the
        // control still works inside a dialog.
        zIndex: 900,
      }}
    >
      <div
        className="flex items-center gap-2 border-b px-3 py-2"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <span aria-hidden="true" className="text-xs opacity-60">
          🔍
        </span>
        <input
          ref={searchRef}
          type="text"
          value={search}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          aria-controls={listboxId}
          onChange={(event) => {
            setSearch(event.target.value);
            setActiveIndex(0);
            onSearchChange?.(event.target.value);
          }}
          onKeyDown={handleKeyDown}
          className="w-full appearance-none border-0 bg-transparent text-sm outline-none"
          style={{ color: 'var(--color-text-primary)' }}
        />
      </div>

      <ul
        id={listboxId}
        role="listbox"
        aria-label={label ?? placeholder}
        className="m-0 list-none overflow-y-auto p-1"
        style={{ maxHeight: position.maxHeight }}
      >
        {loading && (
          <li
            className="px-3 py-3 text-sm"
            style={{ color: 'var(--color-text-secondary)' }}
            aria-live="polite"
          >
            Loading…
          </li>
        )}

        {!loading && visible.length === 0 && (
          <li className="px-3 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {emptyMessage}
          </li>
        )}

        {!loading &&
          visible.map((option, index) => {
            const optionValue = getOptionValue(option);
            const isSelected = optionValue === value;
            const isActive = index === activeIndex;

            return (
              <li
                key={optionValue}
                ref={(node) => {
                  optionRefs.current[index] = node;
                }}
                role="option"
                aria-selected={isSelected}
                onClick={() => commit(option)}
                onMouseEnter={() => setActiveIndex(index)}
                className="flex cursor-pointer flex-col rounded-[var(--radius-sm)] px-3 py-2 text-sm"
                style={{
                  background: isSelected || isActive ? 'var(--color-primary-soft)' : 'transparent',
                  color: isSelected ? 'var(--color-primary)' : 'var(--color-text-primary)',
                  fontWeight: isSelected ? 600 : 400,
                }}
              >
                <span className="truncate">{getOptionLabel(option)}</span>
                {getOptionDescription(option) && (
                  <span
                    className="truncate text-xs font-normal"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {getOptionDescription(option)}
                  </span>
                )}
              </li>
            );
          })}
      </ul>
    </div>
  );

  return (
    <div className={cn('mb-4 flex flex-col gap-1', className)}>
      {label && (
        <label
          htmlFor={controlId}
          className="text-[13px] font-semibold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {label}
          {required && (
            <span aria-hidden="true" style={{ color: 'var(--color-error)' }}>
              {' '}
              *
            </span>
          )}
        </label>
      )}

      <button
        ref={triggerRef}
        id={controlId}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-haspopup="listbox"
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy || undefined}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          if (open) close();
          else setOpen(true);
        }}
        className={cn(
          'flex w-full cursor-pointer appearance-none items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-left text-sm',
          'border transition-colors outline-none',
          'focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)]/35',
          disabled && 'cursor-not-allowed opacity-60'
        )}
        style={{
          background: disabled ? 'var(--color-surface-alt)' : 'var(--color-surface)',
          borderColor: error ? 'var(--color-error)' : 'var(--color-border)',
          color: 'var(--color-text-primary)',
        }}
      >
        <span className="min-w-0 flex-1 truncate">
          {selected ? (
            <span className="flex min-w-0 flex-col">
              <span className="truncate">{getOptionLabel(selected)}</span>
              {getOptionDescription(selected) && (
                <span className="truncate text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {getOptionDescription(selected)}
                </span>
              )}
            </span>
          ) : (
            <span style={{ color: 'var(--color-text-secondary)' }}>
              {disabled && disabledMessage ? disabledMessage : placeholder}
            </span>
          )}
        </span>

        {clearable && selected && !disabled && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Clear selection"
            onClick={(event) => {
              event.stopPropagation();
              onChange?.(null, null);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                event.stopPropagation();
                onChange?.(null, null);
              }
            }}
            className="rounded p-0.5 text-xs hover:opacity-70"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            ✕
          </span>
        )}

        <span aria-hidden="true" className="text-xs opacity-60">
          ▾
        </span>
      </button>

      {hint && !error && (
        <span
          id={`${controlId}-hint`}
          className="text-[13px]"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {hint}
        </span>
      )}

      {error && (
        <span
          id={`${controlId}-error`}
          role="alert"
          className="text-[13px]"
          style={{ color: 'var(--color-error)' }}
        >
          {error}
        </span>
      )}

      {menu && createPortal(menu, document.body)}
    </div>
  );
}

export default SearchableSelect;
