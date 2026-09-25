import assert from 'node:assert/strict';
import test from 'node:test';
import { checkPassword, clock, codeProblem, codeSentLine } from './passwordReset.js';

test('the checklist ticks each rule on its own', () => {
  const met = (value) => Object.fromEntries(checkPassword(value).map((r) => [r.key, r.met]));
  assert.deepEqual(met(''), { length: false, upper: false, lower: false, number: false });
  assert.deepEqual(met('Sunflower'), { length: true, upper: true, lower: true, number: false });
  assert.deepEqual(met('sunflower7'), { length: true, upper: false, lower: true, number: true });
  assert.deepEqual(met('Sun7'), { length: false, upper: true, lower: true, number: true });
  assert.deepEqual(met('Sunflower7'), { length: true, upper: true, lower: true, number: true });
  assert.deepEqual(met(null), { length: false, upper: false, lower: false, number: false });
});

test('the code line names the grown-up when the server shares the address', () => {
  assert.equal(
    codeSentLine({
      identifier: 'sanjay.k',
      destination: { emails: ['n•••n@yopmail.com'], toGuardian: true, accountFirstName: 'Sanjay' },
    }),
    "We sent a 6-digit code to n•••n@yopmail.com, the grown-up on Sanjay's account."
  );
  assert.equal(
    codeSentLine({
      identifier: 'sanjay.k',
      destination: { emails: ['n•••n@yopmail.com', 'r•••i@x.ca'], toGuardian: true, accountFirstName: 'Sanjay' },
    }),
    "We sent a 6-digit code to n•••n@yopmail.com and r•••i@x.ca, the grown-ups on Sanjay's account."
  );
  assert.equal(
    codeSentLine({ identifier: 'me@x.ca', destination: { emails: ['m•••e@x.ca'], toGuardian: false } }),
    'We sent a 6-digit code to m•••e@x.ca.'
  );
});

test('without an address the line does not claim the account exists', () => {
  const line = codeSentLine({ identifier: '  sanjay.k ' });
  assert.match(line, /^If there's an account for sanjay\.k, /);
  assert.match(line, /grown-up/);
  assert.match(codeSentLine({ identifier: '', destination: { emails: [] } }), /that name/);
});

test('clock and code errors', () => {
  assert.equal(clock(45_000), '0:45');
  assert.equal(clock(44_001), '0:45');
  assert.equal(clock(-5), '0:00');
  assert.equal(clock(125_000), '2:05');
  assert.deepEqual(codeProblem({ errors: [{ code: 'CODE_EXPIRED' }] }), { kind: 'expired' });
  assert.deepEqual(codeProblem({ errors: [{ code: 'INVALID_CODE' }] }), { kind: 'invalid' });
  assert.deepEqual(codeProblem({ message: 'Too many tries.' }), { kind: 'other', message: 'Too many tries.' });
});
