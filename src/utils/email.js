/**
 * Email address rules for every email field. The backend applies the same
 * rules (utils/email.js there, via validators/common.js#email), so a form
 * never accepts what the API refuses - keep the two in sync.
 *
 * In order: trim, required, no spaces inside, at most 254 characters, exactly
 * one @, something before it, a real-looking domain after it (at least two
 * labels, e.g. example.com, each label letters/digits/hyphens, a top-level
 * domain of 2+ letters). Deliberately not strict beyond that: + . _ - and the
 * other characters RFC 5322 allows before the @ are fine, and any domain
 * works (not only Gmail or Outlook). Stored lower case.
 */
export const EMAIL_MAX_LENGTH = 254;
const LOCAL_PART_MAX_LENGTH = 64;

export const EMAIL_MESSAGES = {
  required: 'Email is required.',
  spaces: "Email can't contain spaces.",
  tooLong: `Email must be ${EMAIL_MAX_LENGTH} characters or fewer.`,
  missingAt: 'Email needs an @, e.g. name@example.com.',
  extraAt: 'Email can only have one @.',
  missingLocal: 'Add the part before the @, e.g. name@example.com.',
  missingDomain: 'Add the domain after the @, e.g. example.com.',
  badDomain: 'Check the part after the @. It should look like example.com.',
  invalid: 'Enter a valid email address, e.g. name@example.com.',
  taken: 'This email is already registered.',
};

// Before the @: RFC 5322 "dot-atom" - letters, digits and ! # $ % & ' * + / = ? ^ _ ` { | } ~ -, single dots between.
const LOCAL_PART = /^[\p{L}\p{N}!#$%&'*+/=?^_`{|}~-]+(?:\.[\p{L}\p{N}!#$%&'*+/=?^_`{|}~-]+)*$/u;
// One domain label: letters/digits, hyphens inside only, at most 63 characters.
const DOMAIN_LABEL = /^[\p{L}\p{N}](?:[\p{L}\p{N}-]{0,61}[\p{L}\p{N}])?$/u;
const TOP_LEVEL_DOMAIN = /^(?:\p{L}{2,63}|xn--[a-z0-9-]{1,59})$/iu;

/** " John.Doe@GMAIL.COM " -> "john.doe@gmail.com". */
export const normalizeEmail = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : value);

/** The first rule the address breaks (a key of EMAIL_MESSAGES), or null when it is valid. */
export function emailProblem(value) {
  const email = String(value ?? '').trim();
  if (!email) return 'required';
  if (/\s/.test(email)) return 'spaces';
  if (email.length > EMAIL_MAX_LENGTH) return 'tooLong';

  const parts = email.split('@');
  if (parts.length === 1) return 'missingAt';
  if (parts.length > 2) return 'extraAt';

  const [local, domain] = parts;
  if (!local) return 'missingLocal';
  if (!domain) return 'missingDomain';
  if (local.length > LOCAL_PART_MAX_LENGTH || !LOCAL_PART.test(local)) return 'invalid';

  const labels = domain.split('.');
  const domainOk = labels.length >= 2 && labels.every((label) => DOMAIN_LABEL.test(label)) && TOP_LEVEL_DOMAIN.test(labels.at(-1));
  return domainOk ? null : 'badDomain';
}

export const isValidEmail = (value) => emailProblem(value) === null;

/** The message for the first problem, or null when the address is valid. */
export const emailError = (value) => {
  const problem = emailProblem(value);
  return problem ? EMAIL_MESSAGES[problem] : null;
};

export default { EMAIL_MAX_LENGTH, EMAIL_MESSAGES, normalizeEmail, emailProblem, isValidEmail, emailError };
