/**
 * Colour tokens.
 *
 * These reference the CSS variables in variables.css rather than repeating
 * hex values, so each colour is defined exactly once and JS-applied styles
 * follow the active theme automatically.
 *
 *   <div style={{ background: colors.surface }} />
 */
export const colors = {
  primary: 'var(--color-primary)',
  primaryHover: 'var(--color-primary-hover)',
  primarySoft: 'var(--color-primary-soft)',

  secondary: 'var(--color-secondary)',
  secondaryHover: 'var(--color-secondary-hover)',
  secondarySoft: 'var(--color-secondary-soft)',

  background: 'var(--color-background)',
  surface: 'var(--color-surface)',
  surfaceAlt: 'var(--color-surface-alt)',

  textPrimary: 'var(--color-text-primary)',
  textSecondary: 'var(--color-text-secondary)',
  textInverse: 'var(--color-text-inverse)',

  border: 'var(--color-border)',
  borderStrong: 'var(--color-border-strong)',

  success: 'var(--color-success)',
  successSoft: 'var(--color-success-soft)',
  warning: 'var(--color-warning)',
  warningSoft: 'var(--color-warning-soft)',
  error: 'var(--color-error)',
  errorSoft: 'var(--color-error-soft)',
  info: 'var(--color-info)',
  infoSoft: 'var(--color-info-soft)',
};

/** Maps a status tone to its pair of colour tokens. */
export const toneColors = {
  neutral: { fg: colors.textSecondary, bg: colors.surfaceAlt },
  primary: { fg: colors.primary, bg: colors.primarySoft },
  success: { fg: colors.success, bg: colors.successSoft },
  warning: { fg: colors.warning, bg: colors.warningSoft },
  danger: { fg: colors.error, bg: colors.errorSoft },
  info: { fg: colors.info, bg: colors.infoSoft },
};

export default colors;
