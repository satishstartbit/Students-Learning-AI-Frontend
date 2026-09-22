import { useCallback, useEffect, useMemo, useState } from 'react';
import { LuSearch } from 'react-icons/lu';
import { Checkbox, Input } from '../../../../components/common';
import { useApi } from '../../../../hooks/useApi';
import { useDebounce } from '../../../../hooks/useDebounce';
import { formatName } from '../../../../utils/format';
import teacherStudentService from '../../services/teacherStudent.service';

const LIMIT = 100;

/**
 * Picks who gets the assignment, inline (no dropdown): a search box, a
 * "Select all N students in Grade 3 Math" box and a checklist of the
 * teacher's own active students in that grade + subject (+ academic year).
 * Same server-side scoping as the old StudentPicker - the API refuses
 * anyone outside it anyway.
 *
 * lockedIds: students who have already started - they can't be removed
 * (the API refuses it), so their boxes stay ticked and disabled.
 */
export default function RosterPicker({ subject, grade, academicYearId, value = [], onChange, lockedIds = [], disabled = false }) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const ready = Boolean(subject && grade);

  const students = useApi(teacherStudentService.listMyStudents);
  const { run } = students;

  const params = useMemo(
    () => ({
      subject,
      grade,
      academicYearId: academicYearId || undefined,
      search: debouncedSearch || undefined,
      status: 'active',
      limit: LIMIT,
    }),
    [subject, grade, academicYearId, debouncedSearch]
  );
  const load = useCallback(() => run(params).catch(() => {}), [run, params]);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  const rows = useMemo(() => (ready && Array.isArray(students.data) ? students.data : []), [ready, students.data]);
  const selected = useMemo(() => new Set(value), [value]);
  const locked = useMemo(() => new Set(lockedIds), [lockedIds]);
  const scope = [grade, subject].filter(Boolean).join(' ');

  const allShownSelected = rows.length > 0 && rows.every((s) => selected.has(s.id));
  const someShownSelected = rows.some((s) => selected.has(s.id));

  const toggle = (id) => {
    if (locked.has(id)) return;
    onChange(selected.has(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  const toggleAll = () => {
    const shown = new Set(rows.map((s) => s.id));
    if (allShownSelected) onChange(value.filter((id) => !shown.has(id) || locked.has(id)));
    else onChange([...new Set([...value, ...shown])]);
  };

  const clear = () => onChange(value.filter((id) => locked.has(id)));

  if (!ready) {
    return (
      <p className="af-roster__note" style={{ marginTop: 0 }}>
        Choose a grade and subject in Grade &amp; curriculum to see your students.
      </p>
    );
  }

  const allLabel = debouncedSearch
    ? `Select all ${rows.length} matching student${rows.length === 1 ? '' : 's'}`
    : `Select all ${rows.length} student${rows.length === 1 ? '' : 's'} in ${scope}`;

  return (
    <div className="af-roster">
      <Input
        label="Students"
        type="search"
        placeholder={`Search ${scope} students`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        startAdornment={<LuSearch size={16} />}
        disabled={disabled}
        reserveHelper={false}
      />

      {students.isLoading && rows.length === 0 ? (
        <p className="af-roster__note">Loading students…</p>
      ) : students.error ? (
        <p className="af-roster__note">
          Couldn&apos;t load your students.
          <button type="button" onClick={load}>
            Try again
          </button>
        </p>
      ) : rows.length === 0 ? (
        <p className="af-roster__note">
          {debouncedSearch
            ? 'No students match that search.'
            : `You don't have any active students in ${scope} yet. Students appear once your school adds them to your classes.`}
        </p>
      ) : (
        <>
          <Checkbox
            className="af-roster__all"
            label={allLabel}
            checked={allShownSelected}
            indeterminate={someShownSelected && !allShownSelected}
            onChange={toggleAll}
            disabled={disabled}
          />
          <ul className="af-roster__list" aria-label={`${scope} students`}>
            {rows.map((s) => {
              const isLocked = locked.has(s.id);
              return (
                <li key={s.id}>
                  <label className={`af-roster__row ${isLocked ? 'af-roster__row--locked' : ''}`.trim()} title={isLocked ? 'Already started - can’t be removed' : undefined}>
                    <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} disabled={disabled || isLocked} />
                    <span>
                      <span className="af-roster__name">{formatName(s)}</span>
                      {s.email && <span className="af-roster__email"> · {s.email}</span>}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <p className="af-roster__note">
        {value.length === 0 ? (
          'No students picked yet. Pick at least one to publish.'
        ) : (
          <>
            {value.length} student{value.length === 1 ? '' : 's'} picked.
            {value.length > lockedIds.length && !disabled && (
              <button type="button" onClick={clear}>
                Clear
              </button>
            )}
          </>
        )}
      </p>
    </div>
  );
}
