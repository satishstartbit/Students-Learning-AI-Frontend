import { colors, toneColors } from './colors';
import { typography, fontFamily, fontSize, fontWeight, lineHeight } from './typography';
import { spacing, radius, layout } from './spacing';
import { shadows, focusRing, zIndex } from './shadows';

/**
 * Central theme entry point.
 *
 * Token values live in theme/variables.css; the JS modules here expose them
 * by name for JS-applied styles. Import from this file rather than reaching
 * into individual token modules.
 */
export { colors, toneColors };
export { typography, fontFamily, fontSize, fontWeight, lineHeight };
export { spacing, radius, layout };
export { shadows, focusRing, zIndex };

export const theme = {
  colors,
  toneColors,
  typography,
  spacing,
  radius,
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

export default theme;
