import test from 'node:test';
import assert from 'node:assert/strict';
import { legalBlocks } from './legalBlocks.js';

test('headings, bullets and paragraphs', () => {
  const blocks = legalBlocks('Intro line one\nline two\n\n## Who we are\n- one\n- two\nAfter list\n\n\n## End');
  assert.deepEqual(blocks, [
    { type: 'paragraph', text: 'Intro line one line two' },
    { type: 'heading', text: 'Who we are' },
    { type: 'list', items: ['one', 'two'] },
    { type: 'paragraph', text: 'After list' },
    { type: 'heading', text: 'End' },
  ]);
});

test('empty or missing text has no blocks; markup stays text', () => {
  assert.deepEqual(legalBlocks(''), []);
  assert.deepEqual(legalBlocks(null), []);
  assert.deepEqual(legalBlocks('<script>x</script>'), [{ type: 'paragraph', text: '<script>x</script>' }]);
});
