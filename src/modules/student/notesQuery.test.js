import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_NOTE_FILTERS,
  emptyNotesText,
  hasNoteFilters,
  noteFiltersProblem,
  noteWhen,
  notesQueryParams,
} from './notesQuery.js';

test('query: only what is set; dates only for "Pick dates"', () => {
  assert.deepEqual(notesQueryParams(DEFAULT_NOTE_FILTERS), { page: 1, limit: 20 });
  assert.deepEqual(notesQueryParams({ ...DEFAULT_NOTE_FILTERS, range: 'week', status: 'done', search: '  lab ' }, 2), {
    page: 2,
    limit: 20,
    range: 'week',
    status: 'done',
    search: 'lab',
  });
  // Leftover dates from an earlier "Pick dates" aren't sent with another range.
  assert.deepEqual(notesQueryParams({ ...DEFAULT_NOTE_FILTERS, range: 'month', from: '2026-10-01', to: '2026-10-05' }), { page: 1, limit: 20, range: 'month' });
  assert.deepEqual(notesQueryParams({ ...DEFAULT_NOTE_FILTERS, range: 'custom', from: '2026-10-01' }), { page: 1, limit: 20, range: 'custom', from: '2026-10-01' });
});

test('filters on or off, and a backwards date range', () => {
  assert.equal(hasNoteFilters(DEFAULT_NOTE_FILTERS), false);
  assert.equal(hasNoteFilters({ ...DEFAULT_NOTE_FILTERS, status: 'done' }), true);
  assert.equal(hasNoteFilters({ ...DEFAULT_NOTE_FILTERS, search: '' }), false);
  assert.equal(noteFiltersProblem({ range: 'custom', from: '2026-10-05', to: '2026-10-01' }), 'The start date must be on or before the end date.');
  assert.equal(noteFiltersProblem({ range: 'custom', from: '2026-10-01', to: '2026-10-05' }), null);
});

test("a note's date is its reminder, else when it was written", () => {
  assert.deepEqual(noteWhen({ remindAt: '2026-10-09T13:00:00Z', createdAt: '2026-10-01T10:00:00Z' }), { kind: 'reminder', at: '2026-10-09T13:00:00Z' });
  assert.deepEqual(noteWhen({ remindAt: null, createdAt: '2026-10-01T10:00:00Z' }), { kind: 'written', at: '2026-10-01T10:00:00Z' });
});

test('empty words', () => {
  assert.equal(emptyNotesText(DEFAULT_NOTE_FILTERS), "You haven't written any notes yet.");
  assert.equal(emptyNotesText(DEFAULT_NOTE_FILTERS, { name: 'Sam' }), "Sam hasn't written any notes yet.");
  assert.equal(emptyNotesText({ ...DEFAULT_NOTE_FILTERS, range: 'today' }), 'No notes match these filters.');
});
