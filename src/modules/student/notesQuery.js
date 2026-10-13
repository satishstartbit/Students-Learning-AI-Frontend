/**
 * The Notes page's filters - shared by the student's /student/notes and the
 * parent's /parent/notes (backend: GET /notes and GET /parent/children/:id/notes,
 * stickyNote.service#listNotes). A note's date is its reminder time, else
 * when it was written; "last 7 days" etc. are on the student's own calendar.
 *
 * The Home board and the parent Overview ask for `range: 'home'` (yesterday
 * onwards) - older notes live only on the Notes page.
 */

export const HOME_RANGE = 'home';

/** The When filter's choices; empty = all notes (the Select's placeholder). */
export const NOTE_RANGE_OPTIONS = [
  { value: 'upcoming', label: 'Upcoming reminders' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Last 7 days' },
  { value: 'month', label: 'Last 30 days' },
  { value: 'year', label: 'Last 12 months' },
  { value: 'custom', label: 'Pick dates' },
];

/** The Status filter's choices; empty = done and not done. */
export const NOTE_STATUS_OPTIONS = [
  { value: 'active', label: 'Not done' },
  { value: 'done', label: 'Done' },
];

export const DEFAULT_NOTE_FILTERS = Object.freeze({ range: '', from: '', to: '', status: '', search: '' });
export const ALL_NOTES_LABEL = 'All notes';
export const ANY_STATUS_LABEL = 'Done and not done';
export const NOTES_PAGE_SIZE = 20;

/** True when anything differs from the defaults (shows "Clear filters"). */
export const hasNoteFilters = (filters) =>
  Object.keys(DEFAULT_NOTE_FILTERS).some((key) => (filters?.[key] ?? '') !== DEFAULT_NOTE_FILTERS[key]);

/** "Pick dates" with the start after the end - said in the filter bar, not sent. */
export function noteFiltersProblem(filters) {
  if (filters?.range === 'custom' && filters.from && filters.to && filters.from > filters.to) {
    return 'The start date must be on or before the end date.';
  }
  return null;
}

/** The query string for one page of notes: only what's set, dates only for "Pick dates". */
export function notesQueryParams(filters = DEFAULT_NOTE_FILTERS, page = 1, limit = NOTES_PAGE_SIZE) {
  const params = { page, limit };
  if (filters.range) params.range = filters.range;
  if (filters.range === 'custom') {
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
  }
  if (filters.status) params.status = filters.status;
  const search = String(filters.search ?? '').trim();
  if (search) params.search = search;
  return params;
}

/** An API note in the shape the board, the list and NoteEditorModal read. */
export const toBoardNote = (n) => ({
  id: n.id,
  tone: n.tone,
  title: n.title,
  content: n.content,
  // NoteEditorModal reads `text`.
  text: n.content,
  status: n.status,
  done: n.status === 'done',
  remindAt: n.remindAt ?? null,
  remindedAt: n.remindedAt ?? null,
  createdAt: n.createdAt ?? null,
  assignment: n.assignment ?? null,
});

/** What a note's date is: `{ kind: 'reminder' | 'written', at }`. */
export const noteWhen = (note) =>
  note?.remindAt ? { kind: 'reminder', at: note.remindAt } : { kind: 'written', at: note?.createdAt ?? null };

/** An empty list's words, depending on whether filters are on. */
export const emptyNotesText = (filters, { name } = {}) =>
  hasNoteFilters(filters)
    ? 'No notes match these filters.'
    : name
      ? `${name} hasn't written any notes yet.`
      : "You haven't written any notes yet.";
