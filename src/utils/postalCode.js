/**
 * Canadian postal-code formatting/validation. See utils/postalCode.js on the
 * backend for the matching server-side rule - kept in sync deliberately
 * rather than sharing a package, since the two apps don't currently share code.
 */
const POSTAL_CODE_PATTERN = /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d$/i;

export const isValidCanadianPostalCode = (value) =>
  typeof value === 'string' && POSTAL_CODE_PATTERN.test(value.trim());

/**
 * "k1a0b1" -> "K1A 0B1" as the user types: uppercases and inserts the space
 * once there are enough characters, without fighting the caret by reformatting
 * characters that are already correct.
 */
export function formatCanadianPostalCode(value) {
  if (typeof value !== 'string') return '';
  const compact = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  return compact.length > 3 ? `${compact.slice(0, 3)} ${compact.slice(3)}` : compact;
}

export default { isValidCanadianPostalCode, formatCanadianPostalCode };
