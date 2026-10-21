import assert from 'node:assert/strict';
import test from 'node:test';
import { accountMenuPosition, activeMenuLabel, flattenNav, PROFILE_PATH_BY_ROLE } from './navConfig.js';

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

test('the account menu: above the tile when expanded, beside the rail when collapsed', () => {
  const view = { viewportWidth: 1366, viewportHeight: 900 };
  // Expanded: tile at x 8-248, y 840-888 → menu's bottom 8px above the tile.
  assert.deepEqual(accountMenuPosition({ left: 8, right: 248, top: 840, bottom: 888 }, { ...view, collapsed: false }), { left: 8, bottom: 68, collapsed: false });
  // Collapsed rail (3rem): tile at x 8-40 → menu starts 8px right of it, bottoms aligned.
  assert.deepEqual(accountMenuPosition({ left: 8, right: 40, top: 856, bottom: 888 }, { ...view, collapsed: true }), { left: 48, bottom: 12, collapsed: true });
  // The rail's own edge (52) is past the tile (40): the menu clears the rail.
  assert.equal(accountMenuPosition({ left: 8, right: 40, top: 856, bottom: 888 }, { ...view, collapsed: true, railRight: 52 }).left, 60);
  // Never past the right edge of a narrow window.
  assert.equal(accountMenuPosition({ left: 300, right: 340, top: 0, bottom: 40 }, { viewportWidth: 360, viewportHeight: 800, collapsed: true }).left, 112);
});

test('the menu that opens on arrival is the one holding the current page', () => {
  const sections = [
    {
      group: 'Platform',
      items: [
        { to: '/admin', label: 'Dashboard', end: true },
        { label: 'Users', items: [{ to: '/admin/users/students', label: 'Students' }, { to: '/admin/users/parents', label: 'Parents' }] },
        { label: 'Billing', items: [{ to: '/admin/subscriptions', label: 'Subscriptions', end: true }, { to: '/admin/subscriptions/revenue', label: 'Revenue' }] },
      ],
    },
  ];
  const at = (pathname) => (to, end) => (end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`));

  assert.equal(activeMenuLabel(sections, at('/admin/users/parents')), 'Users');
  assert.equal(activeMenuLabel(sections, at('/admin/users/parents/42/edit')), 'Users');
  assert.equal(activeMenuLabel(sections, at('/admin/subscriptions/revenue')), 'Billing');
  // A page that is a plain link (or no link at all) belongs to no menu.
  assert.equal(activeMenuLabel(sections, at('/admin')), null);
  assert.equal(activeMenuLabel(sections, at('/admin/masters')), null);
  assert.equal(activeMenuLabel([], at('/admin')), null);
});

test('every signed-in role has an account page', () => {
  assert.equal(PROFILE_PATH_BY_ROLE.TEACHER, '/teacher/profile');
  assert.equal(PROFILE_PATH_BY_ROLE.PARENT, '/parent/profile');
  assert.equal(PROFILE_PATH_BY_ROLE.STUDENT, '/student/settings');
  assert.equal(PROFILE_PATH_BY_ROLE.SUPER_ADMIN, '/admin/profile');
});
