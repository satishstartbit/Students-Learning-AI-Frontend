/**
 * Subject colours, pure (no React, no API) - tested in subjectColor.test.js.
 *
 * One colour per subject across the platform: the Super Admin sets the
 * default on the Subjects master (Master Management), a student may choose
 * their own, and every screen that shows a subject draws it with that colour
 * through SubjectColorContext (useSubjectColors.js). The colours are data,
 * never hard-coded here.
 */

/** Lower-case, single-spaced subject name - the key colours are stored under (the backend uses the same rule). */
export function subjectKey(name) {
  return String(name ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .slice(0, 100);
}

const HEX = /^#?([0-9a-f]{6})$/i;

/** '#RRGGBB' or null. */
export function normalizeHex(value) {
  const m = HEX.exec(String(value ?? '').trim());
  return m ? `#${m[1].toUpperCase()}` : null;
}

const channel = (c) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

/** WCAG relative luminance of '#RRGGBB' (0 black ... 1 white), or null. */
export function luminance(hex) {
  const normal = normalizeHex(hex);
  if (!normal) return null;
  const n = parseInt(normal.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

// Luminance of the two fixed inks (--color-text-on-light #2a2521, --color-text-on-dark #fff).
const DARK_INK_L = luminance('#2a2521');

/**
 * Which fixed ink reads best on a subject colour: 'dark' (--color-text-on-light)
 * or 'light' (--color-text-on-dark) - whichever has the higher contrast.
 */
export function inkFor(hex) {
  const l = luminance(hex);
  if (l === null) return 'dark';
  const withDark = (l + 0.05) / (DARK_INK_L + 0.05);
  const withLight = 1.05 / (l + 0.05);
  return withDark >= withLight ? 'dark' : 'light';
}

/** Map of subject key -> '#RRGGBB' from [{ name | key, color }]; later entries don't override earlier ones. */
export function colorMapFrom(subjects = []) {
  const map = new Map();
  for (const s of subjects) {
    const key = s?.key ?? subjectKey(s?.name);
    const color = normalizeHex(s?.color);
    if (key && color && !map.has(key)) map.set(key, color);
  }
  return map;
}

/**
 * Props that paint an element in a subject's colour: a CSS variable the
 * stylesheet reads (`--subject-color`) and `data-ink` for the text colour on
 * top. Returns {} when the subject has no colour, so callers fall back to
 * their neutral look.
 */
export function subjectPaint(color) {
  const hex = normalizeHex(color);
  if (!hex) return {};
  return { style: { '--subject-color': hex }, 'data-subject-color': '', 'data-ink': inkFor(hex) };
}
