import { colors, toneColors } from './colors';
import { typography, fontFamily, fontSize, fontWeight, lineHeight } from './typography';
import { spacing, radius, dimension, layout } from './spacing';
import { shadows, focusRing, zIndex } from './shadows';

/**
 * Central theme entry point.
 *
 * Token values live in theme/variables.css/accent.css; the JS modules here
 * expose them by name for JS-applied styles. Import from this file rather
 * than reaching into individual token modules.
 */
export { colors, toneColors };
export { typography, fontFamily, fontSize, fontWeight, lineHeight };
export { spacing, radius, dimension, layout };
export { shadows, focusRing, zIndex };

export const theme = {
  colors,
  toneColors,
  typography,
  spacing,
  radius,
  dimension,
  layout,
  shadows,
  focusRing,
  zIndex,
};

/** The theme choices the app supports. `system` follows the OS preference. */
export const THEME_MODES = Object.freeze({
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
});

/**
 * Applies a theme mode by stamping data-theme onto <html>.
 *
 * `system` removes the attribute so the prefers-color-scheme rules in
 * variables.css take over. Called by the Redux theme slice listener.
 */
export function applyThemeMode(mode) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  if (mode === THEME_MODES.SYSTEM || !mode) root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', mode);
}

/**
 * The accent families theme/accent.css ships, in the order the student
 * "Make it yours" page shows them. `swatch`/`swatchSoft` are only for the
 * picker's own preview tiles - everything else reads the live
 * --accent-* tokens, which follow light/dark on their own.
 *
 * Keep in step with the backend whitelist (services/studentSettings.service.js
 * ACCENTS), which is what a saved choice is validated against.
 */
export const ACCENTS = Object.freeze([
  { value: 'ocean', label: 'Ocean', swatch: '#0b7285', swatchSoft: '#e3f2f6' },
  { value: 'sunset', label: 'Sunset', swatch: '#c2410c', swatchSoft: '#fff1e8' },
  { value: 'forest', label: 'Forest', swatch: '#047857', swatchSoft: '#e9f7f1' },
  { value: 'lavender', label: 'Lavender', swatch: '#7c3aed', swatchSoft: '#f2ecfe' },
  { value: 'bubblegum', label: 'Bubblegum', swatch: '#be185d', swatchSoft: '#fdeef5' },
]);

export const DEFAULT_ACCENT = 'ocean';

/**
 * Applies an accent family by stamping data-accent onto <html>, the mirror of
 * applyThemeMode. Ocean is the default the bare :root block already defines,
 * so it needs no attribute.
 */
export function applyAccent(accent) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const known = ACCENTS.some((a) => a.value === accent);

  if (!known || accent === DEFAULT_ACCENT) root.removeAttribute('data-accent');
  else root.setAttribute('data-accent', accent);
}

export default theme;
