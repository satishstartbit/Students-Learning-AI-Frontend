import test from 'node:test';
import assert from 'node:assert/strict';
import { isRequiredField, requiredFields, requiredMessage, withRequiredFields } from './profileRequirements.js';

const run = (rules, value) => rules.map((rule) => rule(value)).find(Boolean) ?? null;

test('the same required lists as the backend', () => {
  assert.deepEqual(requiredFields('STUDENT'), ['lastName', 'grade', 'date_of_birth', 'gender', 'subjects']);
  assert.deepEqual(requiredFields('TEACHER'), ['lastName', 'phone', 'subjects', 'gradeLevels', 'yearsExperience']);
  assert.deepEqual(requiredFields('PARENT'), ['lastName', 'phone']);
  assert.deepEqual(requiredFields('SUPER_ADMIN'), []);
  assert.equal(isRequiredField('PARENT', 'phone'), true);
  assert.equal(isRequiredField('STUDENT', 'phone'), false);
  assert.equal(requiredMessage('TEACHER', 'subjects'), 'Choose at least one subject you teach');
  assert.equal(requiredMessage('STUDENT', 'subjects'), 'Choose at least one subject');
});

test("required comes first, then the form's own rules", () => {
  const schema = withRequiredFields('PARENT', { phone: [(v) => (v === 'bad' ? 'Enter a valid phone number' : null)], firstName: [() => null] });
  assert.equal(run(schema.phone, ''), 'Enter a phone number');
  assert.equal(run(schema.phone, 'bad'), 'Enter a valid phone number');
  assert.equal(run(schema.phone, '+1 (416) 555-1234'), null);
  assert.equal(run(schema.lastName, '   '), 'Enter a last name');
  assert.ok(schema.firstName);
});

test('empty lists fail, zero years passes, and `fields` limits what is added', () => {
  const teacher = withRequiredFields('TEACHER');
  assert.equal(run(teacher.subjects, []), 'Choose at least one subject you teach');
  assert.equal(run(teacher.gradeLevels, ['']), 'Choose at least one grade you teach');
  assert.equal(run(teacher.yearsExperience, 0), null);
  assert.deepEqual(Object.keys(withRequiredFields('TEACHER', {}, { fields: ['lastName'] })), ['lastName']);
});
