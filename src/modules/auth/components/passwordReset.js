/**
 * Pure helpers for the "Forgot your password?" steps (ForgotPasswordPage,
 * ResetPasswordPage, PasswordResetSteps). No React here, so node:test can
 * cover them.
 */

/**
 * What a new password needs, as the live checklist under "New password".
 * The same rule as utils/validation#password and the API's password schema.
 */
export const PASSWORD_RULES = [
  { key: 'length', label: 'At least 8 characters', test: (v) => v.length >= 8 },
  { key: 'upper', label: 'An upper case letter', test: (v) => /[A-Z]/.test(v) },
  { key: 'lower', label: 'A lower case letter', test: (v) => /[a-z]/.test(v) },
  { key: 'number', label: 'A number', test: (v) => /[0-9]/.test(v) },
];

/** Each rule with `met` for this value. */
export const checkPassword = (value) =>
  PASSWORD_RULES.map(({ key, label, test }) => ({ key, label, met: test(String(value ?? '')) }));

/** "a, b and c" */
const joinAnd = (items) =>
  items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

/**
 * The line under "Enter your reset code".
 *
 * With `destination` (only when the server has PASSWORD_RESET_SHOW_DESTINATION
 * on) it names the masked address, as in the mockup: "We sent a 6-digit code
 * to n•••n@yopmail.com, the grown-up on Sanjay's account." Without it the
 * line can't say whether the account exists, so it says where a code goes.
 */
export function codeSentLine({ identifier, destination, codeLength = 6 }) {
  const emails = destination?.emails ?? [];
  if (emails.length) {
    const to = joinAnd(emails);
    if (!destination.toGuardian) return `We sent a ${codeLength}-digit code to ${to}.`;
    const who = emails.length > 1 ? 'the grown-ups' : 'the grown-up';
    const whose = destination.accountFirstName ? `${destination.accountFirstName}'s account` : 'the account';
    return `We sent a ${codeLength}-digit code to ${to}, ${who} on ${whose}.`;
  }
  const name = String(identifier ?? '').trim();
  return `If there's an account for ${name || 'that name'}, we sent a ${codeLength}-digit code to its email. A student's code goes to the grown-up on their account.`;
}

/** "0:45" */
export const clock = (ms) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

/** The API's code errors as a status for the code step. */
export function codeProblem(error) {
  const detail = (error?.errors ?? [])[0] ?? {};
  if (detail.code === 'CODE_EXPIRED') return { kind: 'expired' };
  if (detail.code === 'INVALID_CODE') return { kind: 'invalid' };
  return { kind: 'other', message: error?.message || 'Something went wrong. Please try again.' };
}
