import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Label from './Label';
import FormError from './FormError';
import Badge from './Badge';

const MENU_MAX_HEIGHT = 320;
const MENU_GAP = 4;

/**
 * Multi-choice select built as an accessible listbox.
 *
 * @param value              array of selected values
 * @param onChange           (nextValues) => void
 * @param options            [{ value, label, description, disabled }]
 * @param searchable         show an in-menu search box that filters options
 * @param onSearchChange     called as the user types (for server-side search);
 *                           when supplied, pass filterLocally={false} and hand
 *                           back already-filtered options, same as SearchableSelect
 * @param filterLocally      filter `options` in the browser (default true)
 * @param getOptionDescription option => secondary text (e.g. an email)
 * @param showSelectAll      show "Select all" / "Clear all" above the options.
 *                           "Select all" only affects options currently
 *                           visible under the search filter.
 */
export function MultiSelect({
  name,
  label,
  value = [],
  onChange,
  options = [],
  placeholder = 'Select options',
  searchable = false,
  searchPlaceholder = 'Search…',
  onSearchChange,
  filterLocally = true,
  loading = false,
  getOptionDescription = (o) => o?.description ?? null,
  showSelectAll = false,
  hint,
  error,
  required = false,
  disabled = false,
  maxSelected,
  className = '',
}) {
  const generatedId = useId();
  const controlId = `${name || 'multiselect'}-${generatedId}`;
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [position, setPosition] = useState(null);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const searchRef = useRef(null);

  // Every close path goes through here so the search box always resets.
  const closeMenu = () => {
    setIsOpen(false);
    setSearch('');
    setPosition(null);
  };

  /**
   * The menu renders in a portal on <body> - like SearchableSelect, this
   * control is used inside .ui-card (overflow: hidden), which would clip an
   * absolutely-positioned child. Flips above the trigger when there is not
   * enough room below.
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
      maxHeight: Math.max(160, Math.min(MENU_MAX_HEIGHT, (dropUp ? rect.top : spaceBelow) - MENU_GAP * 2)),
    });
  }, []);

  useLayoutEffect(() => {
    if (isOpen) updatePosition();
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const onScroll = () => updatePosition();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [isOpen, updatePosition]);

  // Close when focus or a click leaves the component. The menu lives outside
  // the trigger's subtree (portal), so both have to be checked.
  useEffect(() => {
    if (!isOpen) return undefined;

    const onPointerDown = (event) => {
      const insideTrigger = containerRef.current?.contains(event.target);
      const insideMenu = menuRef.current?.contains(event.target);
      if (!insideTrigger && !insideMenu) closeMenu();
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeMenu();
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  // Focus the search box once the menu has painted.
  useEffect(() => {
    if (isOpen) searchRef.current?.focus();
  }, [isOpen]);

  const selected = new Set(value);
  const atLimit = maxSelected != null && value.length >= maxSelected;

  const toggle = (optionValue) => {
    const next = selected.has(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];

    if (maxSelected != null && next.length > maxSelected) return;
    onChange?.(next);
  };

  const remove = (optionValue) => onChange?.(value.filter((v) => v !== optionValue));

  const labelFor = (v) => options.find((o) => o.value === v)?.label ?? v;

  const visibleOptions = useMemo(() => {
    if (!searchable || !filterLocally || !search.trim()) return options;

    const term = search.trim().toLowerCase();
    return options.filter((o) => {
      const optionLabel = String(o.label ?? '').toLowerCase();
      const description = String(getOptionDescription(o) ?? '').toLowerCase();
      return optionLabel.includes(term) || description.includes(term);
    });
  }, [options, search, searchable, filterLocally, getOptionDescription]);

  const selectableVisible = visibleOptions.filter((o) => !o.disabled);
  const allVisibleSelected =
    selectableVisible.length > 0 && selectableVisible.every((o) => selected.has(o.value));

  const selectAllVisible = () => {
    const additions = selectableVisible.map((o) => o.value).filter((v) => !selected.has(v));
    let next = [...value, ...additions];
    if (maxSelected != null) next = next.slice(0, maxSelected);
    onChange?.(next);
  };

  const clearAll = () => onChange?.([]);

  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;

  const menu = isOpen && position && (
    <div
      ref={menuRef}
      className="ui-multiselect__menu"
      style={{
        position: 'fixed',
        left: position.left,
        width: position.width,
        top: position.top,
        bottom: position.bottom,
        maxHeight: position.maxHeight,
        zIndex: 900,
      }}
    >
      {searchable && (
              <div className="ui-multiselect__search">
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    onSearchChange?.(e.target.value);
                  }}
                  placeholder={searchPlaceholder}
                  aria-label={searchPlaceholder}
                />
              </div>
            )}

            {showSelectAll && (
              <div className="ui-multiselect__controls">
                <button
                  type="button"
                  className="ui-multiselect__control-btn"
                  onClick={selectAllVisible}
                  disabled={selectableVisible.length === 0 || allVisibleSelected}
                >
                  Select all{search.trim() ? ' (matching)' : ''}
                </button>
                <button
                  type="button"
                  className="ui-multiselect__control-btn"
                  onClick={clearAll}
                  disabled={value.length === 0}
                >
                  Clear all
                </button>
                <span className="ui-multiselect__count">{value.length} selected</span>
              </div>
            )}

            <ul role="listbox" aria-multiselectable="true" className="ui-multiselect__list">
              {loading && (
                <li className="ui-multiselect__option" aria-disabled="true">
                  Loading…
                </li>
              )}

              {!loading && visibleOptions.length === 0 && (
                <li className="ui-multiselect__option" aria-disabled="true">
                  {search.trim() ? 'No matches' : 'No options available'}
                </li>
              )}

              {!loading && visibleOptions.map((option) => {
                const isSelected = selected.has(option.value);
                const isDisabled = option.disabled || (atLimit && !isSelected);
                const description = getOptionDescription(option);

                return (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={isDisabled || undefined}
                    className="ui-multiselect__option"
                    onClick={() => !isDisabled && toggle(option.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (!isDisabled) toggle(option.value);
                      }
                    }}
                    tabIndex={isDisabled ? -1 : 0}
                    style={isDisabled ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                  >
                    <input type="checkbox" checked={isSelected} readOnly tabIndex={-1} />
                    <span className="ui-multiselect__option-text">
                      <span>{option.label}</span>
                      {description && (
                        <span className="ui-multiselect__option-description">{description}</span>
                      )}
                    </span>
                  </li>
                );
              })}
      </ul>
    </div>
  );

  return (
    <div className={`ui-field ${className}`.trim()} ref={containerRef}>
      {label && (
        <Label htmlFor={controlId} required={required}>
          {label}
        </Label>
      )}

      <div className="ui-multiselect">
        <button
          ref={triggerRef}
          id={controlId}
          type="button"
          className="ui-multiselect__control"
          onClick={() => {
            if (disabled) return;
            if (isOpen) closeMenu();
            else setIsOpen(true);
          }}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-invalid={Boolean(error)}
          aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        >
          {value.length === 0 ? (
            <span className="ui-multiselect__placeholder">{placeholder}</span>
          ) : (
            value.map((v) => (
              <Badge key={v} variant="primary" className="ui-multiselect__chip">
                {labelFor(v)}
                <span
                  role="button"
                  tabIndex={-1}
                  aria-label={`Remove ${labelFor(v)}`}
                  className="ui-multiselect__chip-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(v);
                  }}
                >
                  ✕
                </span>
              </Badge>
            ))
          )}
        </button>
      </div>

      {hint && !error && (
        <span id={hintId} className="ui-hint">
          {hint}
          {maxSelected != null && ` (up to ${maxSelected})`}
        </span>
      )}
      <FormError id={errorId}>{error}</FormError>

      {menu && createPortal(menu, document.body)}
    </div>
  );
}

export default MultiSelect;
