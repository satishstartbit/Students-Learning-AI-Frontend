import test from 'node:test';
import assert from 'node:assert/strict';
import { isPageLoadError } from './pageLoadError.js';

test('a page whose code did not download is told apart from a crash', () => {
  for (const message of [
    'Failed to fetch dynamically imported module: http://localhost:5199/assets/LoginPage-D45lFoQs.js',
    'error loading dynamically imported module: https://app.example.com/assets/x.js',
    'Importing a module script failed.',
    'Unable to preload CSS for /assets/LoginPage.css',
    'Loading chunk 42 failed.',
  ]) {
    assert.equal(isPageLoadError(new TypeError(message)), true, message);
  }
  assert.equal(isPageLoadError(Object.assign(new Error('x'), { name: 'ChunkLoadError' })), true);
  assert.equal(isPageLoadError(new TypeError("Cannot read properties of undefined (reading 'map')")), false);
  assert.equal(isPageLoadError(null), false);
});
