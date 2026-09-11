/**
 * Elevation tokens, referencing the CSS variables in variables.css.
 */
export const shadows = {
  1: 'var(--elevation-1)',
  2: 'var(--elevation-2)',
  3: 'var(--elevation-3)',
  4: 'var(--elevation-4)',
  sticky: 'var(--shadow-sticky)',
  stickyLift: 'var(--shadow-sticky-lift)',
};

export const focusRing = {
  default: 'var(--focus-ring)',
  error: 'var(--focus-ring-error)',
};

/**
 * z-modal consolidates the old, identically-valued --z-drawer and the
 * dead --z-modal into one token. z-popover tokenizes the value portaled
 * menus (MultiSelect/SearchableSelect) and the full-page loader already
 * used deliberately - it must stay above z-modal so a combobox opened
 * inside a dialog keeps rendering above it.
 */
export const zIndex = {
  dropdown: 'var(--z-dropdown)',
  modal: 'var(--z-modal)',
  popover: 'var(--z-popover)',
  toast: 'var(--z-toast)',
};

export default shadows;
