import test from 'node:test';
import assert from 'node:assert/strict';
import { formatSorts, parseSorts, sectionKey, sortFor, sortRows } from './masterDashboardState.js';

test('each section keeps its own sort, in the address', () => {
  const sorts = parseSorts('academic:totalRecords:desc,curriculum-task-setup:label:desc,bad:nope:asc,x');
  assert.deepEqual(sorts, { academic: { by: 'totalRecords', order: 'desc' }, 'curriculum-task-setup': { by: 'label', order: 'desc' } });
  assert.deepEqual(sortFor(sorts, 'Curriculum & Task Setup'), { by: 'label', order: 'desc' });
  assert.deepEqual(sortFor(sorts, 'Subscriptions'), { by: 'label', order: 'asc' }, 'others: by name, A-Z');
  assert.equal(formatSorts({ ...sorts, subscriptions: { by: 'label', order: 'asc' } }), 'academic:totalRecords:desc,curriculum-task-setup:label:desc');
  assert.equal(formatSorts({}), '');
  assert.equal(sectionKey('Check-In'), 'check-in');
});

test('rows: numbers as numbers, names as text', () => {
  const rows = [{ label: 'Topics', totalRecords: 21 }, { label: 'Background Audio', totalRecords: 3 }, { label: 'Task Types', totalRecords: 29 }];
  assert.deepEqual(sortRows(rows, { by: 'totalRecords', order: 'desc' }).map((r) => r.totalRecords), [29, 21, 3]);
  assert.deepEqual(sortRows(rows, { by: 'label', order: 'asc' }).map((r) => r.label), ['Background Audio', 'Task Types', 'Topics']);
});
