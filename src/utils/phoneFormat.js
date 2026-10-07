import { parsePhoneNumberFromString, AsYouType } from 'libphonenumber-js';

/**
 * Phone formatting the whole site shares - pure, so node:test can load it
 * (utils/phone.js adds the configured default country and is what screens
 * import).
 *
 * North American numbers (Canada, the U.S. and the rest of the NANP, country
 * code +1) always read "+1 (416) 555-1234": +1, the three-digit area code in
 * brackets, then the seven-digit local number. Any other country keeps
 * libphonenumber's international format ("+44 20 7946 0958"). Storage and the
 * API stay E.164 ("+14165551234"). Phone fields are entered as "+1" and three
 * boxes (PHONE_PARTS below, components/common/PhoneInput).
 */

/** An example for hints and messages. */
export const PHONE_EXAMPLE = '+1 (416) 555-1234';

const NANP_CODE = '1';

/** True when the text is (or is becoming) a +1 number: no "+", or "+1…". */
function isNanpInput(text) {
  return !text.startsWith('+') || text === '+' || text.startsWith(`+${NANP_CODE}`);
}

/**
 * The national digits typed so far (area code + local number, at most 10),
 * without the +1 country code. A leading 1 is always the country code: no
 * North American area code starts with 1.
 */
export function nationalDigits(raw) {
  const text = String(raw ?? '').trim();
  let digits = text.replace(/\D/g, '');
  if (digits.startsWith(NANP_CODE)) digits = digits.slice(1);
  return digits.slice(0, 10);
}

/** "+1 (416) 555-1234" from national digits; a partial number never ends on punctuation. */
function formatNational(digits) {
  let out = `+${NANP_CODE} (${digits.slice(0, 3)}`;
  if (digits.length > 3) out += `) ${digits.slice(3, 6)}`;
  if (digits.length > 6) out += `-${digits.slice(6, 10)}`;
  return out;
}

/**
 * Live formatting for a phone field: "4165551234", "416-555-1234",
 * "1 416 555 1234" and "+1 416 555 1234" all become "+1 (416) 555-1234" as
 * they are typed or pasted. A number starting with another country code
 * ("+44…") is formatted for that country instead.
 */
export function formatPhoneAsYouType(raw) {
  const text = String(raw ?? '').trim();
  if (!text) return '';
  if (!isNanpInput(text)) return new AsYouType().input(text);
  if (text === '+') return '+';
  const digits = nationalDigits(text);
  if (digits) return formatNational(digits);
  // Only the country code so far ("1" or "+1"): show it, so typing on reads naturally.
  return text.replace(/\D/g, '').startsWith(NANP_CODE) ? `+${NANP_CODE}` : '';
}

/** A stored number (E.164, or an older bare 10-digit one) the way the site shows it. */
export function formatPhoneForDisplay(stored, defaultCountry) {
  if (!stored) return '';
  const parsed = parsePhoneNumberFromString(String(stored), defaultCountry);
  if (!parsed) return String(stored);
  if (parsed.countryCallingCode === NANP_CODE) return formatNational(String(parsed.nationalNumber));
  return parsed.formatInternational();
}

// ---------------------------------------------------------------- three boxes
//
// The phone field (components/common/PhoneInput) is three boxes after a fixed
// +1: area code (3), the first 3 digits of the local number, the last 4. Its
// value is still one string, so forms, validation and the API are unchanged.

/** The three boxes, in order. */
export const PHONE_PARTS = Object.freeze([
  { key: 'area', length: 3, label: 'Area code', placeholder: 'XXX' },
  { key: 'exchange', length: 3, label: 'First 3 digits', placeholder: 'XXX' },
  { key: 'line', length: 4, label: 'Last 4 digits', placeholder: 'XXXX' },
]);

const PART_LENGTHS = PHONE_PARTS.map((part) => part.length);
const BOXES_VALUE = /^\+1 \((\d{0,3})\) (\d{0,3})-(\d{0,4})$/;

/** A number from outside the +1 plan ("+44 20…"): the boxes cannot hold it, so it keeps one free-format field. */
export function isOtherCountryPhone(value) {
  return /^\+\s*[02-9]/.test(String(value ?? '').trim());
}

/**
 * The field value split into its three boxes. A value the boxes wrote keeps
 * each box as it was, even half filled; anything else (E.164, "(416)
 * 555-1234", an older bare 10-digit number) is read digit by digit.
 */
export function splitPhone(value) {
  const text = String(value ?? '').trim();
  const match = text.match(BOXES_VALUE);
  if (match) return [match[1], match[2], match[3]];
  const digits = nationalDigits(text);
  return [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 10)];
}

/** The three boxes back into the field value: "+1 (416) 555-1234" when full, "" when all empty. */
export function joinPhone(parts) {
  const [area = '', exchange = '', line = ''] = parts ?? [];
  if (!area && !exchange && !line) return '';
  return `+${NANP_CODE} (${area}) ${exchange}-${line}`;
}

/**
 * What box `index` now holds after typing, pasting or autofill (`raw` is the
 * box's whole new text). Digits that do not fit move on into the next boxes,
 * the way they would in one long field, so a whole number typed or pasted
 * into the first box fills all three. In the first box a leading 1 is the
 * country code and is dropped (no area code starts with 1).
 *
 * Returns { parts, box, caret }: where the last of those digits ended up.
 */
export function fillPhoneParts(parts, index, raw) {
  const next = PART_LENGTHS.map((_, i) => String(parts?.[i] ?? ''));
  let digits = String(raw ?? '').replace(/\D/g, '');
  if (index === 0) digits = digits.replace(/^1/, '');

  next[index] = digits.slice(0, PART_LENGTHS[index]);
  let carry = digits.slice(PART_LENGTHS[index]);
  // The overflow is what was just typed or pasted; digits it pushes along are not.
  let fresh = carry.length;
  let box = index;
  let caret = next[index].length;
  for (let i = index + 1; carry && i < PART_LENGTHS.length; i += 1) {
    const room = PART_LENGTHS[i];
    const merged = carry + next[i];
    if (fresh > 0) {
      box = i;
      caret = Math.min(fresh, room);
      fresh -= caret;
    }
    next[i] = merged.slice(0, room);
    carry = merged.slice(room);
  }
  return { parts: next, box, caret };
}
