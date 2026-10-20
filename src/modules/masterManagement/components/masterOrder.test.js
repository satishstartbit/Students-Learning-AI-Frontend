import test from 'node:test';
import assert from 'node:assert/strict';
import { orderPayload } from './masterOrder.js';

test('a blank Order is not sent; a number is sent whole', () => {
  assert.equal(orderPayload(''), undefined);
  assert.equal(orderPayload(null), undefined);
  assert.equal(orderPayload(undefined), undefined);
  assert.equal(orderPayload('3'), 3);
  assert.equal(orderPayload(0), 0);
  assert.equal(orderPayload('4.7'), 4);
  assert.equal(orderPayload('abc'), undefined);
});
