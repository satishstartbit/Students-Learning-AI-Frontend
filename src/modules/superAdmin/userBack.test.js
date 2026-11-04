import { test } from 'node:test';
import assert from 'node:assert/strict';
import { backTo, userBackTarget } from './userBack.js';

test('no state: back to the role list', () => {
  assert.deepEqual(userBackTarget(null, 'STUDENT'), { to: '/admin/users/students', label: 'Back to Students' });
  assert.deepEqual(userBackTarget(undefined, 'PARENT'), { to: '/admin/users/parents', label: 'Back to Parents' });
  assert.deepEqual(userBackTarget({}, 'TEACHER'), { to: '/admin/users/teachers', label: 'Back to Teachers' });
});

test('opened from another page: back to that page', () => {
  assert.deepEqual(userBackTarget(backTo('/admin/users/abc', 'Back to Jane Doe'), 'STUDENT'), {
    to: '/admin/users/abc',
    label: 'Back to Jane Doe',
  });
  assert.equal(userBackTarget(backTo('/admin/relationships'), 'TEACHER').label, 'Back');
});

test('only app addresses are followed', () => {
  assert.equal(userBackTarget(backTo('https://example.com/', 'x'), 'PARENT').to, '/admin/users/parents');
  assert.equal(userBackTarget({ backTo: 42 }, 'PARENT').to, '/admin/users/parents');
});
