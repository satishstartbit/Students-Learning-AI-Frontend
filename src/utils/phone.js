import { parsePhoneNumberFromString, AsYouType } from 'libphonenumber-js';
import { DEFAULT_COUNTRY } from './locale';

/**
 * Phone number handling via libphonenumber-js rather than a regex - accepts
 * (416) 555-1234, 416-555-1234, 4165551234 and +1 416 555 1234 alike, and can
 * tell a plausible number from a real one the way a pattern cannot.
 */
export function isValidPhoneNumber(raw, defaultCountry = DEFAULT_COUNTRY) {
  if (!raw) return false;
  const parsed = parsePhoneNumberFromString(String(raw), defaultCountry);
  return Boolean(parsed?.isValid());
}

/** Normalizes to E.164 ("+14165551234") for submission; null when not a valid number. */
export function normalizePhoneNumber(raw, defaultCountry = DEFAULT_COUNTRY) {
  if (!raw) return null;
  const parsed = parsePhoneNumberFromString(String(raw), defaultCountry);
  return parsed?.isValid() ? parsed.number : null;
}

/** "(416) 555-1234" as the user types - for a live-formatting phone input. */
export function formatPhoneAsYouType(raw, defaultCountry = DEFAULT_COUNTRY) {
  if (!raw) return '';
  return new AsYouType(defaultCountry).input(String(raw));
}

/** E.164 -> "(416) 555-1234" for read-only display. */
export function formatPhoneForDisplay(e164, defaultCountry = DEFAULT_COUNTRY) {
  if (!e164) return '';
  const parsed = parsePhoneNumberFromString(String(e164), defaultCountry);
  return parsed ? parsed.formatNational() : e164;
}

export default {
  isValidPhoneNumber,
  normalizePhoneNumber,
  formatPhoneAsYouType,
  formatPhoneForDisplay,
};
