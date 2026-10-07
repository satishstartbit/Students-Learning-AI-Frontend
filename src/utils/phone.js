import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { DEFAULT_COUNTRY } from './locale';
import {
  formatPhoneAsYouType as formatAsYouType,
  formatPhoneForDisplay as formatForDisplay,
  PHONE_EXAMPLE,
} from './phoneFormat';

export { PHONE_EXAMPLE };

/**
 * Phone number handling via libphonenumber-js rather than a regex - accepts
 * +1 (416) 555-1234, (416) 555-1234, 416-555-1234, 4165551234 and
 * +1 416 555 1234 alike, and can tell a plausible number from a real one the
 * way a pattern cannot. Every screen shows a Canadian (+1) number as
 * "+1 (416) 555-1234" (utils/phoneFormat.js); the API stores E.164.
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

/** "+1 (416) 555-1234" as the user types (PhoneInput's foreign-number field uses it for "+44…"). */
export function formatPhoneAsYouType(raw) {
  return formatAsYouType(raw);
}

/** Stored number -> "+1 (416) 555-1234" for display (other countries: "+44 20 7946 0958"). */
export function formatPhoneForDisplay(stored, defaultCountry = DEFAULT_COUNTRY) {
  return formatForDisplay(stored, defaultCountry);
}

export default {
  isValidPhoneNumber,
  normalizePhoneNumber,
  formatPhoneAsYouType,
  formatPhoneForDisplay,
};
