import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { cn } from '../../lib/utils';

/**
 * A single-select combobox with an in-dropdown search box.
 *
 * Generic on purpose - Subject, Teacher, Student and anything else reuse this
 * rather than each page growing its own dropdown.
 *
 * Filtering happens locally over `options`. When the caller is searching on
 * the server, pass `onSearchChange` and hand back already-filtered options;
 * set `filterLocally={false}` so the list is not filtered twice.
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

  const containerRef = useRef(null);
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
      const label = String(getOptionLabel(o) ?? '').toLowerCase();
      const description = String(getOptionDescription(o) ?? '').toLowerCase();
      return label.includes(term) || description.includes(term);
    });
  }, [options, search, filterLocally, getOptionLabel, getOptionDescription]);

  /**
   * Closing also resets the search box.
   *
   * Done here rather than in an effect watching `open`: clearing state from an
   * effect body triggers an extra render pass, and every close already goes
   * through this function.
   */
  const close = useCallback(() => {
    setOpen(false);
    setSearch('');
    setActiveIndex(0);
  }, []);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) close();
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

  // Focus the search box when the list opens.
  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  // Keep the highlighted row in view.
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

  return (
    <div className={cn('mb-4 flex flex-col gap-1', className)} ref={containerRef}>
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

      <div className="relative">
        <button
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
                  <span
                    className="truncate text-xs"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
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

        {open && (
          <div
            className="absolute z-40 mt-1 w-full overflow-hidden rounded-[var(--radius-md)] border shadow-lg"
            style={{
              background: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
              boxShadow: 'var(--shadow-md)',
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
              className="m-0 max-h-64 list-none overflow-y-auto p-1"
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
                        background:
                          isSelected || isActive ? 'var(--color-primary-soft)' : 'transparent',
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
        )}
      </div>

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
    </div>
  );
}

export default SearchableSelect;
