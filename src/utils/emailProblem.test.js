import test from 'node:test';
import assert from 'node:assert/strict';
import { emailProblemLabel, emailProblemText } from './emailProblem.js';

test('every backend email problem code has its own sentence and label', () => {
  for (const code of ['not_configured', 'unreachable', 'auth_failed', 'rejected', 'no_address', 'unknown']) {
    assert.ok(emailProblemText(code).length > 20, code);
    assert.ok(emailProblemLabel(code), code);
  }
  assert.match(emailProblemText('unreachable'), /brevo/i, 'points at the fix for hosts that block SMTP');
  assert.match(emailProblemText('not_configured'), /EMAIL_PROVIDER/);
});

test('an unknown or missing code falls back to the generic sentence', () => {
  assert.equal(emailProblemText('something_new'), emailProblemText('unknown'));
  assert.equal(emailProblemText(undefined), emailProblemText('unknown'));
  assert.equal(emailProblemLabel(null), 'Failed');
});
