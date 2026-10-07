import test from 'node:test';
import assert from 'node:assert/strict';
import { EMAIL_MESSAGES, emailError, emailProblem, normalizeEmail } from './email.js';

// The same cases as the backend's tests/utils/email.test.js - the two copies must agree.
test('accepts ordinary and less common but valid addresses', () => {
  for (const value of ['john.doe@gmail.com', 'john+test@company.co.in', 'first_last-1@sub.example.org', "o'brien@example.ca", 'a@b.co', '  user@gmail.com  ']) {
    assert.equal(emailProblem(value), null, value);
  }
});

test('names the first problem with each invalid address', () => {
  const cases = {
    '': 'required',
    '   ': 'required',
    'john doe@gmail.com': 'spaces',
    'john@ gmail.com': 'spaces',
    'john.com': 'missingAt',
    'john@@gmail.com': 'extraAt',
    'john@gmail@com': 'extraAt',
    '@gmail.com': 'missingLocal',
    'john@': 'missingDomain',
    'john@gmail': 'badDomain',
    'john@.com': 'badDomain',
    'john@gmail..com': 'badDomain',
    'john..doe@gmail.com': 'invalid',
    [`${'a'.repeat(64)}@${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(58)}.com`]: 'tooLong',
  };
  for (const [value, problem] of Object.entries(cases)) {
    assert.equal(emailProblem(value), problem, JSON.stringify(value));
  }
});

test('messages say what to fix; normalization trims and lower-cases', () => {
  assert.equal(emailError('john@@gmail.com'), 'Email can only have one @.');
  assert.equal(emailError(''), EMAIL_MESSAGES.required);
  assert.equal(emailError('john.doe@gmail.com'), null);
  assert.equal(normalizeEmail('  John.Doe@GMAIL.COM '), 'john.doe@gmail.com');
});
