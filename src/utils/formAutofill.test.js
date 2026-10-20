import test from 'node:test';
import assert from 'node:assert/strict';
import { browserFilledValues } from './formAutofill.js';

const formWith = (fields) => ({
  elements: { namedItem: (name) => fields[name] ?? null },
});
const input = (type, value) => ({ tagName: 'INPUT', type, value });

test('a sign-in the browser autofilled: its values are read from the fields', () => {
  const form = formWith({ identifier: input('text', 'sam.parent@example.com'), password: input('password', 'Secret123') });
  assert.deepEqual(browserFilledValues(form, { identifier: '', password: '' }), { identifier: 'sam.parent@example.com', password: 'Secret123' });
  // Submitted with a button inside the form.
  assert.deepEqual(browserFilledValues({ form }, { identifier: '', password: '' }), { identifier: 'sam.parent@example.com', password: 'Secret123' });
});

test('what the form already knows wins; only text-like fields; nothing found = null', () => {
  const form = formWith({
    identifier: input('text', 'typed-by-browser'),
    phone: input('hidden', '+14165551234'),
    agree: input('checkbox', 'on'),
    notes: { tagName: 'TEXTAREA', value: 'filled' },
    role: { tagName: 'SELECT', value: 'PARENT' },
  });
  assert.deepEqual(browserFilledValues(form, { identifier: 'typed', phone: '', agree: false, notes: '', role: '' }), { notes: 'filled' });
  assert.equal(browserFilledValues(formWith({ identifier: input('text', '') }), { identifier: '' }), null);
  assert.equal(browserFilledValues(null, { identifier: '' }), null);
  assert.equal(browserFilledValues({ form: null }, { identifier: '' }), null);
});
