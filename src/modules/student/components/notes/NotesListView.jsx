import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LuAlarmClock, LuCheck, LuFilterX, LuPencil, LuTrash2 } from 'react-icons/lu';
import { Badge, Button, DatePicker, EmptyState, ErrorState, FilterBar, IconButton, Loader, Pagination, SearchInput, Select } from '../../../../components/common';
import { useApi } from '../../../../hooks/useApi';
import { useDebounce } from '../../../../hooks/useDebounce';
import { formatNearDateTime } from '../../../../utils/date';
import {
  ALL_NOTES_LABEL,
  ANY_STATUS_LABEL,
  DEFAULT_NOTE_FILTERS,
  NOTE_RANGE_OPTIONS,
  NOTE_STATUS_OPTIONS,
  emptyNotesText,
  hasNoteFilters,
  noteFiltersProblem,
  noteWhen,
  notesQueryParams,
  toBoardNote,
} from '../../notesQuery';
import './notesList.css';

/** One note as a card on its own paper colour. */
function NoteCard({ note, readOnly, assignmentPath, onEdit, onMarkDone, onDelete }) {
  const when = noteWhen(note);
  const at = when.at ? formatNearDateTime(when.at) : '';
  const linkTo = note.assignment ? assignmentPath?.(note) : null;

  return (
    <li className="nl-card" data-tone={note.tone || 'yellow'} data-done={note.done || undefined}>
      <div className="nl-card__top">
        {note.title ? <h3 className="nl-card__title">{note.title}</h3> : <span />}
        {note.done && (
          <Badge variant="success" className="nl-card__done">
            <LuCheck size={12} aria-hidden="true" /> Done
          </Badge>
        )}
      </div>
      <p className="nl-card__text">{note.content}</p>
      <p className="nl-card__meta">
        {when.kind === 'reminder' ? (
          <span className="nl-card__when">
            <LuAlarmClock size={13} aria-hidden="true" /> Reminder {at}
          </span>
        ) : (
          <span className="nl-card__when">Written {at}</span>
        )}
        {note.assignment && (
          <span className="nl-card__on">
            On{' '}
            {linkTo ? <Link to={linkTo}>{note.assignment.title}</Link> : <strong>{note.assignment.title}</strong>}
          </span>
        )}
      </p>
      {!readOnly && (
        <div className="nl-card__actions">
          {/* Done is final: a done note has no Mark done (and nothing to undo it). */}
          {!note.done && (
            <Button type="button" size="sm" variant="secondary" startIcon={<LuCheck />} onClick={() => onMarkDone(note)}>
              Mark done
            </Button>
          )}
          <span className="nl-card__tools">
            <IconButton icon={<LuPencil aria-hidden="true" />} label={`Edit "${note.title || note.content}"`} size="sm" variant="ghost" onClick={() => onEdit(note)} />
            <IconButton icon={<LuTrash2 aria-hidden="true" />} label={`Delete "${note.title || note.content}"`} size="sm" variant="ghost" onClick={() => onDelete(note)} />
          </span>
        </div>
      )}
    </li>
  );
}

/**
 * Every note, filtered and paged - the body of the student's Notes page and
 * the parent's. `load(params)` fetches one page (GET /notes or
 * GET /parent/children/:id/notes); `readOnly` (parents) hides Edit, Mark done
 * and Delete. `reloadToken` changes to fetch again after an edit elsewhere.
 * Filters: search, When (all / upcoming / today / last 7, 30, 365 days /
 * pick dates) and Status.
 */
export function NotesListView({ load, readOnly = false, ownerName, assignmentPath, onEdit, onMarkDone, onDelete, reloadToken = 0 }) {
  const [filters, setFilters] = useState(DEFAULT_NOTE_FILTERS);
  const [page, setPage] = useState(1);
  const search = useDebounce(filters.search, 350);
  const { data, meta, error, isLoading, run } = useApi(load);

  const problem = noteFiltersProblem(filters);
  const { range, from, to, status } = filters;

  useEffect(() => {
    if (problem) return;
    run(notesQueryParams({ range, from, to, status, search }, page)).catch(() => {});
  }, [run, range, from, to, status, search, page, problem, reloadToken]);

  const change = (key) => (event) => {
    const value = event?.target ? event.target.value : event;
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };
  const clear = () => {
    setFilters(DEFAULT_NOTE_FILTERS);
    setPage(1);
  };
  const reload = () => run(notesQueryParams({ range, from, to, status, search }, page)).catch(() => {});

  const notes = (data ?? []).map(toBoardNote);
  const filtered = hasNoteFilters(filters);

  let body;
  if (error && !data) body = <ErrorState error={error} onRetry={reload} />;
  else if (!data && isLoading) body = <Loader message="Loading notes…" />;
  else if (!notes.length)
    body = <EmptyState icon="🗒️" title={filtered ? 'No notes found' : 'No notes yet'} description={emptyNotesText(filters, { name: ownerName })} />;
  else
    body = (
      <ul className="nl-grid" aria-busy={isLoading || undefined}>
        {notes.map((note) => (
          <NoteCard key={note.id} note={note} readOnly={readOnly} assignmentPath={assignmentPath} onEdit={onEdit} onMarkDone={onMarkDone} onDelete={onDelete} />
        ))}
      </ul>
    );

  return (
    <div className="nl-view">
      <FilterBar className="nl-filters">
        <SearchInput
          fieldClassName="ui-filterbar__search ui-field--compact"
          placeholder="Search notes"
          aria-label="Search notes"
          value={filters.search}
          onChange={change('search')}
          onClear={() => change('search')('')}
        />
        <Select
          fieldClassName="ui-field--compact"
          label="When"
          name="range"
          options={NOTE_RANGE_OPTIONS}
          placeholder={ALL_NOTES_LABEL}
          value={filters.range}
          onChange={change('range')}
        />
        {filters.range === 'custom' && (
          <>
            <DatePicker fieldClassName="ui-field--compact" label="From" name="from" value={filters.from} max={filters.to || undefined} onChange={change('from')} reserveHelper={false} />
            <DatePicker fieldClassName="ui-field--compact" label="To" name="to" value={filters.to} min={filters.from || undefined} onChange={change('to')} reserveHelper={false} />
          </>
        )}
        <Select
          fieldClassName="ui-field--compact"
          label="Status"
          name="status"
          options={NOTE_STATUS_OPTIONS}
          placeholder={ANY_STATUS_LABEL}
          value={filters.status}
          onChange={change('status')}
        />
        <IconButton icon={<LuFilterX aria-hidden="true" />} label="Clear filters" size="sm" onClick={clear} disabled={!filtered} />
      </FilterBar>
      {problem && (
        <p className="nl-problem" role="alert">
          {problem}
        </p>
      )}

      {body}

      {meta?.totalPages > 1 && (
        <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onPageChange={setPage} />
      )}
    </div>
  );
}

export default NotesListView;
