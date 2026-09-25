import assert from 'node:assert/strict';
import test from 'node:test';
import { flattenNav, PROFILE_PATH_BY_ROLE } from './navConfig.js';

const Icon = () => null;

test('grouped sections and collapsible parents flatten to links, in order', () => {
  const nav = [
    { group: 'Teaching', items: [{ to: '/teacher', label: 'Dashboard', icon: Icon, end: true }, { to: '/teacher/students', label: 'Students' }] },
    { group: null, placement: 'bottom', items: [{ label: 'Setup', items: [{ to: '/a', label: 'A' }, { to: '/b', label: 'B' }] }] },
    { label: 'No link and no children' },
  ];
  assert.deepEqual(
    flattenNav(nav).map((i) => i.to),
    ['/teacher', '/teacher/students', '/a', '/b']
  );
  assert.equal(flattenNav(nav)[0].end, true);
});

test('what the phone "More" sheet lists: every page that is not a tab', () => {
  const nav = [{ group: null, items: ['/s', '/s/plan', '/s/work', '/s/focus', '/s/boost', '/s/rewards'].map((to) => ({ to, label: to })) }];
  const tabs = new Set(['/s', '/s/plan', '/s/work', '/s/focus', '/s/rewards']);
  assert.deepEqual(flattenNav(nav).filter((i) => !tabs.has(i.to)).map((i) => i.to), ['/s/boost']);
  assert.deepEqual(flattenNav(), []);
});

test('every signed-in role has an account page', () => {
  assert.equal(PROFILE_PATH_BY_ROLE.TEACHER, '/teacher/profile');
  assert.equal(PROFILE_PATH_BY_ROLE.PARENT, '/parent/profile');
  assert.equal(PROFILE_PATH_BY_ROLE.STUDENT, '/student/settings');
  assert.equal(PROFILE_PATH_BY_ROLE.SUPER_ADMIN, '/admin/profile');
});
