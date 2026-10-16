import test from 'node:test';
import assert from 'node:assert/strict';
import { addRow, durationText, moveRow, removeRow, rowProblems, toPayload, toRows, totalMinutes, updateRow, workloadFacts } from './stepsReview.js';

const suggestion = [
  { key: 'a', title: 'Read the brief', minutes: 10, dependsOn: [] },
  { key: 'b', title: 'Run the experiment', minutes: 30, dependsOn: ['a'] },
  { key: 'c', title: 'Write it up', minutes: 25, dependsOn: ['b'], checkpointId: 'cp1' },
];

test('rows keep keys, links and checkpoints; minutes become editable text', () => {
  const rows = toRows(suggestion);
  assert.deepEqual(rows[1], { key: 'b', title: 'Run the experiment', minutes: '30', dependsOn: ['a'], checkpointId: null });
  assert.equal(rows[2].checkpointId, 'cp1');
  assert.equal(totalMinutes(rows), 65);
});

test('removing a step drops links to it; moving sends only links to steps above', () => {
  let rows = removeRow(toRows(suggestion), 'b');
  assert.deepEqual(rows.map((r) => [r.key, r.dependsOn]), [['a', []], ['c', []]]);
  rows = moveRow(toRows(suggestion), 'a', 1); // b, a, c - b now depends on a step below it
  const { steps } = toPayload('p1', rows);
  assert.deepEqual(steps.map((s) => [s.key, s.dependsOn]), [['b', []], ['a', []], ['c', ['b']]]);
  assert.equal(moveRow(rows, 'b', -1), rows, 'the first step cannot go up');
});

test('added and edited steps: trimmed titles, blank minutes are null, problems named per row', () => {
  let rows = addRow(toRows(suggestion));
  const added = rows[3].key;
  assert.match(added, /^new-/);
  assert.deepEqual(rowProblems(rows), { [added]: { title: 'Give this step a name' } });
  rows = updateRow(rows, added, { title: '  Ask Sam  ', minutes: '0' });
  assert.deepEqual(rowProblems(rows), { [added]: { minutes: '1 to 240' } });
  rows = updateRow(rows, added, { minutes: '' });
  assert.deepEqual(rowProblems(rows), {});
  const { proposalId, steps } = toPayload('p1', rows);
  assert.equal(proposalId, 'p1');
  assert.deepEqual(steps[3], { key: added, title: 'Ask Sam', minutes: null, dependsOn: [], checkpointId: null });
});

test('workload in plain words, with kid wording', () => {
  const w = { daysUntilDue: 4, freeMinutes: 150, otherCount: 2, otherMinutes: 75, sessionMinutes: 40 };
  assert.deepEqual(workloadFacts(w), ['Due in 4 days', '2 h 30 min free before then', '2 other pieces of work due first · 1 h 15 min', 'Steps up to 40 min']);
  assert.deepEqual(workloadFacts({ ...w, daysUntilDue: 0, otherCount: 0 }, { kid: true }), ['Due today', '2 h 30 min free to work', 'Nothing else due first', 'Steps up to 40 min']);
  assert.equal(workloadFacts(null).length, 0);
  assert.equal(durationText(60), '1 h');
});
