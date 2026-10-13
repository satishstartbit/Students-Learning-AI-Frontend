import test from 'node:test';
import assert from 'node:assert/strict';
import { milestoneHeadings } from './milestoneHeadings.js';

const s = (id, title) => ({ id, milestone: title ? { title } : null });

test('a heading before each new stage', () => {
  const h = milestoneHeadings([s('1', 'Research'), s('2', 'Research'), s('3', 'Make it'), s('4', null), s('5', 'Review')]);
  assert.deepEqual([...h.entries()], [
    ['1', 'Research'],
    ['3', 'Make it'],
    ['5', 'Review'],
  ]);
});

test('one stage or none: no headings', () => {
  assert.equal(milestoneHeadings([s('1', 'Research'), s('2', 'Research')]).size, 0);
  assert.equal(milestoneHeadings([s('1'), s('2')]).size, 0);
});
