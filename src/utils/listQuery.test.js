import test from 'node:test';
import assert from 'node:assert/strict';
import { followAddress, intParam, listAddress, pageNumbers, patchQuery, readQuery, rememberListSearch } from './listQuery.js';

const defaults = { search: '', status: '', page: '1', limit: '10' };

test('reading: missing keys take their default', () => {
  assert.deepEqual(readQuery(new URLSearchParams('status=active&page=2'), defaults), { search: '', status: 'active', page: '2', limit: '10' });
});

test('patching: defaults and blanks leave the address; other keys stay', () => {
  const next = patchQuery(new URLSearchParams('status=active&page=3&tab=x'), { status: '', page: 1, limit: 20 }, defaults);
  assert.equal(next.toString(), 'tab=x&limit=20');
  assert.equal(patchQuery(new URLSearchParams(), { search: 'sam' }, defaults).toString(), 'search=sam');
});

test('numbers from the address are whole and clamped', () => {
  assert.equal(intParam('3', 1), 3);
  assert.equal(intParam('abc', 1), 1);
  assert.equal(intParam('0', 1), 1);
  assert.equal(intParam('500', 10, { max: 100 }), 100);
});

test('the pagination bar numbers', () => {
  assert.deepEqual(pageNumbers({ page: 1, limit: 10, total: 6 }), { totalPages: 1, hasPrevious: false, hasNext: false, from: 1, to: 6 });
  assert.deepEqual(pageNumbers({ page: 2, limit: 10, total: 23 }), { totalPages: 3, hasPrevious: true, hasNext: true, from: 11, to: 20 });
  assert.deepEqual(pageNumbers({ page: 1, limit: 10, total: 0 }).from, 0);
});

test('a search box ignores its own typing coming back late, but follows other changes', () => {
  // Typed "S", "St", "Stu" quickly; the address catches up one value at a time.
  let box = { text: 'Stu', seen: '', pending: ['S', 'St', 'Stu'] };
  box = followAddress(box, 'S');
  assert.deepEqual(box, { text: 'Stu', seen: 'S', pending: ['St', 'Stu'] });
  // React may skip straight to the last value.
  box = followAddress(box, 'Stu');
  assert.deepEqual(box, { text: 'Stu', seen: 'Stu', pending: [] });
  assert.equal(followAddress(box, 'Stu'), box);
  // Clear filters / a link to the plain list: the box shows it.
  assert.deepEqual(followAddress(box, ''), { text: '', seen: '', pending: [] });
});

test('Back returns to the list as it was left', () => {
  const store = new Map();
  const storage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) };
  rememberListSearch('/admin/masters', '?q=grade&area=Academic', storage);
  assert.equal(listAddress('/admin/masters', storage), '/admin/masters?q=grade&area=Academic');
  assert.equal(listAddress('/admin/masters/schools', storage), '/admin/masters/schools');
  rememberListSearch('/admin/masters', '', storage);
  assert.equal(listAddress('/admin/masters', storage), '/admin/masters');
  assert.equal(listAddress('/x', { getItem: () => { throw new Error('blocked'); } }), '/x');
});
