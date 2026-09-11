/**
 * Spacing, radius, dimension and layout tokens, referencing the CSS
 * variables in variables.css.
 *
 * NOTE: `spacing.lg` changed value in the token migration (16px -> 20px).
 * The old 16px step is `spacing.base` now.
 */
export const spacing = {
  0: 'var(--spacing-0)',
  '2xs': 'var(--spacing-2xs)',
  xs: 'var(--spacing-xs)',
  sm: 'var(--spacing-sm)',
  md: 'var(--spacing-md)',
  base: 'var(--spacing-base)',
  lg: 'var(--spacing-lg)',
  xl: 'var(--spacing-xl)',
  '2xl': 'var(--spacing-2xl)',
  '3xl': 'var(--spacing-3xl)',
  '4xl': 'var(--spacing-4xl)',
  '5xl': 'var(--spacing-5xl)',
  '6xl': 'var(--spacing-6xl)',
};

export const radius = {
  none: 'var(--radius-none)',
  xs: 'var(--radius-xs)',
  sm: 'var(--radius-sm)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
  xl: 'var(--radius-xl)',
  '2xl': 'var(--radius-2xl)',
  full: 'var(--radius-full)',
};

export const dimension = {
  icon: {
    xs: 'var(--icon-size-xs)',
    sm: 'var(--icon-size-sm)',
    md: 'var(--icon-size-md)',
    lg: 'var(--icon-size-lg)',
  },
  control: {
    sm: 'var(--control-height-sm)',
    md: 'var(--control-height-md)',
    lg: 'var(--control-height-lg)',
    touchTarget: 'var(--control-height-touch-target)',
  },
  avatar: {
    xs: 'var(--avatar-size-xs)',
    sm: 'var(--avatar-size-sm)',
    md: 'var(--avatar-size-md)',
    lg: 'var(--avatar-size-lg)',
    xl: 'var(--avatar-size-xl)',
  },
};

export const layout = {
  sidebarWidth: 'var(--layout-sidebar-width)',
  sidebarWidthCollapsed: 'var(--layout-sidebar-width-collapsed)',
  navbarHeight: 'var(--layout-navbar-height)',
};

export default spacing;
