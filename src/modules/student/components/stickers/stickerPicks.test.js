import test from 'node:test';
import assert from 'node:assert/strict';
import { placedIds, toggleSticker } from './stickerPicks.js';

test('placed ids from objects or plain ids', () => {
  assert.deepEqual(placedIds({ dashboardStickers: [{ id: 'a' }, 'b'] }), ['a', 'b']);
  assert.deepEqual(placedIds(null), []);
});

test('toggle on, off, and refuse past the limit', () => {
  assert.deepEqual(toggleSticker(['a'], 'b', 2), { ids: ['a', 'b'], full: false });
  assert.deepEqual(toggleSticker(['a', 'b'], 'a', 2), { ids: ['b'], full: false });
  assert.deepEqual(toggleSticker(['a', 'b'], 'c', 2), { ids: ['a', 'b'], full: true });
});
