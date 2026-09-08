/**
 * Typography tokens, referencing the CSS variables in variables.css.
 */
export const fontFamily = {
  base: 'var(--font-family-base)',
  mono: 'var(--font-family-mono)',
};

export const fontSize = {
  xs: 'var(--font-size-xs)',
  sm: 'var(--font-size-sm)',
  md: 'var(--font-size-md)',
  lg: 'var(--font-size-lg)',
  xl: 'var(--font-size-xl)',
  '2xl': 'var(--font-size-2xl)',
};

export const fontWeight = {
  regular: 'var(--font-weight-regular)',
  medium: 'var(--font-weight-medium)',
  semibold: 'var(--font-weight-semibold)',
  bold: 'var(--font-weight-bold)',
};

export const lineHeight = {
  tight: 'var(--line-height-tight)',
  base: 'var(--line-height-base)',
};

export const typography = { fontFamily, fontSize, fontWeight, lineHeight };

export default typography;
