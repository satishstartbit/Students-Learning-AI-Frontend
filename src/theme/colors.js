/**
 * Colour tokens.
 *
 * These reference the CSS variables in variables.css/accent.css rather than
 * repeating hex values, so each colour is defined exactly once and
 * JS-applied styles follow the active Color (light/dark) and Theme (accent
 * family) automatically.
 *
 *   <div style={{ background: colors.surface }} />
 */
export const colors = {
  accentBase: 'var(--accent-base)',
  accentHover: 'var(--accent-hover)',
  accentPressed: 'var(--accent-pressed)',
  accentOn: 'var(--accent-on)',
  accentSoft: 'var(--accent-soft)',
  accentSoftHover: 'var(--accent-soft-hover)',
  accentBorder: 'var(--accent-border)',
  accentRing: 'var(--accent-ring)',

  secondary: 'var(--color-secondary)',
  secondaryHover: 'var(--color-secondary-hover)',
  secondarySoft: 'var(--color-secondary-soft)',

  bgCanvas: 'var(--color-bg-canvas)',
  surface: 'var(--color-bg-surface)',
  surfaceRaised: 'var(--color-bg-surface-raised)',
  surfaceSunken: 'var(--color-bg-surface-sunken)',
  bgInverse: 'var(--color-bg-inverse)',
  bgScrim: 'var(--color-bg-scrim)',

  textPrimary: 'var(--color-text-primary)',
  textSecondary: 'var(--color-text-secondary)',
  textTertiary: 'var(--color-text-tertiary)',
  textDisabled: 'var(--color-text-disabled)',
  textOnDark: 'var(--color-text-on-dark)',
  textInverse: 'var(--color-text-inverse)',

  border: 'var(--color-border-default)',
  borderStrong: 'var(--color-border-strong)',
  borderControl: 'var(--color-border-control)',

  iconPrimary: 'var(--color-icon-primary)',
  iconSecondary: 'var(--color-icon-secondary)',
  iconDisabled: 'var(--color-icon-disabled)',
  iconInverse: 'var(--color-icon-inverse)',

  success: 'var(--color-success-fg)',
  successBg: 'var(--color-success-bg)',
  successBorder: 'var(--color-success-border)',
  successSolid: 'var(--color-success-solid)',
  successOnSolid: 'var(--color-success-on-solid)',

  warning: 'var(--color-warning-fg)',
  warningBg: 'var(--color-warning-bg)',
  warningBorder: 'var(--color-warning-border)',
  warningSolid: 'var(--color-warning-solid)',
  warningOnSolid: 'var(--color-warning-on-solid)',

  danger: 'var(--color-danger-fg)',
  dangerHover: 'var(--color-danger-hover)',
  dangerBg: 'var(--color-danger-bg)',
  dangerBorder: 'var(--color-danger-border)',
  dangerSolid: 'var(--color-danger-solid)',
  dangerOnSolid: 'var(--color-danger-on-solid)',

  info: 'var(--color-info-fg)',
  infoBg: 'var(--color-info-bg)',
  infoBorder: 'var(--color-info-border)',
  infoSolid: 'var(--color-info-solid)',
  infoOnSolid: 'var(--color-info-on-solid)',
};

/** Maps a status tone to its pair of colour tokens. */
export const toneColors = {
  neutral: { fg: colors.textSecondary, bg: colors.surfaceSunken },
  accent: { fg: colors.accentBase, bg: colors.accentSoft },
  success: { fg: colors.success, bg: colors.successBg },
  warning: { fg: colors.warning, bg: colors.warningBg },
  danger: { fg: colors.danger, bg: colors.dangerBg },
  info: { fg: colors.info, bg: colors.infoBg },
};

export default colors;
