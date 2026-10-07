import { validateFile, validateImage } from './file';
import { isValidDate, toDate } from './date';
import { isValidPhoneNumber, PHONE_EXAMPLE } from './phone';
import { isValidCanadianPostalCode } from './postalCode';

/**
 * Form validation primitives plus a small rule runner used by useForm.
 *
 * Each validator returns an error string or null, so rules compose:
 *   { email: [required(), email()], password: [required(), password()] }
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const isEmpty = (value) =>
  value === null ||
  value === undefined ||
  (typeof value === 'string' && value.trim() === '') ||
  (Array.isArray(value) && value.length === 0);

// --- Rule factories --------------------------------------------------------

export const required =
  (message = 'This field is required') =>
  (value) =>
    isEmpty(value) ? message : null;

export const email =
  (message = 'Enter a valid email address') =>
  (value) =>
    isEmpty(value) || EMAIL_RE.test(String(value).trim()) ? null : message;

export const minLength = (n, message) => (value) =>
  isEmpty(value) || String(value).length >= n
    ? null
    : message || `Must be at least ${n} characters`;

export const maxLength = (n, message) => (value) =>
  isEmpty(value) || String(value).length <= n ? null : message || `Must be ${n} characters or fewer`;

export const min = (n, message) => (value) =>
  isEmpty(value) || Number(value) >= n ? null : message || `Must be ${n} or more`;

export const max = (n, message) => (value) =>
  isEmpty(value) || Number(value) <= n ? null : message || `Must be ${n} or less`;

export const pattern = (regex, message = 'Invalid format') => (value) =>
  isEmpty(value) || regex.test(String(value)) ? null : message;

/** Mirrors the backend rule: 8+ chars with lower, upper and a digit. */
export const password =
  (message = 'Password needs 8+ characters with upper case, lower case and a number') =>
  (value) => {
    if (isEmpty(value)) return null;
    const v = String(value);
    const ok = v.length >= 8 && /[a-z]/.test(v) && /[A-Z]/.test(v) && /[0-9]/.test(v);
    return ok ? null : message;
  };

export const matches =
  (otherField, message = 'Values do not match') =>
  (value, allValues = {}) =>
    isEmpty(value) || value === allValues[otherField] ? null : message;

export const date =
  (message = 'Enter a valid date') =>
  (value) =>
    isEmpty(value) || isValidDate(value) ? null : message;

export const futureDate =
  (message = 'Date must be in the future') =>
  (value) => {
    if (isEmpty(value)) return null;
    const d = toDate(value);
    return d && d.getTime() > Date.now() ? null : message;
  };

export const file = (options) => (value) => {
  if (isEmpty(value)) return null;
  const result = validateFile(value, options);
  return result.valid ? null : result.error;
};

export const image = (options) => (value) => {
  if (isEmpty(value)) return null;
  const result = validateImage(value, options);
  return result.valid ? null : result.error;
};

export const oneOf = (allowed, message) => (value) =>
  isEmpty(value) || allowed.includes(value) ? null : message || 'Select a valid option';

/** Accepts +1 (416) 555-1234, (416) 555-1234, 416-555-1234, 4165551234, +1 416 555 1234, ... */
export const phone =
  (message = `Enter a valid phone number, e.g. ${PHONE_EXAMPLE}`) =>
  (value) =>
    isEmpty(value) || isValidPhoneNumber(value) ? null : message;

/** e.g. K1A 0B1 - with or without the space, any case. */
export const postalCode =
  (message = 'Enter a valid postal code, e.g. K1A 0B1') =>
  (value) =>
    isEmpty(value) || isValidCanadianPostalCode(value) ? null : message;

// --- Runner ----------------------------------------------------------------

/** Applies one field's rules and returns the first error, or null. */
export function validateField(value, rules = [], allValues = {}) {
  for (const rule of [rules].flat().filter(Boolean)) {
    const error = rule(value, allValues);
    if (error) return error;
  }
  return null;
}

/**
 * Validates a whole form.
 * @returns {{ isValid: boolean, errors: Record<string,string> }}
 */
export function validateForm(values = {}, schema = {}) {
  const errors = {};

  for (const [field, rules] of Object.entries(schema)) {
    const error = validateField(values[field], rules, values);
    if (error) errors[field] = error;
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

export default {
  isEmpty,
  required,
  email,
  password,
  minLength,
  maxLength,
  min,
  max,
  pattern,
  matches,
  date,
  futureDate,
  file,
  image,
  oneOf,
  phone,
  postalCode,
  validateField,
  validateForm,
};
